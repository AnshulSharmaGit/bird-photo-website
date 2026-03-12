import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PhotoEditForm from '@/components/admin/PhotoEditForm'
import type { Photo } from '@/types'

export default async function EditPhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  const { data: photo } = await db.from('photos').select('*').eq('id', id).single()

  if (!photo) notFound()

  return (
    <div>
      <h1 className="text-white text-2xl font-light mb-8">Edit Photo</h1>
      <PhotoEditForm photo={photo as Photo} />
    </div>
  )
}
