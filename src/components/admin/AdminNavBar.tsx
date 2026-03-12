'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/photos', label: 'Photos' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/sync-log', label: 'Sync Log' },
]

export default function AdminNavBar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#111] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-white text-sm font-medium">Admin</span>
          <nav className="flex gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-xs uppercase tracking-widest transition-colors ${
                  pathname.startsWith(l.href)
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            View site ↗
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
