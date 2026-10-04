'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export type ActionState = { ok: boolean; message: string } | null

const MESSAGES: Record<string, string> = {
  invalid_email: 'Enter a valid email address.',
  user_not_found: 'No account with that email. Ask them to sign up first (student app or Google), then add them here.',
  email_not_confirmed: 'That account has not confirmed its email yet.',
  already_admin: 'That account is already an admin.',
  cannot_remove_self: 'You cannot remove your own admin access.',
  last_admin: 'You cannot remove the last remaining admin.',
}

function friendly(err: { message: string; code?: string }): string {
  for (const key of Object.keys(MESSAGES)) if (err.message.includes(key)) return MESSAGES[key]
  if (err.code === '42501' || err.message.includes('not authorized')) return 'You are not allowed to do that.'
  if (err.message.includes('admin_add_admin') || err.message.includes('admin_remove_admin') || err.code === 'PGRST202') {
    return 'Admin management is not set up yet. Run supabase/admin_management.sql in the Supabase SQL Editor.'
  }
  return 'Something went wrong. Please try again.'
}

export async function addAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const email = String(formData.get('email') ?? '').trim()
  const supabase = createClient()
  const { error } = await supabase.rpc('admin_add_admin', { p_email: email })
  if (error) return { ok: false, message: friendly(error) }
  revalidatePath('/admins')
  return { ok: true, message: `${email.toLowerCase()} is now an admin.` }
}

export async function removeAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = String(formData.get('user_id') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: 'Invalid account.' }
  const supabase = createClient()
  const { error } = await supabase.rpc('admin_remove_admin', { p_user: id })
  if (error) return { ok: false, message: friendly(error) }
  revalidatePath('/admins')
  return { ok: true, message: 'Admin access removed.' }
}

export type AccountSuggestion = { email: string; name: string | null }

/** Type-ahead for the Add admin box. Never throws; returns [] on any problem. */
export async function searchAccounts(query: string): Promise<AccountSuggestion[]> {
  await requireAdmin()
  const q = String(query ?? '').trim().slice(0, 100)
  if (q.length < 2) return []
  const supabase = createClient()
  const { data, error } = await supabase.rpc('admin_search_accounts', { p_query: q })
  if (error || !Array.isArray(data)) return []
  return (data as { email: string; display_name: string | null }[]).map(r => ({ email: r.email, name: r.display_name }))
}
