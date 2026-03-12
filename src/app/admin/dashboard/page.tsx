import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const db = createServiceClient()

  const [{ count: photoCount }, { data: lastSync }] = await Promise.all([
    db.from('photos').select('*', { count: 'exact', head: true }),
    db.from('sync_logs').select('*').order('run_at', { ascending: false }).limit(1).single(),
  ])

  return (
    <div>
      <h1 className="text-white text-2xl font-light mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total Photos" value={String(photoCount ?? 0)} />
        <StatCard
          label="Last Sync"
          value={lastSync ? new Date(lastSync.run_at).toLocaleDateString() : 'Never'}
        />
        <StatCard
          label="Last Sync Added"
          value={lastSync ? String(lastSync.photos_added) : '—'}
        />
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/photos/new"
          className="px-5 py-2.5 bg-white text-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
        >
          + Upload Photo
        </Link>
        <Link
          href="/admin/photos"
          className="px-5 py-2.5 border border-white/20 text-white text-xs uppercase tracking-widest hover:border-white/50 transition-colors"
        >
          Manage Photos
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 rounded p-6">
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">{label}</p>
      <p className="text-3xl font-light text-white">{value}</p>
    </div>
  )
}
