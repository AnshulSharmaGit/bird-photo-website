# Bird Photography Website — Complete Plan

## Context

Build a free, internet-accessible website to showcase bird photographs taken by Anshul's son. The site needs a public gallery, contact/feedback page, a protected admin panel, and a daily Mac Photos sync job. Everything must run on free tiers.

---

## Tech Stack (All Free)

| Layer | Tool | Free Tier |
|---|---|---|
| Frontend + API | Next.js 14 + Tailwind CSS | — |
| Hosting | Vercel | 100 GB bandwidth/month |
| Image Storage + CDN | Cloudinary | 25 GB storage |
| Database + Auth | Supabase | 500 MB Postgres + Auth |
| Email (Contact Form) | Resend | 3,000 emails/month |
| Mac Sync | Python + osxphotos + launchd | Free (local) |
| Version Control | GitHub | Free |

**Why these choices:**
- **Cloudinary** is purpose-built for images — auto-WebP conversion, CDN delivery, URL-based transforms
- **Supabase** gives Postgres + Auth in one free tier (no need for separate auth service)
- **Vercel** has zero-config Next.js support with automatic HTTPS and global CDN
- **osxphotos** reads the Mac Photos library natively without any Apple API access

---

## User Stories

### Public Visitor

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-PV-01 | View responsive photo grid on homepage (no login) | Gallery loads within 2s; no login required |
| US-PV-02 | Click photo → fullscreen lightbox with bird name, location, date | Lightbox opens with large image and metadata |
| US-PV-03 | Close lightbox with Escape, return to same scroll position | Escape or X closes lightbox; scroll position preserved |
| US-PV-04 | Filter photos by species/tag chips | Clicking chip filters instantly; "All" resets |
| US-PV-05 | Site works on mobile (1-col), tablet (2-col), desktop (3-col masonry) | Responsive at all breakpoints |
| US-PV-06 | Submit contact/feedback form → email sent to configured address | Success message shown; email delivered |
| US-PV-07 | Photos load fast (WebP via Cloudinary CDN, lazy loading) | LCP < 2.5s on 4G; images lazy-loaded |

### Admin

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-AD-01 | Login with email+password at /admin/login | Valid creds → /admin/dashboard; invalid → error |
| US-AD-02 | Upload photo (drag-drop or file picker; JPEG/PNG/HEIC accepted) | Photo appears in gallery within 60s |
| US-AD-03 | Enter metadata: bird name (required), location, date, camera/lens, tags | Required field validation enforced |
| US-AD-04 | EXIF auto-populated from uploaded photo | Date and camera fields pre-filled from EXIF |
| US-AD-05 | Delete photo (with confirmation) → removed from Cloudinary + Supabase | Both storage and DB records deleted |
| US-AD-06 | Edit metadata for existing photos | Changes reflected on public gallery immediately |
| US-AD-07 | Configure feedback email address in Settings | Contact form delivers to new address |
| US-AD-08 | Configure site title, photographer name, about text | Changes reflected on public site |
| US-AD-09 | View sync job history (last run, photos added, errors) | Sync log page shows history table |
| US-AD-10 | All /admin/* routes blocked for unauthenticated users | Unauthenticated requests redirect to /admin/login |

### Mac Sync Job

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-SY-01 | Daily automatic sync via launchd (no manual trigger needed) | Script runs at 06:00 daily without user interaction |
| US-SY-02 | Only upload photos not already on site (deduplication by UUID) | Re-running sync uploads 0 duplicate photos |
| US-SY-03 | Sync from a specific named Mac Photos album | Only photos in configured album are published |
| US-SY-04 | Write logs to ~/Library/Logs/birdsite-sync.log | Log entry written after each run |
| US-SY-05 | Send email alert on sync failure | Alert email sent before script exits with error |

---

## UI Design Options

### Option A: Dark Minimalist (Recommended)

Dark backgrounds make bird photo colors pop — the standard for professional photography portfolios.

- **Background:** Near-black `#0d0d0d`
- **Gallery:** CSS masonry grid, 4px gaps — 3-col desktop / 2-col tablet / 1-col mobile
- **Hover:** Subtle brightness increase only (no heavy overlays)
- **Lightbox:** Full-screen overlay, photo centered, metadata in white/gray text below, keyboard navigation
- **Contact page:** Centered form max 480px, underline-only input borders, white submit button
- **Typography:** Inter for UI, Playfair Display for site title only

### Option B: Clean White / Editorial

Newspaper editorial feel; good if species text is as important as the photo.

- White/off-white background (`#fafaf8`)
- Strict 3-col equal-width grid, photos cropped to 4:3 ratio
- Species name + location in small text below each thumbnail
- Detail view: 65% photo left / 35% metadata panel right
- Typography: Lora (serif) headings, Inter body

### Option C: Full-Screen Immersive

One photo at a time, treats each image as art. Best for very small curated collections.

- Full-viewport hero photo fills the screen
- Vertical thumbnail strip on the right (6–7 visible)
- Clicking thumbnail swaps main photo with CSS transition
- Separate /gallery page for grid browsing

---

## Test Cases

### Gallery (TC-GAL)

| ID | Test | Expected Result |
|---|---|---|
| TC-GAL-01 | Gallery loads on desktop | 3-col grid renders within 2s |
| TC-GAL-02 | Gallery loads on 375px mobile | 1-col layout, photos full-width |
| TC-GAL-03 | Lazy loading | Images below fold only load when near viewport |
| TC-GAL-04 | Click photo | Lightbox opens with full-size photo |
| TC-GAL-05 | Lightbox metadata | Bird name, location, date visible |
| TC-GAL-06 | Lightbox keyboard nav | Right arrow loads next photo |
| TC-GAL-07 | Escape closes lightbox | Lightbox closes; scroll position preserved |
| TC-GAL-08 | Filter by species | Only matching photos shown |
| TC-GAL-09 | Filter reset | "All" chip shows all photos |
| TC-GAL-10 | Empty gallery | "No photos yet" message shown |
| TC-GAL-11 | WebP delivery | Images served as `image/webp` content-type |
| TC-GAL-12 | No auth required | Gallery loads without being logged in |

### Contact Form (TC-CON)

| ID | Test | Expected Result |
|---|---|---|
| TC-CON-01 | Submit empty form | Required field errors shown |
| TC-CON-02 | Invalid email format | Email format error shown |
| TC-CON-03 | Successful submission | Success message shown; email received at configured address |
| TC-CON-04 | Email content | Email contains sender name, email, and message |
| TC-CON-05 | Spam protection | Rate limiting or honeypot blocks repeated submissions |
| TC-CON-06 | Long message (2000 chars) | Accepted and sent correctly |

### Admin Authentication (TC-AUTH)

| ID | Test | Expected Result |
|---|---|---|
| TC-AUTH-01 | Valid login | Redirect to /admin/dashboard |
| TC-AUTH-02 | Invalid password | "Invalid credentials" error |
| TC-AUTH-03 | Direct URL without login | Redirect to /admin/login |
| TC-AUTH-04 | Unauthenticated API call | 401 Unauthorized response |
| TC-AUTH-05 | Logout | Cookie cleared; redirect to / |
| TC-AUTH-06 | Session persistence | Login survives browser close/reopen |

### Photo Management (TC-PHO)

| ID | Test | Expected Result |
|---|---|---|
| TC-PHO-01 | Upload JPEG | Photo appears in gallery |
| TC-PHO-02 | Upload PNG | Accepted and displayed |
| TC-PHO-03 | Upload HEIC (iPhone photo) | Converted and displayed |
| TC-PHO-04 | Upload file > 20MB | Error: file too large |
| TC-PHO-05 | Upload invalid type (.pdf) | Error: invalid file type |
| TC-PHO-06 | Upload without bird name | Required field validation error |
| TC-PHO-07 | Upload photo with EXIF | Date and camera fields auto-filled |
| TC-PHO-08 | Delete photo | Removed from gallery and Cloudinary |
| TC-PHO-09 | Delete then cancel | No action taken |
| TC-PHO-10 | Edit metadata | Updated name shows in gallery immediately |

### Admin Settings (TC-SET)

| ID | Test | Expected Result |
|---|---|---|
| TC-SET-01 | Change feedback email | Contact form sends to new address |
| TC-SET-02 | Change site title | New title shows in browser tab and header |
| TC-SET-03 | Settings persist after logout | Settings still show saved values on re-login |

### Mac Sync Job (TC-SYN)

| ID | Test | Expected Result |
|---|---|---|
| TC-SYN-01 | First-time sync | All album photos uploaded |
| TC-SYN-02 | Re-run sync (idempotent) | 0 new uploads; no duplicates |
| TC-SYN-03 | Add photo to album, re-run | New photo uploaded; existing skipped |
| TC-SYN-04 | Album name not found | Error logged; alert email sent; exit code 1 |
| TC-SYN-05 | No internet connection | Retry logic attempted; error logged |
| TC-SYN-06 | Log file written | Entry in ~/Library/Logs/birdsite-sync.log |
| TC-SYN-07 | launchd scheduling | Script runs automatically at 06:00 |
| TC-SYN-08 | EXIF extracted | Date taken and camera model saved to Supabase |

### Performance (TC-PERF)

| ID | Test | Expected Result |
|---|---|---|
| TC-PERF-01 | Lighthouse score | Performance score ≥ 85 |
| TC-PERF-02 | LCP measurement | < 2.5s on simulated 4G |
| TC-PERF-03 | Delivered image size | No image > 300KB (Cloudinary q_auto, w_800) |

---

## Implementation Plan

### Phase 0 — Accounts & Prerequisites (2h)

1. Create GitHub repo `bird-photo-website`
2. Sign up and configure:
   - **Vercel** — connect GitHub account
   - **Supabase** — create project named `bird-photos`
   - **Cloudinary** — note cloud_name, api_key, api_secret
   - **Resend** — verify sending domain or use test domain
3. Install on Mac:
   - Node.js 20 LTS
   - Python 3.11+
   - `pip install osxphotos cloudinary supabase`

---

### Phase 1 — Database Schema (1h)

Run in Supabase SQL Editor:

```sql
-- Photo metadata
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloudinary_public_id TEXT NOT NULL UNIQUE,
  cloudinary_url TEXT NOT NULL,
  bird_name TEXT NOT NULL,
  location TEXT,
  date_taken DATE,
  camera TEXT,
  lens TEXT,
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  mac_photos_uuid TEXT UNIQUE,   -- sync deduplication key
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Site configuration (key/value)
CREATE TABLE site_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO site_config VALUES
  ('site_title', 'Bird Photography'),
  ('photographer_name', 'Photographer Name'),
  ('feedback_email', 'your@email.com'),
  ('about_blurb', 'A collection of bird photographs.');

-- Contact form audit trail
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Sync job history
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ DEFAULT now(),
  photos_added INTEGER DEFAULT 0,
  photos_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  duration_seconds NUMERIC
);

-- Row Level Security
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON photos FOR SELECT USING (true);
CREATE POLICY "Service role write" ON photos USING (auth.role() = 'service_role');

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON site_config FOR SELECT USING (true);
CREATE POLICY "Service role write" ON site_config USING (auth.role() = 'service_role');
```

---

### Phase 2 — Next.js Project Setup (2h)

```bash
npx create-next-app@latest bird-photo-website \
  --typescript --tailwind --eslint --app --src-dir
cd bird-photo-website
npm install @supabase/supabase-js @supabase/ssr cloudinary resend exifr
```

Create `.env.local` (never commit this file):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
RESEND_API_KEY=re_xxx
```

---

### Phase 3 — Public Gallery (4h)

- **`/` homepage** — ISR with `revalidate: 60` (new photos appear within 1 minute), CSS masonry grid, species filter chips
- **Lightbox component** — client-side React state, keyboard handlers (Escape, arrow keys), prev/next navigation
- **`/contact` page** — React Hook Form for client validation, calls `/api/contact` server route
- **Shared components** — NavBar, Footer
- Use Next.js `<Image>` with Cloudinary URLs: append `f_auto,q_auto,w_800` for CDN-optimized WebP delivery

---

### Phase 4 — Admin Authentication (2h)

1. Create one admin user in Supabase Auth dashboard (Dashboard → Authentication → Users → Invite)
2. Build `/admin/login` page calling `supabase.auth.signInWithPassword()`
3. Create `src/middleware.ts` (Edge Runtime) — intercepts all `/admin/*` and `/api/admin/*` routes, validates session cookie, redirects unauthenticated requests to `/admin/login`

---

### Phase 5 — Admin Dashboard & Photo Management (5h)

**Pages:**
- `/admin/dashboard` — stats (photo count, storage, last sync)
- `/admin/photos` — table with Edit and Delete buttons
- `/admin/photos/new` — drag-drop upload form + metadata fields
- `/admin/photos/[id]/edit` — pre-populated edit form
- `/admin/settings` — site config form
- `/admin/sync-log` — sync history table

**API Routes** (all server-side; secrets never reach browser):

| Route | Method | Action |
|---|---|---|
| `/api/admin/upload` | POST | Multipart → Cloudinary upload → Supabase insert |
| `/api/admin/photos/[id]` | DELETE | Cloudinary delete by public_id + Supabase delete |
| `/api/admin/photos/[id]` | PATCH | Update Supabase metadata row |
| `/api/contact` | POST | Validate → store → send via Resend |
| `/api/admin/settings` | GET/POST | Read/write site_config table |

---

### Phase 6 — Contact Form Email (1h)

`/api/contact` route:
1. Server-side validate name, email, message
2. Insert row into `contact_submissions`
3. Read `feedback_email` from `site_config`
4. Send email via Resend SDK
5. Return success or error JSON

---

### Phase 7 — Vercel Deployment (2h)

1. Push code to GitHub
2. Import repo in Vercel dashboard → framework preset: Next.js
3. Add all `.env.local` keys as Vercel environment variables
4. Deploy → auto-assigned `*.vercel.app` domain with HTTPS
5. Test all features end-to-end in production

---

### Phase 8 — Mac Sync Script (3h)

**`sync/sync.py` — Algorithm:**

```
1. Load sync/config.json
2. Query Supabase → set of all known mac_photos_uuid values
3. Open Mac Photos library via osxphotos
4. Find album by configured name
5. For each photo in album:
   a. If UUID already known → skip
   b. Export photo to temp file (osxphotos handles HEIC→JPEG)
   c. Extract EXIF (date, camera, lens)
   d. Upload to Cloudinary (folder: bird-photos, public_id: UUID)
   e. Insert row into Supabase photos table
   f. Delete temp file
6. Write entry to sync_logs table
7. Write to ~/Library/Logs/birdsite-sync.log
8. On unhandled exception → send Resend alert email → exit 1
```

**Retry logic:** 3 attempts with 2s/4s/8s backoff on Cloudinary upload failures

**`sync/config.json`** (chmod 600, in .gitignore):
```json
{
  "album_name": "Bird Photography",
  "supabase_url": "https://xxx.supabase.co",
  "supabase_service_role_key": "eyJ...",
  "cloudinary_cloud_name": "xxx",
  "cloudinary_api_key": "xxx",
  "cloudinary_api_secret": "xxx",
  "resend_api_key": "re_xxx",
  "alert_email": "your@email.com"
}
```

**`sync/com.birdsite.sync.plist`** — launchd daily schedule at 06:00:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.birdsite.sync</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/python3</string>
    <string>/Users/USERNAME/repos/bird-photo-website/sync/sync.py</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>6</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>/Users/USERNAME/Library/Logs/birdsite-sync.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/USERNAME/Library/Logs/birdsite-sync-error.log</string>
</dict>
</plist>
```

**Install:**
```bash
cp sync/com.birdsite.sync.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.birdsite.sync.plist
```

**macOS Permission Required:** System Settings → Privacy & Security → Full Disk Access → add Terminal.app (or the Python executable)

---

### Phase 9 — Polish & Testing (3h)

- Run all test cases from this document
- Lighthouse audit; fix any score below 85
- Test on a real mobile device
- Add `robots.txt` and Open Graph `<meta>` tags

---

## Project File Structure

```
bird-photo-website/
├── .env.local                              # Secrets — NEVER commit
├── .env.example                            # Template with placeholder values
├── .gitignore                              # Includes .env.local, sync/config.json
├── next.config.ts
├── tailwind.config.ts
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Root layout
│   │   ├── page.tsx                        # Public gallery (ISR)
│   │   ├── contact/
│   │   │   └── page.tsx                    # Contact form
│   │   ├── admin/
│   │   │   ├── layout.tsx                  # Admin layout wrapper
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── photos/page.tsx
│   │   │   ├── photos/new/page.tsx
│   │   │   ├── photos/[id]/edit/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── sync-log/page.tsx
│   │   └── api/
│   │       ├── contact/route.ts
│   │       └── admin/
│   │           ├── upload/route.ts
│   │           ├── photos/[id]/route.ts
│   │           └── settings/route.ts
│   │
│   ├── components/
│   │   ├── public/
│   │   │   ├── Gallery.tsx                 # Masonry grid
│   │   │   ├── PhotoCard.tsx               # Thumbnail with hover
│   │   │   ├── Lightbox.tsx                # Fullscreen viewer
│   │   │   ├── FilterBar.tsx               # Species/tag chips
│   │   │   ├── ContactForm.tsx             # Contact form
│   │   │   ├── NavBar.tsx
│   │   │   └── Footer.tsx
│   │   └── admin/
│   │       ├── AdminNavBar.tsx
│   │       ├── PhotoUploadForm.tsx
│   │       ├── PhotoEditForm.tsx
│   │       ├── PhotoTable.tsx
│   │       ├── SettingsForm.tsx
│   │       ├── SyncLogTable.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   # Browser client
│   │   │   ├── server.ts                   # Server client (service role)
│   │   │   └── types.ts                    # DB type definitions
│   │   ├── cloudinary.ts
│   │   ├── resend.ts
│   │   └── exif.ts                         # EXIF extraction helper
│   │
│   ├── types/index.ts                      # Shared TypeScript interfaces
│   └── middleware.ts                       # Auth guard — critical security file
│
├── public/
│   ├── favicon.ico
│   └── robots.txt
│
├── sync/                                   # Mac Photos sync (Python)
│   ├── sync.py
│   ├── config.json                         # SECRETS — chmod 600, in .gitignore
│   ├── config.example.json
│   ├── requirements.txt
│   ├── com.birdsite.sync.plist
│   ├── install.sh
│   └── README.md
│
└── docs/
    ├── PhotoApp.md
    ├── PhotoappTODO.md
    └── BirdSiteplan.md                     # This file
```

---

## Verification Checklist

- [ ] Public gallery loads at Vercel URL, photos in grid, click opens lightbox, Escape returns to gallery
- [ ] Contact form submission → email arrives at configured address
- [ ] Admin login at /admin/login → dashboard; wrong password → error
- [ ] Direct /admin/dashboard without login → redirected to /admin/login
- [ ] Upload a photo in admin → appears on public gallery within 60 seconds
- [ ] Delete a photo in admin → gone from gallery and Cloudinary
- [ ] Change feedback_email in settings → re-test contact form delivery to new address
- [ ] Run `python sync/sync.py` manually → photo appears on site, entry in sync-log page
- [ ] Run sync again → 0 new uploads (idempotent)
- [ ] Check `~/Library/Logs/birdsite-sync.log` next morning at 06:00
- [ ] Lighthouse score ≥ 85; images delivered as WebP; no image > 300KB
- [ ] Site renders correctly on iPhone (1-col layout)
