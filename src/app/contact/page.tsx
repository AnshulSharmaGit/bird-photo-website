import { createServiceClient } from '@/lib/supabase/server'
import NavBar from '@/components/public/NavBar'
import Footer from '@/components/public/Footer'
import ContactForm from '@/components/public/ContactForm'

export const revalidate = 3600

async function getSiteConfig() {
  const db = createServiceClient()
  const { data } = await db.from('site_config').select('*')
  const config = { site_title: 'Bird Photography', photographer_name: 'Photographer' }
  data?.forEach((row) => {
    (config as unknown as Record<string, string>)[row.key] = row.value
  })
  return config
}

export default async function ContactPage() {
  const config = await getSiteConfig()

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <NavBar siteTitle={config.site_title} />
      <main className="max-w-xl mx-auto px-6 pt-36 sm:pt-32 pb-20">
        <h1 className="text-2xl font-light tracking-widest uppercase text-white mb-2 text-center">
          Contact
        </h1>
        <p className="text-gray-500 text-sm text-center mb-12">
          Feedback, questions, or just a kind word — we&apos;d love to hear from you.
        </p>
        <ContactForm />
      </main>
      <Footer photographerName={config.photographer_name} aiDisclaimer={(config as Record<string, string>).ai_disclaimer} />
    </div>
  )
}
