/**
 * A "still loading" message that stays invisible for the first 2 seconds, then fades in.
 * Pure CSS (see .slow-loader in globals.css): no JavaScript, no timer, nothing to hydrate.
 * Quick loads never see it. It is hidden from screen readers because the skeleton around it
 * already announces "Loading…".
 */
export default function SlowLoader({
  title = 'Still loading…',
  hint = 'Getting the latest student numbers. This is taking longer than usual.',
  inline = false,
}: { title?: string; hint?: string; inline?: boolean }) {
  const card = (
    <div aria-hidden="true" className="slow-loader card flex items-center gap-3 px-4 py-3 shadow-md">
      <span className="h-6 w-6 shrink-0 animate-spin rounded-full border-[3px] border-denim-light border-t-denim" />
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{hint}</p>
      </div>
    </div>
  )
  if (inline) return <div className="pointer-events-none flex justify-center print:hidden">{card}</div>
  return <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center px-4 lg:left-60 print:hidden">{card}</div>
}
