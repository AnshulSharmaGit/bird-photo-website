# CLAUDE.md — Bird Photography Website

## Project Overview

A Next.js bird photography portfolio for Anshul's son. Public gallery with masonry layout, admin panel for photo management, and a Mac Photos daily sync script. All infrastructure runs on free tiers.

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PUBLIC USER                          │
│                    (any browser/device)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (hosting)                         │
│              Next.js 16 — App Router + Turbopack            │
│                                                             │
│  Public pages (ISR)        Admin pages (SSR, auth-gated)    │
│  /          gallery        /admin/login                     │
│  /contact   form           /admin/dashboard                 │
│                            /admin/photos                    │
│                            /admin/settings                  │
│                            /admin/sync-log                  │
│                                                             │
│  API routes (server-side, secrets never reach browser)      │
│  POST /api/contact         POST /api/admin/upload           │
│  GET/POST /api/admin/settings                               │
│  PATCH/DELETE /api/admin/photos/[id]                        │
└───────┬──────────────────────┬──────────────────────────────┘
        │                      │
        ▼                      ▼
┌───────────────┐    ┌─────────────────────┐
│   SUPABASE    │    │     CLOUDINARY      │
│  (database)   │    │   (image storage)   │
│               │    │                     │
│  photos       │    │  folder: bird-photos│
│  site_config  │    │  auto WebP + CDN    │
│  contact_subs │    │  f_auto,q_auto,w_800│
│  sync_logs    │    │                     │
│  + Auth       │    └─────────────────────┘
└───────────────┘
        ▲
        │ writes metadata
        │
┌─────────────────────────────────────────────────────────────┐
│              MAC PHOTOS SYNC (local Python script)          │
│                        run manually                         │
│                                                             │
│  Mac Photos Library                                         │
│  └── Album: "Nikon Birds & Wildlife"                        │
│       └── sync.py reads each photo                         │
│            → skip if UUID already in Supabase              │
│            → export to temp file (osxphotos)               │
│            → upload to Cloudinary                          │
│            → insert metadata row to Supabase               │
│            → log result                                     │
└─────────────────────────────────────────────────────────────┘
        │ alert on failure
        ▼
┌───────────────┐
│    RESEND     │
│  (email API)  │
│               │
│ contact form  │
│ sync alerts   │
└───────────────┘
```

## Sync Flow — Step by Step

When `sync/sync.py` runs (daily at 06:00 or manually):

```
1. Load sync/config.json
   └── album_name, Supabase credentials, Cloudinary credentials, Resend key

2. Connect to Supabase (service role key — full DB access)
   └── SELECT mac_photos_uuid FROM photos
   └── Build set of already-synced UUIDs

3. Open Mac Photos library via osxphotos
   └── Find album named "Nikon Birds & Wildlife"
   └── Abort with error email if album not found

4. For each photo in album:
   ├── UUID already in known set? → SKIP (idempotent)
   └── New photo:
       ├── Export to temp JPEG via osxphotos
       ├── Upload to Cloudinary (folder: bird-photos/, public_id: UUID)
       │   └── Retry up to 3 times: 2s / 4s / 8s backoff
       ├── Extract EXIF: date_taken, camera make+model
       ├── INSERT row into Supabase photos table
       │   └── bird_name defaults to filename (edit in admin panel later)
       └── Delete temp file

5. INSERT row into sync_logs table
   └── photos_added, photos_skipped, duration_seconds

6. Write entry to ~/Library/Logs/birdsite-sync.log

7. On any unhandled exception:
   └── Send alert email via Resend to alert_email
   └── INSERT error row into sync_logs
   └── Exit with code 1
```

**After sync completes:** Photos appear on the public gallery within 60 seconds (ISR revalidation). Bird names default to filenames — go to Admin → Photos to rename each species.

**Sync config lives at:** `sync/config.json` (chmod 600, gitignored)
**Album name configured:** `"Nikon Birds & Wildlife"`
**Logs:** `~/Library/Logs/birdsite-sync.log`
**Sync history in admin:** `/admin/sync-log`

**Known fix:** `convert_to_jpeg` parameter was removed in newer osxphotos versions. The export call uses only `use_photos_export=False, overwrite=True`. Cloudinary handles HEIC natively.

## Key Commands

```bash
# Development
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build (run before pushing to check for errors)
npm run lint      # ESLint check

# Sync & Identify (run from repo root, requires Terminal Full Disk Access)
python3 sync/sync.py                        # Upload new photos from Mac Photos → Cloudinary → Supabase
python3 sync/sync.py --dry-run             # Preview what would be uploaded without uploading
python3 sync/identify.py                   # AI-identify all unidentified photos (Gemini)
python3 sync/identify.py --dry-run --limit 5  # Preview identification without updating DB
tail -f ~/Library/Logs/birdsite-sync.log   # Watch sync logs in real time

# Git
git add . && git commit -m "message" && git push origin main  # Commit and push to GitHub/Vercel
```

**Note:** The automatic daily sync (launchd job) has been disabled. Run `python3 sync/sync.py` manually when you want to sync new photos.

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS 4 |
| Database + Auth | Supabase (Postgres + Row Level Security) |
| Image CDN | Cloudinary |
| Email | Resend |
| Hosting | Vercel |
| Mac Sync | Python + osxphotos (runs via launchd) |

## Environment Variables

All secrets live in `.env.local` (never commit this). See `.env.example` for the list of required keys:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used in API routes
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — image uploads
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — used client-side to build image URLs
- `RESEND_API_KEY` — contact form email delivery

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Public gallery (ISR, revalidate 60s)
│   ├── contact/page.tsx            # Contact form
│   ├── species/page.tsx            # Alphabetical species index
│   ├── species/[name]/page.tsx     # All photos for a specific species + lightbox
│   ├── admin/
│   │   ├── layout.tsx              # Admin shell with NavBar
│   │   ├── login/page.tsx          # Supabase email+password auth
│   │   ├── dashboard/page.tsx      # Stats
│   │   ├── photos/page.tsx         # Photo table with search
│   │   ├── photos/new/page.tsx     # Upload form
│   │   ├── photos/[id]/edit/       # Edit metadata (bird_name, description, location, tags…)
│   │   ├── settings/page.tsx       # Site config
│   │   └── sync-log/page.tsx       # Mac sync history
│   └── api/
│       ├── contact/route.ts        # Validates → DB → Resend email
│       └── admin/
│           ├── upload/route.ts     # Cloudinary upload → Supabase insert
│           ├── photos/[id]/route.ts # PATCH (edit, incl. description) / DELETE
│           └── settings/route.ts   # GET/POST site_config
├── components/
│   ├── public/                     # Gallery, Lightbox, FilterBar, NavBar, Footer, ContactForm
│   └── admin/                      # AdminNavBar, PhotoUploadForm, PhotoTable (with search),
│                                   # PhotoEditForm (with description field), SettingsForm, ConfirmDialog
├── lib/
│   ├── supabase/client.ts          # Browser Supabase client (@supabase/ssr)
│   ├── supabase/server.ts          # Server Supabase client (service role)
│   ├── cloudinary.ts               # Cloudinary config + buildImageUrl / buildThumbUrl helpers
│   ├── resend.ts                   # Resend client instance
│   └── exif.ts                     # Client-side EXIF extraction via exifr
├── middleware.ts                   # Auth guard for /admin/* and /api/admin/* routes
└── types/index.ts                  # Shared TypeScript interfaces (Photo, SiteConfig, etc.)

supabase/
└── schema.sql                      # Full DB schema — run once in Supabase SQL Editor

sync/
├── sync.py                         # Mac Photos → Cloudinary → Supabase daily sync
├── identify.py                     # Google Gemini AI bird identification + description
├── config.example.json             # Template for sync/config.json (secrets, album name)
├── install.sh                      # Installs Python deps + registers launchd job
└── com.birdsite.sync.plist         # launchd schedule (06:00 daily)
```

## Database Schema

Four tables in Supabase:
- **`photos`** — cloudinary_public_id, cloudinary_url, bird_name, description, location, date_taken, camera, lens, tags[], sort_order, mac_photos_uuid
- **`site_config`** — key/value pairs: site_title, photographer_name, feedback_email, about_blurb
- **`contact_submissions`** — audit trail of contact form messages
- **`sync_logs`** — history of Mac sync runs (count, errors, duration)

Row Level Security: public SELECT on photos + site_config; writes require service_role.

## Authentication

- Single admin user created in Supabase dashboard (Authentication → Users → Create user)
- Login at `/admin/login` uses `supabase.auth.signInWithPassword()`
- `src/middleware.ts` guards all `/admin/*` (except `/admin/login`) and `/api/admin/*` routes
- Session stored in cookies via `@supabase/ssr`

## Public Pages

| Route | Description |
|---|---|
| `/` | Gallery — all photos newest-first, masonry layout |
| `/species` | Alphabetical species index — one card per unique identified bird |
| `/species/[name]` | All photos for a species, click to open lightbox |
| `/contact` | Contact form |

Nav bar: **Gallery · Species · Contact**

## Image URLs

Always use `buildThumbUrl(publicId)` for gallery thumbnails and `buildImageUrl(publicId)` from `src/lib/cloudinary.ts`. These apply `f_auto,q_auto,w_800` transforms for WebP delivery via Cloudinary CDN.

## Known Gotchas

- **tsconfig.json was missing** on initial setup — was created manually. The `@/` path alias maps to `./src/`.
- **turbopack.root** must be set in `next.config.ts` because there is a `package-lock.json` in the parent home directory (`~/package-lock.json`) which confuses Next.js workspace root detection.
- **File upload picker**: Chrome blocks programmatic `input.click()` from non-direct user gestures. The upload form uses `<label htmlFor="photo-file-input">` which works natively in all browsers.
- **Grammarly hydration mismatch**: `suppressHydrationWarning` is set on `<body>` in `layout.tsx` to suppress false React hydration errors caused by Grammarly browser extension.
- **Supabase invite flow**: Supabase "Invite user" emails a magic link but doesn't set a password. Use "Create new user" with email + password directly in the Supabase dashboard instead.
- **Middleware deprecation warning**: Next.js 16 shows a warning about `middleware.ts` convention being renamed to `proxy.ts`. This is cosmetic only — middleware still works.

## Mac Photos Sync Setup

```bash
bash sync/install.sh          # Install deps + register launchd job
# Edit sync/config.json with album name + credentials
python3 sync/sync.py --dry-run  # Test without uploading
python3 sync/sync.py            # Run manually
```

Runs daily at 06:00. Logs at `~/Library/Logs/birdsite-sync.log`. Requires Terminal.app to have Full Disk Access (System Settings → Privacy & Security → Full Disk Access).

## Bird Identification Script

`sync/identify.py` reads photos from Supabase, sends each image to Google Gemini for visual identification, and updates `bird_name` + `description` in the database.

```bash
cd sync
python3 identify.py --dry-run --limit 5   # Preview without updating
python3 identify.py --limit 100           # Identify 100 photos
python3 identify.py                       # Identify all remaining
```

- Only processes photos where `bird_name` still looks like a camera filename (`_SIV*`, `SIV_*`, `IMG_*`, `TBD`)
- Manually renamed photos are skipped
- Logs to `~/Library/Logs/birdsite-identify.log`
- Requires `google_api_key` in `sync/config.json` (get from [aistudio.google.com/apikey](https://aistudio.google.com/apikey))
- Uses `gemini-2.5-flash` model
- The `description` column must exist: `ALTER TABLE photos ADD COLUMN IF NOT EXISTS description TEXT;`
- Gallery shows bird name + description as hover overlay (only for identified photos)

**Known issue:** Google free tier has `limit: 0` for some accounts/regions. Enable billing on Google Cloud project and generate a new API key.

## Database Schema (updated)

- `photos` table now includes `description TEXT` column added via: `ALTER TABLE photos ADD COLUMN IF NOT EXISTS description TEXT;`

## Deployment

- **Vercel**: Import `AnshulSharmaGit/bird-photo-website` from GitHub, add all 8 env vars, deploy.
- After deploying, update Supabase → Authentication → URL Configuration → Site URL to the Vercel URL.
- Every `git push` to `main` triggers an automatic Vercel redeploy.
