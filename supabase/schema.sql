-- ============================================================
-- Bird Photography Website — Supabase Schema
-- Run this entire file in the Supabase SQL Editor once.
-- ============================================================

-- Photo metadata
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloudinary_public_id TEXT NOT NULL UNIQUE,
  cloudinary_url TEXT NOT NULL,
  bird_name TEXT NOT NULL,
  location TEXT,
  date_taken DATE,
  camera TEXT,
  lens TEXT,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  mac_photos_uuid TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Site configuration (key/value pairs)
CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO site_config (key, value) VALUES
  ('site_title', 'Bird Photography'),
  ('photographer_name', 'Photographer'),
  ('feedback_email', 'your@email.com'),
  ('about_blurb', 'A curated collection of bird photographs.')
ON CONFLICT (key) DO NOTHING;

-- Contact form submissions (audit trail)
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Mac Photos sync job history
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ DEFAULT now(),
  photos_added INTEGER DEFAULT 0,
  photos_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  duration_seconds NUMERIC
);

-- Auto-update updated_at on photos
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Public can read photos and site_config
CREATE POLICY "Public read photos"
  ON photos FOR SELECT USING (true);

CREATE POLICY "Public read site_config"
  ON site_config FOR SELECT USING (true);

-- Only service_role can write (used by API routes and sync script)
CREATE POLICY "Service role all on photos"
  ON photos FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role all on site_config"
  ON site_config FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role all on contact_submissions"
  ON contact_submissions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role all on sync_logs"
  ON sync_logs FOR ALL USING (auth.role() = 'service_role');
