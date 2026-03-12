'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Photo } from '@/types'
import ConfirmDialog from './ConfirmDialog'

export default function PhotoTable({ photos }: { photos: Photo[] }) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/admin/photos/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleteTarget(null)
    setDeleting(false)
    router.refresh()
  }

  if (photos.length === 0) {
    return <p className="text-gray-500 text-sm">No photos yet. Upload one to get started.</p>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-gray-500">
              <th className="pb-3 pr-4">Photo</th>
              <th className="pb-3 pr-4">Bird Name</th>
              <th className="pb-3 pr-4">Location</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Tags</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {photos.map((photo) => {
              const thumbUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_120/${photo.cloudinary_public_id}`
              return (
                <tr key={photo.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="py-3 pr-4">
                    <Image
                      src={thumbUrl}
                      alt={photo.bird_name}
                      width={60}
                      height={40}
                      className="object-cover rounded"
                      unoptimized
                    />
                  </td>
                  <td className="py-3 pr-4 text-white font-medium">{photo.bird_name}</td>
                  <td className="py-3 pr-4 text-gray-400">{photo.location ?? '—'}</td>
                  <td className="py-3 pr-4 text-gray-400">{photo.date_taken ?? '—'}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">
                    {photo.tags?.join(', ') || '—'}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-4">
                      <Link
                        href={`/admin/photos/${photo.id}/edit`}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(photo)}
                        className="text-xs text-red-600 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.bird_name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}
    </>
  )
}
