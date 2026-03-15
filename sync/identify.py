#!/usr/bin/env python3
"""
Bird/Animal Auto-Identification Script
Reads photos from Supabase, sends each image to Google Gemini for visual
identification, and updates bird_name + description in the database.

Usage:
  python3 identify.py [--config /path/to/config.json] [--limit N] [--dry-run]

Requirements:
  pip install google-generativeai supabase
  Add "google_api_key" to sync/config.json
  Get a free key at: https://aistudio.google.com/apikey
"""

import argparse
import json
import logging
import re
import sys
import time
from pathlib import Path

import requests
from google import genai
from google.genai import types
from supabase import create_client

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_PATH = Path.home() / "Library" / "Logs" / "birdsite-identify.log"
LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("birdsite-identify")

# Filename patterns that indicate bird_name hasn't been set yet
FILENAME_PATTERN = re.compile(r'^(_SIV|SIV_|IMG_|20[0-9]{6}|TBD$)', re.IGNORECASE)


def looks_like_filename(name: str) -> bool:
    return bool(FILENAME_PATTERN.match(name)) or name == "TBD"


def identify_photo(client: genai.Client, image_url: str) -> dict:
    """Send image to Gemini and get species name + description."""
    resp = requests.get(image_url, timeout=30)
    resp.raise_for_status()
    image_data = resp.content
    mime_type = resp.headers.get("Content-Type", "image/jpeg").split(";")[0]

    prompt = (
        "This is a wildlife photograph. Identify the main subject "
        "(bird or animal species). "
        "Respond with ONLY valid JSON in this exact format:\n"
        '{"bird_name": "Common Species Name", "description": "One or two sentences about this species."}\n'
        "If you cannot identify the subject, use: "
        '{"bird_name": "Unknown", "description": ""}'
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=image_data, mime_type=mime_type),
            prompt,
        ],
    )

    raw = response.text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)

    return json.loads(raw)


def run(cfg: dict, limit: int | None, dry_run: bool):
    sb = create_client(cfg["supabase_url"], cfg["supabase_service_role_key"])

    client = genai.Client(api_key=cfg["google_api_key"])

    # Fetch all photos (paginate past Supabase 1000-row limit)
    all_photos = []
    page_size = 1000
    offset = 0
    while True:
        resp = sb.table("photos").select("id,bird_name,cloudinary_url,description").range(offset, offset + page_size - 1).execute()
        batch = resp.data or []
        all_photos.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size

    # Process photos with filename-like names OR missing description
    to_process = [p for p in all_photos if looks_like_filename(p["bird_name"]) or not p.get("description")]

    if limit:
        to_process = to_process[:limit]

    log.info(f"{'[DRY RUN] ' if dry_run else ''}Found {len(to_process)} photos to identify")

    updated = 0
    failed = 0

    for photo in to_process:
        photo_id = photo["id"]
        current_name = photo["bird_name"]
        image_url = photo["cloudinary_url"]

        log.info(f"  Identifying {current_name} ({photo_id[:8]}…)")

        if dry_run:
            log.info(f"    [dry-run] would call Gemini with {image_url}")
            continue

        for attempt in range(3):
            try:
                result = identify_photo(client, image_url)
                bird_name = result.get("bird_name", "Unknown").strip()
                description = result.get("description", "").strip()

                log.info(f"    → {bird_name}: {description[:70]}{'…' if len(description) > 70 else ''}")

                sb.table("photos").update({
                    "bird_name": bird_name,
                    "description": description,
                }).eq("id", photo_id).execute()

                updated += 1
                break

            except Exception as e:
                if "429" in str(e) and attempt < 2:
                    wait = 60 * (attempt + 1)
                    log.warning(f"    Rate limited, waiting {wait}s before retry…")
                    time.sleep(wait)
                else:
                    log.warning(f"    Failed: {e}")
                    failed += 1
                    break

        time.sleep(10)

    log.info(f"Done. Updated={updated}  Failed={failed}")


def main():
    parser = argparse.ArgumentParser(description="Auto-identify birds/animals using Google Gemini")
    parser.add_argument(
        "--config",
        default=str(Path(__file__).parent / "config.json"),
        help="Path to config.json (default: sync/config.json)",
    )
    parser.add_argument("--limit", type=int, default=None, help="Max photos to process")
    parser.add_argument("--dry-run", action="store_true", help="Preview without updating DB")
    args = parser.parse_args()

    with open(args.config) as f:
        cfg = json.load(f)

    if not cfg.get("google_api_key"):
        log.error("Missing 'google_api_key' in config.json — get a free key at https://aistudio.google.com/apikey")
        sys.exit(1)

    log.info("=" * 60)
    log.info(f"Bird Identify  {'[DRY RUN] ' if args.dry_run else ''}started")

    run(cfg, limit=args.limit, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
