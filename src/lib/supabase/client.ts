import type { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

type BrowserClient = ReturnType<typeof createBrowserClient>
let cached: Promise<BrowserClient> | null = null

/**
 * Browser client, used only on the login page. It is loaded on demand (when the admin starts
 * typing or clicks sign-in) so the Supabase library stays out of the page's first download.
 */
export function getSupabaseBrowser(): Promise<BrowserClient> | null {
  const url = SUPABASE_URL
  const key = SUPABASE_ANON_KEY
  if (!url || !key) return null
  cached ??= import('@supabase/ssr').then(m => m.createBrowserClient(url, key))
  return cached
}
