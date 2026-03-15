import { createServiceClient } from '@/lib/supabase/server'
import NavBar from '@/components/public/NavBar'
import Footer from '@/components/public/Footer'
import Gallery from '@/components/public/Gallery'
import type { Photo, SiteConfig } from '@/types'

export const revalidate = 60

async function getData() {
  const db = createServiceClient()

  const [{ data: allPhotos }, { data: configRows }] = await Promise.all([
    db.from('photos').select('*').order('created_at', { ascending: false }),
    db.from('site_config').select('*'),
  ])

  const photos = (allPhotos ?? []) as Photo[]

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

  return { photos, config }
}

export default async function HomePage() {
  const { photos, config } = await getData()

  return (
    <div className="min-h-screen bg-[#1a1a18]">
      <NavBar siteTitle={config.site_title} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <Gallery photos={photos} />
      </main>
      <Footer photographerName={config.photographer_name} aiDisclaimer={config.ai_disclaimer} />
    </div>
  )
}
