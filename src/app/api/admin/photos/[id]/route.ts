import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import cloudinary from '@/lib/cloudinary'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()

  const { bird_name, location, date_taken, camera, lens, tags } = body
  if (!bird_name?.trim()) return NextResponse.json({ error: 'Bird name is required.' }, { status: 400 })

  const db = createServiceClient()
  const { error } = await db
    .from('photos')
    .update({ bird_name, location: location || null, date_taken: date_taken || null, camera: camera || null, lens: lens || null, tags: tags ?? [] })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const db = createServiceClient()

  // Get cloudinary_public_id first
  const { data: photo } = await db.from('photos').select('cloudinary_public_id').eq('id', id).single()
  if (!photo) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 })

  // Delete from Cloudinary
  await cloudinary.uploader.destroy(photo.cloudinary_public_id).catch(() => {})

  // Delete from DB
  await db.from('photos').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
