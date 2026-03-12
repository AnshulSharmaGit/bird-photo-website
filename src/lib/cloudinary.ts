import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

// Build a CDN-optimised URL for a given public_id
export function buildImageUrl(publicId: string, width = 800): string {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    width,
    crop: 'limit',
    secure: true,
  })
}

// Thumbnail version (for gallery grid)
export function buildThumbUrl(publicId: string, width = 600): string {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    width,
    crop: 'limit',
    secure: true,
  })
}
