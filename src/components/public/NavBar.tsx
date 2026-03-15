'use client'

import Link from 'next/link'

interface NavBarProps {
  siteTitle: string
}

export default function NavBar({ siteTitle }: NavBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#1a1a18]/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-0 sm:h-14 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
        <Link href="/" className="text-stone-100 text-xl sm:text-2xl leading-tight" style={{ fontFamily: 'var(--font-cursive)' }}>
          {siteTitle}
        </Link>
        <nav className="flex gap-5 sm:gap-8 pb-1 sm:pb-0">
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-stone-400 hover:text-white transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/species"
            className="text-xs uppercase tracking-widest text-stone-400 hover:text-white transition-colors"
          >
            Species
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
