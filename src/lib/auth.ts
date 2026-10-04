import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

type AdminSession = {
  id: string
  email: string | null
  name: string
}

/**
 * Gate for every dashboard page. Signed out → /login. Signed in but not an admin → /denied.
 * (The SQL functions re-check is_admin() on every call, so this is the friendly layer —
 * the database is the real lock.)
 */
export const requireAdmin = cache(async (): Promise<AdminSession> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') redirect('/denied')

  const meta = (user.user_metadata ?? {}) as { display_name?: string; full_name?: string; name?: string }
  const name = meta.display_name || meta.full_name || meta.name || user.email?.split('@')[0] || 'Admin'
  return { id: user.id, email: user.email ?? null, name }
})
