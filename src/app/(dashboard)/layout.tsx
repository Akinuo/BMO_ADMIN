import Shell from '@/components/Shell'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  return (
    <Shell name={admin.name} email={admin.email}>
      {children}
    </Shell>
  )
}
