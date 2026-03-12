# Bird Photography Website — Setup Guide

## Step 1 — Supabase Schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Paste the entire contents of `supabase/schema.sql` and click **Run**

---

## Step 2 — Create Admin User

1. In Supabase dashboard → **Authentication** → **Users** → **Invite user**
2. Enter your email address and send the invite
3. Click the link in the email to set your password
4. This is the login you'll use at `/admin/login`

---

## Step 3 — Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard → top-left cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard → API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard → API Keys |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Same as `CLOUDINARY_CLOUD_NAME` |
| `RESEND_API_KEY` | Resend Dashboard → API Keys → Create API Key |

---

## Step 4 — Deploy to Vercel

```bash
# Push to GitHub first
git add .
git commit -m "Initial bird photography website"
git push
```

Then in Vercel:
1. Go to vercel.com → **Add New Project** → Import your GitHub repo
2. Framework preset: **Next.js** (auto-detected)
3. In **Environment Variables**, add all 8 variables from `.env.local`
4. Click **Deploy**

Your site will be live at `https://your-project.vercel.app`

---

## Step 5 — Configure Site Settings

1. Visit `https://your-project.vercel.app/admin/login`
2. Sign in with the email/password from Step 2
3. Go to **Settings**
4. Update:
   - Site Title (e.g. "Aarav's Bird Photography")
   - Photographer Name
   - Feedback Email (where contact form messages go)
   - About Blurb

---

## Step 6 — Mac Photos Sync Setup

```bash
# Install Python dependencies and register launchd job
bash sync/install.sh
```

Then edit `sync/config.json` (created by install.sh):

```json
{
  "album_name": "Bird Photography",   ← name of your Mac Photos album
  "supabase_url": "...",
  "supabase_service_role_key": "...",
  "cloudinary_cloud_name": "...",
  "cloudinary_api_key": "...",
  "cloudinary_api_secret": "...",
  "resend_api_key": "...",
  "alert_email": "your@email.com"
}
```

**Grant Full Disk Access to Terminal:**
1. System Settings → Privacy & Security → Full Disk Access
2. Click **+** → Add Terminal.app

**Test manually:**
```bash
python3 sync/sync.py --dry-run   # lists photos without uploading
python3 sync/sync.py             # actual upload
```

The sync runs automatically every morning at 06:00 AM.
Check logs at: `~/Library/Logs/birdsite-sync.log`

---

## How the sync works

1. Opens your Mac Photos library
2. Reads the album named in config
3. For each photo: if already uploaded (matched by UUID) → skip
4. Exports photo to JPEG (handles HEIC automatically)
5. Uploads to Cloudinary under folder `bird-photos/`
6. Saves metadata row to Supabase
7. **Note:** Bird name defaults to the filename — go to Admin → Photos to edit the correct species name

---

## Quick Reference

| URL | Purpose |
|---|---|
| `/` | Public gallery |
| `/contact` | Contact form |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Stats |
| `/admin/photos` | Manage photos |
| `/admin/photos/new` | Upload a photo |
| `/admin/settings` | Site settings + feedback email |
| `/admin/sync-log` | Mac sync history |
