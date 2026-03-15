import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'
import NavBar from '@/components/public/NavBar'
import Footer from '@/components/public/Footer'
import type { Photo, SiteConfig } from '@/types'

export const revalidate = 60

async function getData() {
  const db = createServiceClient()

  const [{ data: allPhotos }, { data: configRows }] = await Promise.all([
    db.from('photos').select('*').not('description', 'is', null).order('bird_name'),
    db.from('site_config').select('*'),
  ])

  const photos = (allPhotos ?? []) as Photo[]

  // Group by bird_name (case-insensitive)
  const grouped = photos.reduce<Record<string, Photo[]>>((acc, photo) => {
    const key = photo.bird_name.toLowerCase()
    if (!acc[key]) acc[key] = []
    acc[key].push(photo)
    return acc
  }, {})

  // Sort alphabetically
  const species = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))

  const config: SiteConfig = {
    site_title: 'Bird Photography',
    photographer_name: 'Photographer',
    feedback_email: '',
    about_blurb: '',
    ai_disclaimer: '',
  }
  configRows?.forEach((row) => {
    (config as unknown as Record<string, string>)[row.key] = row.value
  })

  return { species, config }
}

export default async function SpeciesPage() {
  const { species, config } = await getData()

  return (
    <div className="min-h-screen bg-[#1a1a18]">
      <NavBar siteTitle={config.site_title} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <h1 className="text-white text-2xl font-light tracking-widest uppercase mb-8">
          Species Index <span className="text-stone-500 text-sm ml-2">({species.length} species)</span>
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {species.map(([, photos]) => {
            const thumb = photos[0]
            const name = thumb.bird_name
            const thumbUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_400/${thumb.cloudinary_public_id}`
            return (
              <Link
                key={name}
                href={`/species/${encodeURIComponent(name)}`}
                className="group block bg-white p-0.5 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="relative overflow-hidden">
                  <Image
                    src={thumbUrl}
                    alt={name}
                    width={400}
                    height={300}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  {photos.length > 1 && (
                    <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                      {photos.length}
                    </span>
                  )}
                </div>
                <div className="bg-[#1a1a18] px-2 pt-1.5 pb-2">
                  <p className="text-xs font-semibold text-white leading-tight">{name}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
      <Footer photographerName={config.photographer_name} aiDisclaimer={config.ai_disclaimer} />
    </div>
  )
}
