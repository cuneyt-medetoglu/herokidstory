import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getUserRole } from '@/lib/db/users'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { ToastProvider } from '@/hooks/use-toast'

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login`)
  }

  const role = await getUserRole(session.user.id)

  if (role !== 'admin') {
    redirect(`/${locale}/dashboard`)
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}
