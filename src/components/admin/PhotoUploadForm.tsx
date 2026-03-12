'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { extractExif } from '@/lib/exif'

export default function PhotoUploadForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [fields, setFields] = useState({
    bird_name: '',
    location: '',
    date_taken: '',
    camera: '',
    lens: '',
    tags: '',
  })

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.endsWith('.heic') && !file.name.endsWith('.HEIC')) {
      setError('Please select an image file (JPEG, PNG, HEIC).')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File must be under 20 MB.')
      return
    }
    setError('')
    setPreview(URL.createObjectURL(file))

    // Auto-fill EXIF
    const exif = await extractExif(file)
    setFields((f) => ({
      ...f,
      date_taken: exif.date_taken ?? f.date_taken,
      camera: exif.camera ?? f.camera,
      lens: exif.lens ?? f.lens,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Please select a photo.'); return }
    if (!fields.bird_name.trim()) { setError('Bird name is required.'); return }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    Object.entries(fields).forEach(([k, v]) => formData.append(k, v))

    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Upload failed.')
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
      {/* File drop zone */}
      <div
        className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded object-contain mb-3" />
        ) : (
          <p className="text-gray-500 text-sm mb-3">Drag & drop a photo here, or</p>
        )}
        <input
          ref={fileRef}
          id="photo-file-input"
          type="file"
          accept="image/*,.heic,.HEIC"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <label
          htmlFor="photo-file-input"
          className="inline-block px-4 py-2 border border-white/30 text-white text-xs uppercase tracking-widest hover:bg-white/10 transition-colors cursor-pointer"
        >
          Choose File
        </label>
      </div>

      <div>
        <label className={labelClass}>Bird Name *</label>
        <input
          value={fields.bird_name}
          onChange={(e) => setFields({ ...fields, bird_name: e.target.value })}
          placeholder="e.g. Great Hornbill"
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
            placeholder="e.g. Kerala, India"
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
            placeholder="e.g. Canon EOS R5"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Lens</label>
          <input
            value={fields.lens}
            onChange={(e) => setFields({ ...fields, lens: e.target.value })}
            placeholder="e.g. 100-400mm f/4.5"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Tags (comma-separated)</label>
        <input
          value={fields.tags}
          onChange={(e) => setFields({ ...fields, tags: e.target.value })}
          placeholder="e.g. raptor, wetland, rare"
          className={inputClass}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 bg-white text-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        {loading ? 'Uploading…' : 'Upload Photo'}
      </button>
    </form>
  )
}
