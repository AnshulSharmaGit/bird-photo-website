import type { Metadata } from 'next'
import { Inter, Dancing_Script } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const dancingScript = Dancing_Script({ subsets: ['latin'], variable: '--font-cursive' })

export const metadata: Metadata = {
  title: 'Bird Photography',
  description: 'A curated collection of bird photographs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${dancingScript.variable}`} suppressHydrationWarning>{children}<Analytics /></body>
    </html>
  )
}
