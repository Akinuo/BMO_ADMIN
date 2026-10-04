export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <div className="h-8 w-48 rounded bg-denim-light" />
      <div className="mt-2 h-4 w-72 rounded bg-denim-light/70" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-[104px] rounded-lg border border-border bg-paper" />)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="h-64 rounded-lg border border-border bg-paper lg:col-span-2" />
        <div className="h-64 rounded-lg border border-border bg-paper" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}
