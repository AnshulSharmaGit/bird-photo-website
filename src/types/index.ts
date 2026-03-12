export interface Photo {
  id: string
  cloudinary_public_id: string
  cloudinary_url: string
  bird_name: string
  location: string | null
  date_taken: string | null
  camera: string | null
  lens: string | null
  tags: string[]
  sort_order: number
  mac_photos_uuid: string | null
  created_at: string
  updated_at: string
}

export interface SiteConfig {
  site_title: string
  photographer_name: string
  feedback_email: string
  about_blurb: string
}

export interface ContactFormData {
  name: string
  email: string
  message: string
}

export interface SyncLog {
  id: string
  run_at: string
  photos_added: number
  photos_skipped: number
  error_message: string | null
  duration_seconds: number | null
}
