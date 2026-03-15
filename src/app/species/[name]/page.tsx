'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import NavBar from '@/components/public/NavBar'
import Footer from '@/components/public/Footer'
import Lightbox from '@/components/public/Lightbox'
import type { Photo } from '@/types'
import { createClient } from '@/lib/supabase/client'

export default function SpeciesDetailPage() {
  const params = useParams()
  const name = decodeURIComponent(params.name as string)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [siteTitle, setSiteTitle] = useState('Bird Photography')
  const [aiDisclaimer, setAiDisclaimer] = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.from('photos').select('*').ilike('bird_name', name).order('created_at', { ascending: false })
      .then(({ data }) => setPhotos((data ?? []) as Photo[]))
    sb.from('site_config').select('*').in('key', ['site_title', 'ai_disclaimer'])
      .then(({ data }) => {
        data?.forEach((row) => {
          if (row.key === 'site_title') setSiteTitle(row.value)
          if (row.key === 'ai_disclaimer') setAiDisclaimer(row.value)
        })
      })
  }, [name])

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  return (
    <div className="min-h-screen bg-[#1a1a18]">
      <NavBar siteTitle={siteTitle} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="mb-6">
          <Link href="/species" className="text-stone-500 hover:text-white text-xs uppercase tracking-widest transition-colors">
            ← Species Index
          </Link>
          <h1 className="text-white text-2xl font-light tracking-wide mt-2">{name}</h1>
          {photos[0]?.description && (
            <p className="text-stone-400 text-sm mt-1 max-w-2xl">{photos[0].description}</p>
          )}
          <p className="text-stone-600 text-xs mt-1">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-1">
          {photos.map((photo, i) => {
            const thumbUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_600/${photo.cloudinary_public_id}`
            return (
              <button
                key={photo.id}
                className="block w-full mb-1 break-inside-avoid cursor-pointer p-0.5 bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
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
              </button>
            )
          })}
        </div>
      </main>
      <Footer photographerName="" aiDisclaimer={aiDisclaimer} />

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}
    </div>
  )
}
