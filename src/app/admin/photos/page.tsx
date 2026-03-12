import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PhotoTableClient from '@/components/admin/PhotoTable'
import type { Photo } from '@/types'

export default async function PhotosPage() {
  const db = createServiceClient()
  const { data: photos } = await db
    .from('photos')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white text-2xl font-light">Photos</h1>
        <Link
          href="/admin/photos/new"
          className="px-4 py-2 bg-white text-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
        >
          + Upload
        </Link>
      </div>
      <PhotoTableClient photos={(photos ?? []) as Photo[]} />
    </div>
  )
}
