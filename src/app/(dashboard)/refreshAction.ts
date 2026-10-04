'use server'
import { requireAdmin } from '@/lib/auth'
import { clearDataCache } from '@/lib/cache'

/** Drops the shared server-side cache so the next render reads fresh numbers. */
export async function refreshData(): Promise<void> {
  await requireAdmin()
  clearDataCache()
}
