'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { Photo } from '@/types'

interface LightboxProps {
  photos: Photo[]
  index: number
  onClose: () => void
  onNav: (index: number) => void
}

export default function Lightbox({ photos, index, onClose, onNav }: LightboxProps) {
  const photo = photos[index]

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNav(Math.min(index + 1, photos.length - 1))
      if (e.key === 'ArrowLeft') onNav(Math.max(index - 1, 0))
    },
    [index, photos.length, onClose, onNav]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  if (!photo) return null

  const fullUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_1400/${photo.cloudinary_public_id}`

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-5 right-6 text-gray-400 hover:text-white text-2xl z-10 leading-none"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      {/* Prev */}
      {index > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-3xl z-10 px-2"
          onClick={(e) => { e.stopPropagation(); onNav(index - 1) }}
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}

      {/* Next */}
      {index < photos.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-3xl z-10 px-2"
          onClick={(e) => { e.stopPropagation(); onNav(index + 1) }}
          aria-label="Next photo"
        >
          ›
        </button>
      )}

      {/* Image + metadata */}
      <div
        className="flex flex-col items-center max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-h-[78vh] w-full flex items-center justify-center">
          <Image
            src={fullUrl}
            alt={photo.bird_name}
            width={1400}
            height={900}
            className="object-contain max-h-[78vh] w-auto"
            priority
            unoptimized
          />
        </div>
        <div className="mt-4 text-center space-y-1">
          <p className="text-white text-lg font-medium">{photo.bird_name}</p>
          <p className="text-gray-400 text-sm">
            {[photo.location, photo.date_taken].filter(Boolean).join(' · ')}
          </p>
          {photo.camera && (
            <p className="text-gray-600 text-xs">{[photo.camera, photo.lens].filter(Boolean).join(' · ')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
