// Icon set — 24×24 viewport, 1.5px stroke, round caps/joins (same conventions as the student site).
const S = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}
type P = { className?: string }

export function IconOverview({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="8" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="14.5" width="7" height="6" rx="1.5" />
    </svg>
  )
}

export function IconUsers({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19.5c.4-3.3 2.9-5.2 6.2-5.2s5.8 1.9 6.2 5.2" />
      <path d="M15.6 5.1a3.1 3.1 0 0 1 0 5.8" />
      <path d="M17.6 14.6c2 .6 3.4 2.2 3.6 4.9" />
    </svg>
  )
}

export function IconTrophy({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M7.5 4h9v5.2a4.5 4.5 0 0 1-9 0V4z" />
      <path d="M7.5 6H4.8c0 2.6 1 4 2.9 4.4M16.5 6h2.7c0 2.6-1 4-2.9 4.4" />
      <path d="M12 13.7V17M8.5 20h7M9.5 17h5" />
    </svg>
  )
}

export function IconLogout({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M9.5 4.5h-4a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5h4" />
      <path d="M15 8l4 4-4 4M19 12H9.5" />
    </svg>
  )
}

export function IconSearch({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </svg>
  )
}

export function IconDownload({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </svg>
  )
}

export function IconRefresh({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5" />
      <path d="M19.8 4.5v4.2h-4.2" />
    </svg>
  )
}

export function IconCheck({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function IconChevron({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function IconArrowRight({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function IconArrowLeft({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  )
}

export function IconSortUp({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M7 14l5-5 5 5" />
    </svg>
  )
}

export function IconSortDown({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M7 10l5 5 5-5" />
    </svg>
  )
}

export function IconCertificate({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" />
      <path d="M7.5 9h9M7.5 12h5" />
      <path d="M15 16.5l-.8 4 2.3-1.4 2.3 1.4-.8-4" />
    </svg>
  )
}

export function IconClock({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function IconAlert({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M12 4.2l8.3 14.3H3.7L12 4.2z" />
      <path d="M12 10v3.8M12 16.6v.1" />
    </svg>
  )
}

export function IconLock({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  )
}

export function IconLayers({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M12 4l8.5 4.5L12 13 3.5 8.5 12 4z" />
      <path d="M3.5 12.5L12 17l8.5-4.5M3.5 16L12 20.5 20.5 16" opacity=".75" />
    </svg>
  )
}

export function IconPulse({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M3 12h4l2.2-6 4.6 12 2.2-6H21" />
    </svg>
  )
}

export function IconStar({ className }: P) {
  return (
    <svg {...S} className={className} aria-hidden="true">
      <path d="M12 3.8l2.5 5.1 5.6.8-4 4 1 5.6L12 16.6l-5.1 2.7 1-5.6-4-4 5.6-.8L12 3.8z" />
    </svg>
  )
}

// Thread spool — the student site's motif, used as a quiet watermark
export function SpoolMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 84" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`pointer-events-none select-none ${className}`}>
      <rect x="10" y="4" width="44" height="9" rx="2.5" />
      <rect x="10" y="71" width="44" height="9" rx="2.5" />
      <path d="M16 13v58M48 13v58" />
      <path d="M16 20h32M16 27h32M16 34h32M16 41h32M16 48h32M16 55h32M16 62h32" opacity=".7" />
      <path d="M48 66c10 2 8 12 20 9" />
    </svg>
  )
}
