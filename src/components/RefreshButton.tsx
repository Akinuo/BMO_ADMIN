'use client'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { refreshData } from '@/app/(dashboard)/refreshAction'
import { IconRefresh } from './icons'

/** Clears the server's short-lived cache, then re-runs the queries for the current page without a full reload. */
export default function RefreshButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button type="button" className="btn-outline" disabled={pending} onClick={() => start(async () => { await refreshData(); router.refresh() })}>
      <IconRefresh className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} />
      {pending ? 'Refreshing…' : 'Refresh'}
    </button>
  )
}
