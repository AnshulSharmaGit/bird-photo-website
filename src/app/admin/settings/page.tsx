import { createServiceClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/admin/SettingsForm'
import type { SiteConfig } from '@/types'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const db = createServiceClient()
  const { data: rows } = await db.from('site_config').select('*')

  const config: SiteConfig = {
    site_title: 'Bird Photography',
    photographer_name: 'Photographer',
    feedback_email: '',
    about_blurb: '',
    ai_disclaimer: '',
  }
  rows?.forEach((row) => {
    (config as unknown as Record<string, string>)[row.key] = row.value
  })

  return (
    <div>
      <h1 className="text-white text-2xl font-light mb-8">Settings</h1>
      <SettingsForm config={config} />
    </div>
  )
}
