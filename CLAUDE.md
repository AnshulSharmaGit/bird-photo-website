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
│                   runs daily at 06:00 via launchd           │
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
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build (run before pushing to check for errors)
npm run lint      # ESLint check
```

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
│   ├── admin/
│   │   ├── layout.tsx              # Admin shell with NavBar
│   │   ├── login/page.tsx          # Supabase email+password auth
│   │   ├── dashboard/page.tsx      # Stats
│   │   ├── photos/page.tsx         # Photo table
│   │   ├── photos/new/page.tsx     # Upload form
│   │   ├── photos/[id]/edit/       # Edit metadata
│   │   ├── settings/page.tsx       # Site config
│   │   └── sync-log/page.tsx       # Mac sync history
│   └── api/
│       ├── contact/route.ts        # Validates → DB → Resend email
│       └── admin/
│           ├── upload/route.ts     # Cloudinary upload → Supabase insert
│           ├── photos/[id]/route.ts # PATCH (edit) / DELETE
│           └── settings/route.ts   # GET/POST site_config
├── components/
│   ├── public/                     # Gallery, Lightbox, FilterBar, NavBar, Footer, ContactForm
│   └── admin/                      # AdminNavBar, PhotoUploadForm, PhotoTable, PhotoEditForm,
│                                   # SettingsForm, ConfirmDialog
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
├── config.example.json             # Template for sync/config.json (secrets, album name)
├── install.sh                      # Installs Python deps + registers launchd job
└── com.birdsite.sync.plist         # launchd schedule (06:00 daily)
```

## Database Schema

Four tables in Supabase:
- **`photos`** — cloudinary_public_id, cloudinary_url, bird_name, location, date_taken, camera, lens, tags[], sort_order, mac_photos_uuid
- **`site_config`** — key/value pairs: site_title, photographer_name, feedback_email, about_blurb
- **`contact_submissions`** — audit trail of contact form messages
- **`sync_logs`** — history of Mac sync runs (count, errors, duration)

Row Level Security: public SELECT on photos + site_config; writes require service_role.

## Authentication

- Single admin user created in Supabase dashboard (Authentication → Users → Create user)
- Login at `/admin/login` uses `supabase.auth.signInWithPassword()`
- `src/middleware.ts` guards all `/admin/*` (except `/admin/login`) and `/api/admin/*` routes
- Session stored in cookies via `@supabase/ssr`

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

## Deployment

- **Vercel**: Import `AnshulSharmaGit/bird-photo-website` from GitHub, add all 8 env vars, deploy.
- After deploying, update Supabase → Authentication → URL Configuration → Site URL to the Vercel URL.
- Every `git push` to `main` triggers an automatic Vercel redeploy.
