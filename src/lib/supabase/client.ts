'use client'
import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

/** Browser client — used only on the login page. */
export const supabaseBrowser =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null
