import type { Metadata } from 'next'
import Image from 'next/image'
import { IconLock } from '@/components/icons'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'No access' }
export const dynamic = 'force-dynamic'

export default async function DeniedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft text-amber">
          <IconLock className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-denim">This account isn&rsquo;t an admin</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {user?.email ? <>You&rsquo;re signed in as <b className="text-ink">{user.email}</b>, but that account doesn&rsquo;t have the admin role.</> : 'This account doesn’t have the admin role.'}{' '}
          Ask an existing admin to grant it, or sign in with a different account.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button className="btn w-full">Sign out</button>
        </form>
        <Image src="/logo-mark.png" alt="" width={36} height={36} className="mx-auto mt-6 h-9 w-9 object-contain opacity-60" />
      </div>
    </div>
  )
}
