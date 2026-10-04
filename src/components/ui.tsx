import Link from 'next/link'
import type { ReactNode } from 'react'
import { initials } from '@/lib/format'
import { STATUS_LABEL, type Student, type StudentStatus } from '@/lib/types'
import { IconAlert, IconCertificate, IconCheck } from './icons'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function ProgressBar({ value, className = '', tone = 'auto' }: { value: number; className?: string; tone?: 'auto' | 'denim' }) {
  const v = Math.max(0, Math.min(100, value))
  const color = tone === 'auto' && v >= 100 ? 'bg-green' : 'bg-denim'
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-2 w-full overflow-hidden rounded-full bg-denim-light ${className}`}
    >
      <div className={`grow-x h-full rounded-full ${color}`} style={{ width: `${v}%` }} />
    </div>
  )
}

const STATUS_CHIP: Record<StudentStatus, string> = {
  not_started: 'chip-muted',
  in_progress: 'chip-denim',
  completed: 'chip-amber',
  certified: 'chip-green',
}

export function StatusChip({ status }: { status: StudentStatus }) {
  return (
    <span className={STATUS_CHIP[status]}>
      {status === 'certified' && <IconCertificate className="h-3.5 w-3.5" />}
      {status === 'completed' && <IconCheck className="h-3.5 w-3.5" />}
      {STATUS_LABEL[status]}
    </span>
  )
}

export function StalledChip() {
  return (
    <span className="chip-red" title="No progress for a while">
      <IconAlert className="h-3.5 w-3.5" />
      Stalled
    </span>
  )
}

/** Gold / silver / bronze for the top three, a quiet number for everyone else. */
export function RankBadge({ rank, tied = false, size = 'md' }: { rank: number | null; tied?: boolean; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-12 w-12 text-xl' : 'h-8 w-8 text-sm'
  if (rank === null) {
    return <span className="text-muted" title="Not ranked yet — no steps completed">—</span>
  }
  const tone =
    rank === 1 ? 'bg-thread text-denim-deep border-amber-border'
    : rank === 2 ? 'bg-silver-soft text-silver border-silver/40'
    : rank === 3 ? 'bg-bronze-soft text-bronze border-bronze/40'
    : 'bg-chalk text-ink border-border'
  return (
    <span
      className={`inline-flex ${dim} items-center justify-center rounded-full border font-display font-bold ${tone}`}
      title={tied ? `Rank ${rank} (tied)` : `Rank ${rank}`}
      aria-label={`Rank ${rank}${tied ? ', tied' : ''}`}
    >
      {rank}
      {tied && <span className="-mr-0.5 ml-px text-[0.6em] font-semibold opacity-70" aria-hidden="true">=</span>}
    </span>
  )
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-14 w-14 text-lg' : 'h-9 w-9 text-xs'
  return (
    <span
      aria-hidden="true"
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full bg-denim font-display font-bold tracking-wide text-white`}
    >
      {initials(name)}
    </span>
  )
}

export function KpiCard({
  label, value, hint, icon, accent = false,
}: { label: string; value: ReactNode; hint?: ReactNode; icon: ReactNode; accent?: boolean }) {
  return (
    <div className={`card fade-in relative overflow-hidden p-4 ${accent ? 'border-denim bg-denim text-white' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-white/70' : 'text-muted'}`}>{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${accent ? 'bg-white/10 text-thread' : 'bg-denim-light text-denim'}`}>
          {icon}
        </span>
      </div>
      <p className={`mt-2 font-display text-3xl font-bold leading-none ${accent ? 'text-white' : 'text-denim'}`}>{value}</p>
      {hint && <p className={`mt-2 text-xs ${accent ? 'text-white/70' : 'text-muted'}`}>{hint}</p>}
    </div>
  )
}

export function StudentLink({ s }: { s: Pick<Student, 'id' | 'name' | 'email' | 'hasName'> }) {
  return (
    <Link href={`/students/${s.id}`} className="group flex min-w-0 items-center gap-3">
      <Avatar name={s.name} />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink group-hover:text-denim group-hover:underline">{s.name}</span>
        {s.email && <span className="block truncate text-xs text-muted">{s.email}</span>}
      </span>
    </Link>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="font-display text-base font-bold text-denim">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</p>}
    </div>
  )
}
