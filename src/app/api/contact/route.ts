import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] ?? c))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, message } = body

  // Server-side validation
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message too long.' }, { status: 400 })
  }

  const db = createServiceClient()

  // Read feedback email from site_config
  const { data: configRow } = await db
    .from('site_config')
    .select('value')
    .eq('key', 'feedback_email')
    .single()

  const feedbackEmail = configRow?.value
  if (!feedbackEmail) {
    return NextResponse.json({ error: 'Contact not configured.' }, { status: 500 })
  }

  // Store submission
  await db.from('contact_submissions').insert({ sender_name: name, sender_email: email, message })

  // Send email
  const { error } = await resend.emails.send({
    from: 'Bird Photography <onboarding@resend.dev>',
    to: feedbackEmail,
    replyTo: email,
    subject: `New message from ${name}`,
    html: `
      <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <hr />
      <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
    `,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
