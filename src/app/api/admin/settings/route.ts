import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_KEYS = ['site_title', 'photographer_name', 'feedback_email', 'about_blurb', 'ai_disclaimer']

export async function GET() {
  const db = createServiceClient()
  const { data } = await db.from('site_config').select('*')
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = createServiceClient()

  const upserts = ALLOWED_KEYS
    .filter((key) => body[key] !== undefined)
    .map((key) => ({ key, value: String(body[key]) }))

  const { error } = await db.from('site_config').upsert(upserts, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: 'Save failed.' }, { status: 500 })

  revalidatePath('/admin/settings')
  revalidatePath('/')

  return NextResponse.json({ ok: true })
}
