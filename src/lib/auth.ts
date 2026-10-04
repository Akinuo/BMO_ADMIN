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
 *
 * getClaims() checks the session token's signature locally (the signing keys are cached), instead of
 * a network round trip to Supabase Auth on every page view. The middleware has already refreshed the
 * session by the time we get here. The admin role is still read from the database on every request.
 */
export const requireAdmin = cache(async (): Promise<AdminSession> => {
  const supabase = createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', claims.sub).maybeSingle()
  if (profile?.role !== 'admin') redirect('/denied')

  const meta = (claims.user_metadata ?? {}) as { display_name?: string; full_name?: string; name?: string }
  const email = typeof claims.email === 'string' && claims.email ? claims.email : null
  const name = meta.display_name || meta.full_name || meta.name || email?.split('@')[0] || 'Admin'
  return { id: claims.sub, email, name }
})
