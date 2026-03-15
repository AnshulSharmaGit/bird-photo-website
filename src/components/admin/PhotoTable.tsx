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
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const filtered = search.trim()
    ? photos.filter((p) =>
        p.bird_name.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.toLowerCase().includes(search.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : photos

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id))

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((p) => next.delete(p.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((p) => next.add(p.id))
        return next
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/admin/photos/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleteTarget(null)
    setDeleting(false)
    router.refresh()
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    await Promise.all(
      [...selected].map((id) => fetch(`/api/admin/photos/${id}`, { method: 'DELETE' }))
    )
    setSelected(new Set())
    setBulkDeleting(false)
    setShowBulkConfirm(false)
    router.refresh()
  }

  if (photos.length === 0) {
    return <p className="text-gray-500 text-sm">No photos yet. Upload one to get started.</p>
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <input
          type="search"
          placeholder="Search by bird name, location or tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-transparent border border-white/20 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-white/50 text-sm"
        />
        {selected.size > 0 && (
          <button
            onClick={() => setShowBulkConfirm(true)}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-xs uppercase tracking-widest transition-colors"
          >
            Delete {selected.size} selected
          </button>
        )}
        {search && (
          <p className="w-full text-gray-500 text-xs mt-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-gray-500">
              <th className="pb-3 pr-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="pb-3 pr-4">Photo</th>
              <th className="pb-3 pr-4">Bird Name</th>
              <th className="pb-3 pr-4">Location</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Tags</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((photo) => {
              const thumbUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_120/${photo.cloudinary_public_id}`
              return (
                <tr key={photo.id} className={`border-b border-white/5 hover:bg-white/2 ${selected.has(photo.id) ? 'bg-white/5' : ''}`}>
                  <td className="py-3 pr-4">
                    <input
                      type="checkbox"
                      checked={selected.has(photo.id)}
                      onChange={() => toggleSelect(photo.id)}
                      className="cursor-pointer"
                    />
                  </td>
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

      {showBulkConfirm && (
        <ConfirmDialog
          message={`Delete ${selected.size} photo${selected.size !== 1 ? 's' : ''}? This cannot be undone.`}
          onConfirm={handleBulkDelete}
          onCancel={() => !bulkDeleting && setShowBulkConfirm(false)}
        />
      )}
    </>
  )
}
