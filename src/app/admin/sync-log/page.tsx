import { createServiceClient } from '@/lib/supabase/server'
import type { SyncLog } from '@/types'

export default async function SyncLogPage() {
  const db = createServiceClient()
  const { data: logs } = await db
    .from('sync_logs')
    .select('*')
    .order('run_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-white text-2xl font-light mb-8">Sync Log</h1>
      {!logs || logs.length === 0 ? (
        <p className="text-gray-500 text-sm">No sync runs yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-gray-500">
                <th className="pb-3 pr-6">Run At</th>
                <th className="pb-3 pr-6">Added</th>
                <th className="pb-3 pr-6">Skipped</th>
                <th className="pb-3 pr-6">Duration</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(logs as SyncLog[]).map((log) => (
                <tr key={log.id} className="border-b border-white/5">
                  <td className="py-3 pr-6 text-gray-300">
                    {new Date(log.run_at).toLocaleString()}
                  </td>
                  <td className="py-3 pr-6 text-green-400">{log.photos_added}</td>
                  <td className="py-3 pr-6 text-gray-500">{log.photos_skipped}</td>
                  <td className="py-3 pr-6 text-gray-400">
                    {log.duration_seconds != null ? `${log.duration_seconds}s` : '—'}
                  </td>
                  <td className="py-3">
                    {log.error_message ? (
                      <span className="text-red-400 text-xs" title={log.error_message}>
                        ✕ Error
                      </span>
                    ) : (
                      <span className="text-green-400 text-xs">✓ OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
