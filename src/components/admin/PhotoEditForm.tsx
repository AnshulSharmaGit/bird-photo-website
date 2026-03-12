'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Photo } from '@/types'

export default function PhotoEditForm({ photo }: { photo: Photo }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [fields, setFields] = useState({
    bird_name: photo.bird_name,
    location: photo.location ?? '',
    date_taken: photo.date_taken ?? '',
    camera: photo.camera ?? '',
    lens: photo.lens ?? '',
    tags: photo.tags?.join(', ') ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fields.bird_name.trim()) { setError('Bird name is required.'); return }
    setLoading(true)
    setError('')

    const res = await fetch(`/api/admin/photos/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...fields,
        tags: fields.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Update failed.')
      setLoading(false)
      return
    }

    router.push('/admin/photos')
    router.refresh()
  }

  const inputClass =
    'w-full bg-transparent border border-white/20 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-white/50 text-sm'
  const labelClass = 'block text-xs uppercase tracking-widest text-gray-500 mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <label className={labelClass}>Bird Name *</label>
        <input
          value={fields.bird_name}
          onChange={(e) => setFields({ ...fields, bird_name: e.target.value })}
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Location</label>
          <input
            value={fields.location}
            onChange={(e) => setFields({ ...fields, location: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Date Taken</label>
          <input
            type="date"
            value={fields.date_taken}
            onChange={(e) => setFields({ ...fields, date_taken: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Camera</label>
          <input
            value={fields.camera}
            onChange={(e) => setFields({ ...fields, camera: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Lens</label>
          <input
            value={fields.lens}
            onChange={(e) => setFields({ ...fields, lens: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Tags (comma-separated)</label>
        <input
          value={fields.tags}
          onChange={(e) => setFields({ ...fields, tags: e.target.value })}
          className={inputClass}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-white text-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-white/20 text-white text-xs uppercase tracking-widest hover:border-white/50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
