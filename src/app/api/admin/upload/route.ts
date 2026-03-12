import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import cloudinary from '@/lib/cloudinary'

export const maxDuration = 60 // Allow up to 60s for large uploads

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 20 MB).' }, { status: 400 })

  const bird_name = (form.get('bird_name') as string)?.trim()
  if (!bird_name) return NextResponse.json({ error: 'Bird name is required.' }, { status: 400 })

  // Convert File to Buffer for Cloudinary upload
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload to Cloudinary
  const uploadResult = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'bird-photos', resource_type: 'image' },
      (error, result) => {
        if (error || !result) reject(error ?? new Error('Upload failed'))
        else resolve({ public_id: result.public_id, secure_url: result.secure_url })
      }
    ).end(buffer)
  })

  const location = (form.get('location') as string)?.trim() || null
  const date_taken = (form.get('date_taken') as string)?.trim() || null
  const camera = (form.get('camera') as string)?.trim() || null
  const lens = (form.get('lens') as string)?.trim() || null
  const tagsRaw = (form.get('tags') as string) ?? ''
  const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)

  const db = createServiceClient()
  const { error: dbError } = await db.from('photos').insert({
    cloudinary_public_id: uploadResult.public_id,
    cloudinary_url: uploadResult.secure_url,
    bird_name,
    location,
    date_taken,
    camera,
    lens,
    tags,
  })

  if (dbError) {
    // Rollback Cloudinary upload
    await cloudinary.uploader.destroy(uploadResult.public_id).catch(() => {})
    return NextResponse.json({ error: 'Database error.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
