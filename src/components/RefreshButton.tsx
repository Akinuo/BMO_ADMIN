'use client'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { IconRefresh } from './icons'

/** Re-runs the server queries for the current page without a full reload. */
export default function RefreshButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button type="button" className="btn-outline" disabled={pending} onClick={() => start(() => router.refresh())}>
      <IconRefresh className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} />
      {pending ? 'Refreshing…' : 'Refresh'}
    </button>
  )
}
