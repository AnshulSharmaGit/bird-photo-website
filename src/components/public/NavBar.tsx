'use client'

import Link from 'next/link'

interface NavBarProps {
  siteTitle: string
}

export default function NavBar({ siteTitle }: NavBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#1a1a18]/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-stone-100 text-2xl" style={{ fontFamily: 'var(--font-cursive)' }}>
          {siteTitle}
        </Link>
        <nav className="flex gap-8">
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-stone-400 hover:text-white transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/contact"
            className="text-xs uppercase tracking-widest text-stone-400 hover:text-white transition-colors"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  )
}
