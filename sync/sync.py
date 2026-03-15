#!/usr/bin/env python3
"""
Bird Photography Website — Mac Photos Sync Script
Reads a named album from the Mac Photos library, uploads new photos to
Cloudinary, and records metadata in Supabase.

Usage:
  python3 sync.py [--config /path/to/config.json] [--dry-run]

Requirements: pip install osxphotos cloudinary supabase
macOS: Terminal/Python must have Full Disk Access in System Settings.
"""

import argparse
import json
import logging
import os
import signal
import sys
import tempfile
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

import io

import cloudinary
import cloudinary.uploader
import osxphotos
from PIL import Image
from supabase import create_client

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_PATH = Path.home() / "Library" / "Logs" / "birdsite-sync.log"
LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("birdsite-sync")


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
def load_config(path: str) -> dict:
    with open(path) as f:
        cfg = json.load(f)
    required = [
        "album_name", "supabase_url", "supabase_service_role_key",
        "cloudinary_cloud_name", "cloudinary_api_key", "cloudinary_api_secret",
        "resend_api_key", "alert_email",
    ]
    missing = [k for k in required if not cfg.get(k)]
    if missing:
        raise ValueError(f"Missing config keys: {missing}")
    return cfg


# ---------------------------------------------------------------------------
# Alert email via Resend (raw HTTP, no extra dep)
# ---------------------------------------------------------------------------
def send_alert(cfg: dict, subject: str, body: str):
    import urllib.request, urllib.error
    payload = json.dumps({
        "from": "Bird Sync <onboarding@resend.dev>",
        "to": [cfg["alert_email"]],
        "subject": subject,
        "text": body,
    }).encode()
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {cfg['resend_api_key']}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        log.warning(f"Failed to send alert email: {e}")


# ---------------------------------------------------------------------------
# Timeout helper
# ---------------------------------------------------------------------------
@contextmanager
def timeout(seconds: int):
    def _handler(signum, frame):
        raise TimeoutError(f"Timed out after {seconds}s")
    old = signal.signal(signal.SIGALRM, _handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, old)


# ---------------------------------------------------------------------------
# Cloudinary upload with retry
# ---------------------------------------------------------------------------
def upload_with_retry(buffer: bytes, public_id: str, max_attempts=3) -> str:
    """Upload bytes to Cloudinary, retry on failure. Returns secure_url."""
    for attempt in range(1, max_attempts + 1):
        try:
            result = cloudinary.uploader.upload(
                buffer,
                public_id=public_id,
                folder="bird-photos",
                resource_type="image",
                overwrite=False,
            )
            return result["secure_url"]
        except Exception as e:
            err = str(e)
            if "Resource is invalid" in err or "Bad Request" in err:
                raise  # not retryable — corrupt/empty file
            if attempt == max_attempts:
                raise
            wait = 2 ** attempt
            log.warning(f"Upload attempt {attempt} failed ({e}), retrying in {wait}s…")
            time.sleep(wait)
    raise RuntimeError("Upload failed after all retries")  # unreachable


# ---------------------------------------------------------------------------
# Main sync logic
# ---------------------------------------------------------------------------
def sync(cfg: dict, dry_run: bool = False):
    start = time.time()
    photos_added = 0
    photos_skipped = 0

    # --- Connect to Supabase ---
    sb = create_client(cfg["supabase_url"], cfg["supabase_service_role_key"])

    # --- Fetch known UUIDs and cloudinary_public_ids (paginate past Supabase 1000-row limit) ---
    log.info("Fetching known photos from Supabase…")
    all_rows = []
    page_size = 1000
    offset = 0
    while True:
        resp = sb.table("photos").select("mac_photos_uuid,cloudinary_public_id").range(offset, offset + page_size - 1).execute()
        batch = resp.data or []
        all_rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    known_uuids = {row["mac_photos_uuid"] for row in all_rows if row.get("mac_photos_uuid")}
    known_public_ids = {row["cloudinary_public_id"] for row in all_rows if row.get("cloudinary_public_id")}
    log.info(f"  {len(all_rows)} photos in DB ({len(known_uuids)} with UUID)")

    # --- Configure Cloudinary ---
    cloudinary.config(
        cloud_name=cfg["cloudinary_cloud_name"],
        api_key=cfg["cloudinary_api_key"],
        api_secret=cfg["cloudinary_api_secret"],
    )

    # --- Open Photos library ---
    log.info("Opening Mac Photos library…")
    photosdb = osxphotos.PhotosDB()

    # Find album
    album_name = cfg["album_name"]
    matching = [a for a in photosdb.album_info if a.title == album_name]
    if not matching:
        raise ValueError(f"Album '{album_name}' not found in Mac Photos library")
    album = matching[0]

    photos = album.photos
    log.info(f"Found {len(photos)} photos in album '{album_name}'")

    with tempfile.TemporaryDirectory() as tmpdir:
        for photo in photos:
            uuid = photo.uuid

            if uuid in known_uuids or f"bird-photos/{uuid}" in known_public_ids:
                log.info(f"  SKIP  {photo.original_filename} ({uuid})")
                photos_skipped += 1
                continue

            log.info(f"  UPLOAD {photo.original_filename} ({uuid})")

            if dry_run:
                log.info("    [dry-run] would upload")
                photos_added += 1
                continue

            # Export photo to temp file (try native export first, fall back to Photos export)
            try:
                with timeout(30):
                    export_results = photo.export(tmpdir, use_photos_export=False, overwrite=True)
            except TimeoutError:
                export_results = []
                log.warning(f"    Native export timed out")

            if not export_results:
                log.info(f"    Native export failed, trying Photos export (60s timeout)…")
                try:
                    with timeout(60):
                        export_results = photo.export(tmpdir, use_photos_export=True, overwrite=True)
                except TimeoutError:
                    export_results = []
                    log.warning(f"    Photos export timed out, skipping {photo.original_filename}")

            if not export_results:
                log.warning(f"    Export failed for {photo.original_filename}, skipping")
                photos_skipped += 1
                continue

            exported_path = Path(export_results[0])

            # Read and compress image to stay under Cloudinary's 10 MB limit
            with open(exported_path, "rb") as f:
                image_bytes = f.read()

            if len(image_bytes) > 9 * 1024 * 1024:  # > 9 MB → compress
                try:
                    img = Image.open(io.BytesIO(image_bytes))
                    if img.mode not in ("RGB", "L"):
                        img = img.convert("RGB")
                    buf = io.BytesIO()
                    quality = 85
                    img.save(buf, format="JPEG", quality=quality, optimize=True)
                    # Reduce quality further if still too large
                    while buf.tell() > 9 * 1024 * 1024 and quality > 40:
                        quality -= 10
                        buf = io.BytesIO()
                        img.save(buf, format="JPEG", quality=quality, optimize=True)
                    image_bytes = buf.getvalue()
                    log.info(f"    Compressed to {len(image_bytes) // 1024} KB (quality={quality})")
                except Exception as e:
                    log.warning(f"    Cannot compress ({e}), file is {len(image_bytes) // 1024} KB")
                    if len(image_bytes) > 10 * 1024 * 1024:
                        log.warning(f"    Too large to upload without compression, skipping")
                        photos_skipped += 1
                        exported_path.unlink(missing_ok=True)
                        continue

            # Skip empty files before uploading
            if not image_bytes:
                log.warning(f"    Exported file is empty, skipping {photo.original_filename}")
                photos_skipped += 1
                continue

            # Upload to Cloudinary (use UUID as stable public_id)
            try:
                secure_url = upload_with_retry(image_bytes, public_id=uuid)
            except Exception as e:
                log.warning(f"    Upload failed for {photo.original_filename}: {e}, skipping")
                photos_skipped += 1
                exported_path.unlink(missing_ok=True)
                continue

            # Build metadata from EXIF
            date_taken = None
            camera = None
            if photo.date:
                date_taken = photo.date.strftime("%Y-%m-%d")
            if photo.exif_info:
                # osxphotos API varies by version: try newer names first, fall back to older
                exif = photo.exif_info
                make = getattr(exif, 'camera_make', None) or getattr(exif, 'make', None)
                model = getattr(exif, 'camera_model', None) or getattr(exif, 'model', None)
                camera_str = " ".join(p for p in [make, model] if p)
                camera = camera_str or None

            # Upsert into Supabase (ignore if cloudinary_public_id already exists)
            sb.table("photos").upsert({
                "cloudinary_public_id": f"bird-photos/{uuid}",
                "cloudinary_url": secure_url,
                "bird_name": photo.original_filename.rsplit(".", 1)[0],  # filename as default
                "location": None,
                "date_taken": date_taken,
                "camera": camera,
                "lens": None,
                "tags": [],
                "mac_photos_uuid": uuid,
            }, on_conflict="cloudinary_public_id", ignore_duplicates=True).execute()

            photos_added += 1
            log.info(f"    ✓ Uploaded and saved")

            # Clean up temp file
            exported_path.unlink(missing_ok=True)

    duration = round(time.time() - start, 1)
    log.info(f"Done. Added={photos_added}  Skipped={photos_skipped}  Duration={duration}s")

    # --- Write sync log to Supabase ---
    if not dry_run:
        sb.table("sync_logs").insert({
            "photos_added": photos_added,
            "photos_skipped": photos_skipped,
            "duration_seconds": duration,
        }).execute()

    return photos_added, photos_skipped


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Sync Mac Photos album to bird website")
    parser.add_argument(
        "--config",
        default=str(Path(__file__).parent / "config.json"),
        help="Path to config.json (default: sync/config.json)",
    )
    parser.add_argument("--dry-run", action="store_true", help="List photos without uploading")
    args = parser.parse_args()

    log.info("=" * 60)
    log.info(f"Bird Site Sync  {'[DRY RUN] ' if args.dry_run else ''}started")

    try:
        cfg = load_config(args.config)
        sync(cfg, dry_run=args.dry_run)
    except Exception as e:
        log.error(f"Sync FAILED: {e}", exc_info=True)
        try:
            cfg_for_alert = load_config(args.config)
            send_alert(cfg_for_alert, "Bird Site Sync Failed", f"Error:\n{e}")
        except Exception:
            pass
        # Write error to sync_logs if we have DB access
        try:
            sb = create_client(cfg["supabase_url"], cfg["supabase_service_role_key"])
            sb.table("sync_logs").insert({"error_message": str(e)}).execute()
        except Exception:
            pass
        sys.exit(1)


if __name__ == "__main__":
    main()
