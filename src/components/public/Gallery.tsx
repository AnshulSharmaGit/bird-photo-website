'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import type { Photo } from '@/types'
import FilterBar from './FilterBar'
import Lightbox from './Lightbox'

interface GalleryProps {
  photos: Photo[]
}

export default function Gallery({ photos }: GalleryProps) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Collect unique tags across all photos
  const allTags = useMemo(() => {
    const set = new Set<string>()
    photos.forEach((p) => p.tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [photos])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return photos
    return photos.filter((p) => p.tags?.includes(activeFilter))
  }, [photos, activeFilter])

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-600">
        <p className="text-lg">No photos yet.</p>
        <p className="text-sm mt-1">Check back soon.</p>
      </div>
    )
  }

  return (
    <>
      <FilterBar tags={allTags} active={activeFilter} onChange={setActiveFilter} />

      {/* Masonry grid using CSS columns */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-1">
        {filtered.map((photo, i) => {
          const thumbUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_600/${photo.cloudinary_public_id}`
          return (
            <button
              key={photo.id}
              className="block w-full mb-1 break-inside-avoid cursor-pointer p-0.5 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 text-left"
              onClick={() => setLightboxIndex(i)}
              aria-label={`Open ${photo.bird_name}`}
            >
              <Image
                src={thumbUrl}
                alt={photo.bird_name}
                width={600}
                height={400}
                className="w-full h-auto"
                loading="lazy"
                unoptimized
              />
              {photo.description && (
                <div className="px-2 pt-1.5 pb-2 bg-[#1a1a18]">
                  <p className="text-xs font-semibold text-white leading-tight">{photo.bird_name}</p>
                  <p className="text-xs text-white/60 mt-0.5 leading-snug line-clamp-2">{photo.description}</p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={filtered}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}
    </>
  )
}
