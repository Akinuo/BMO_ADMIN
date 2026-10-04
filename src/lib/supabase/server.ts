import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

/**
 * Supabase client for Server Components / route handlers. It acts AS the signed-in admin
 * (their session cookie), so Postgres RLS and the is_admin() checks in the SQL functions apply.
 */
export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  const store = cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        // Server Components can't set cookies; the middleware refreshes the session instead.
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {}
      },
    },
  })
}
