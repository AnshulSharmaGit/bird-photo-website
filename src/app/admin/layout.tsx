import AdminNavBar from '@/components/admin/AdminNavBar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <AdminNavBar />
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-12">{children}</main>
    </div>
  )
}
