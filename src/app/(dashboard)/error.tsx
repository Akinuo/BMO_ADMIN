'use client'
import { IconAlert } from '@/components/icons'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const missingFunctions = /could not find the function|admin_(student|lesson|daily)/i.test(error.message)
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-soft text-red">
        <IconAlert className="h-6 w-6" />
      </span>
      <h1 className="mt-4 font-display text-xl font-bold text-denim">Couldn&rsquo;t load the data</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {missingFunctions
          ? 'The database functions for this dashboard are missing. Run supabase/admin_dashboard.sql once in the Supabase SQL Editor, then try again.'
          : 'Something went wrong while reading from Supabase. Check your connection and try again.'}
      </p>
      <p className="mx-auto mt-3 max-w-full break-words rounded bg-chalk px-3 py-2 text-left font-mono text-xs text-muted">{error.message}</p>
      <button className="btn mt-6" onClick={reset}>Try again</button>
    </div>
  )
}
