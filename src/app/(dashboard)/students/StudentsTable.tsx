'use client'
import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { IconChevron, IconDownload, IconSearch, IconSortDown, IconSortUp } from '@/components/icons'
import { EmptyState, ProgressBar, RankBadge, StalledChip, StatusChip, StudentLink } from '@/components/ui'
import { PAGE_SIZE } from '@/lib/config'
import { toCsv } from '@/lib/csv'
import { formatDate, plural, timeAgo } from '@/lib/format'
import { STATUS_LABEL, type Student } from '@/lib/types'

export type Filter = 'all' | 'not_started' | 'in_progress' | 'stalled' | 'completed' | 'certified'
type SortKey = 'rank' | 'name' | 'progress' | 'lessons' | 'assessment' | 'activity'

const FILTER_LABEL: Record<Filter, string> = {
  all: 'All',
  not_started: STATUS_LABEL.not_started,
  in_progress: STATUS_LABEL.in_progress,
  stalled: 'Stalled',
  completed: STATUS_LABEL.completed,
  certified: STATUS_LABEL.certified,
}
const FILTERS = Object.keys(FILTER_LABEL) as Filter[]

const matches = (s: Student, f: Filter) => (f === 'all' ? true : f === 'stalled' ? s.stalled : s.status === f)

// nulls always sort last, whichever direction is chosen
function cmpNullable(a: number | null, b: number | null, dir: 1 | -1): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return (a - b) * dir
}

function sortStudents(list: Student[], key: SortKey, dir: 1 | -1): Student[] {
  const t = (iso: string | null) => (iso ? new Date(iso).getTime() : null)
  return [...list].sort((a, b) => {
    switch (key) {
      case 'rank': return cmpNullable(a.rank, b.rank, dir) || cmpNullable(t(a.joinedAt), t(b.joinedAt), 1)
      case 'name': return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) * dir
      case 'progress': return cmpNullable(a.steps, b.steps, dir) || cmpNullable(a.rank, b.rank, 1)
      case 'lessons': return cmpNullable(a.lessons, b.lessons, dir) || cmpNullable(a.rank, b.rank, 1)
      case 'assessment': return cmpNullable(a.assessment?.pct ?? null, b.assessment?.pct ?? null, dir)
      case 'activity': return cmpNullable(t(a.lastActivity), t(b.lastActivity), dir)
    }
  })
}

function SortHeader({
  label, k, sortKey, dir, onSort, className = '',
}: { label: string; k: SortKey; sortKey: SortKey; dir: 1 | -1; onSort: (k: SortKey) => void; className?: string }) {
  const active = sortKey === k
  return (
    <th aria-sort={active ? (dir === 1 ? 'ascending' : 'descending') : 'none'} className={className}>
      <button type="button" onClick={() => onSort(k)} className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-denim ${active ? 'text-denim' : ''}`}>
        {label}
        {active ? (dir === 1 ? <IconSortUp className="h-3.5 w-3.5" /> : <IconSortDown className="h-3.5 w-3.5" />) : <span className="h-3.5 w-3.5" />}
      </button>
    </th>
  )
}

export default function StudentsTable({
  students, nowMs, totalSteps, totalLessons, initialFilter,
}: { students: Student[]; nowMs: number; totalSteps: number; totalLessons: number; initialFilter: Filter }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>(initialFilter)
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [dir, setDir] = useState<1 | -1>(1)
  const [page, setPage] = useState(0)

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map(f => [f, students.filter(s => matches(s, f)).length])) as Record<Filter, number>,
    [students],
  )

  // Keep typing instant on big lists: filtering runs on a deferred copy of the search text.
  const deferredQuery = useDeferredValue(query)
  const rows = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    const filtered = students.filter(s => matches(s, filter) && (!q || s.name.toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q)))
    return sortStudents(filtered, sortKey, dir)
  }, [students, filter, deferredQuery, sortKey, dir])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pages - 1)
  const visible = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  function onSort(k: SortKey) {
    if (k === sortKey) setDir(d => (d === 1 ? -1 : 1))
    else {
      setSortKey(k)
      // numbers read best biggest-first; names and rank read best ascending
      setDir(k === 'name' || k === 'rank' ? 1 : -1)
    }
    setPage(0)
  }

  function exportCsv() {
    const csv = toCsv(
      ['Rank', 'Name', 'Email', 'Status', 'Stalled', 'Steps completed', 'Total steps', 'Progress %', 'Lessons completed',
        'Assessment score', 'Assessment total', 'Assessment %', 'Assessment passed', 'Joined', 'Last sign-in', 'Last activity'],
      rows.map(s => [
        s.rank, s.hasName ? s.name : '', s.email, STATUS_LABEL[s.status], s.stalled ? 'yes' : 'no', s.steps, totalSteps, s.progress, s.lessons,
        s.assessment?.score, s.assessment?.total, s.assessment?.pct, s.assessment ? (s.assessment.passed ? 'yes' : 'no') : '',
        s.joinedAt, s.lastSignInAt, s.lastActivity,
      ]),
    )
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `bmo-students-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="grid gap-3 border-b border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search students</span>
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(0) }}
              placeholder="Search by name or email"
              className="field !mt-0 pl-9"
            />
          </label>
          <label className="relative md:hidden">
            <span className="sr-only">Sort by</span>
            <select
              className="field select !mt-0 w-auto"
              value={sortKey}
              onChange={e => { const k = e.target.value as SortKey; setSortKey(k); setDir(k === 'name' || k === 'rank' ? 1 : -1); setPage(0) }}
            >
              <option value="rank">Sort: Rank</option>
              <option value="name">Sort: Name</option>
              <option value="progress">Sort: Progress</option>
              <option value="activity">Sort: Last active</option>
            </select>
            <IconChevron className="select-chevron" />
          </label>
          <button type="button" className="btn-outline" onClick={exportCsv} disabled={!rows.length}>
            <IconDownload className="h-4 w-4" />
            Export CSV
            <span className="text-xs font-medium text-muted">({rows.length})</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => { setFilter(f); setPage(0) }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                filter === f ? 'border-denim bg-denim text-white' : 'border-border bg-paper text-muted hover:border-denim/40 hover:text-denim'
              }`}
            >
              {FILTER_LABEL[f]} <span className={filter === f ? 'text-white/70' : 'text-muted/80'}>{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <SortHeader label="Rank" k="rank" sortKey={sortKey} dir={dir} onSort={onSort} className="w-16 sm:w-20" />
                <SortHeader label="Student" k="name" sortKey={sortKey} dir={dir} onSort={onSort} />
                <SortHeader label="Progress" k="progress" sortKey={sortKey} dir={dir} onSort={onSort} className="hidden w-52 md:table-cell" />
                <SortHeader label="Lessons" k="lessons" sortKey={sortKey} dir={dir} onSort={onSort} className="hidden xl:table-cell" />
                <SortHeader label="Assessment" k="assessment" sortKey={sortKey} dir={dir} onSort={onSort} className="hidden xl:table-cell" />
                <th className="hidden md:table-cell">Status</th>
                <SortHeader label="Last active" k="activity" sortKey={sortKey} dir={dir} onSort={onSort} className="hidden xl:table-cell" />
              </tr>
            </thead>
            <tbody>
              {visible.map(s => (
                <tr key={s.id}>
                  <td><RankBadge rank={s.rank} tied={s.tied} /></td>
                  <td className="w-full max-w-0 md:w-auto md:max-w-[230px] xl:max-w-[260px]">
                    <StudentLink s={s} />
                    {/* phones: the columns below are hidden, so fold the essentials in here */}
                    <div className="mt-2 md:hidden">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={s.progress} />
                        <span className="w-9 shrink-0 text-right text-xs font-semibold text-ink">{s.progress}%</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <StatusChip status={s.status} />
                        {s.stalled && <StalledChip />}
                        <span className="text-[11px] text-muted">{s.lastActivity ? timeAgo(s.lastActivity, nowMs) : 'No activity yet'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    <div className="flex items-center gap-2.5">
                      <ProgressBar value={s.progress} />
                      <span className="w-10 shrink-0 text-right text-xs font-semibold text-ink">{s.progress}%</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted">{s.steps} of {totalSteps} steps</div>
                  </td>
                  <td className="hidden whitespace-nowrap text-ink xl:table-cell">
                    <b className="font-semibold">{s.lessons}</b> <span className="text-muted">/ {totalLessons}</span>
                  </td>
                  <td className="hidden whitespace-nowrap xl:table-cell">
                    {s.assessment ? (
                      <div>
                        <b className="font-semibold text-ink">{s.assessment.score}</b>
                        <span className="text-muted"> / {s.assessment.total} · {s.assessment.pct}%</span>
                      </div>
                    ) : (
                      <span className="text-muted">Not taken</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell">
                    <div className="flex flex-wrap items-center gap-1">
                      <StatusChip status={s.status} />
                      {s.stalled && <StalledChip />}
                    </div>
                    {/* the Last active column only has room from xl up */}
                    <div className="mt-1 whitespace-nowrap text-[11px] text-muted xl:hidden">{s.lastActivity ? timeAgo(s.lastActivity, nowMs) : 'No activity yet'}</div>
                  </td>
                  <td className="hidden whitespace-nowrap text-muted xl:table-cell" title={s.lastActivity ? formatDate(s.lastActivity) : 'No steps completed yet'}>
                    {s.lastActivity ? timeAgo(s.lastActivity, nowMs) : <span className="text-muted/70">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title={students.length ? 'No students match' : 'No students yet'}>
          {students.length ? 'Try a different search or filter.' : 'When students create an account in the student app, they appear here automatically.'}
        </EmptyState>
      )}

      {/* Footer / pagination */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-chalk/60 px-4 py-3 text-xs text-muted">
          <span>
            Showing {safePage * PAGE_SIZE + 1}–{Math.min(rows.length, (safePage + 1) * PAGE_SIZE)} of {plural(rows.length, 'student')}
            {' · '}
            <Link href="/leaderboard" className="font-semibold text-denim hover:underline">How ranking works</Link>
          </span>
          {pages > 1 && (
            <div className="flex items-center gap-1.5">
              <button type="button" className="btn-outline !min-h-[32px] !px-3 !py-1 text-xs" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                <IconChevron className="h-3.5 w-3.5 rotate-90" /> Previous
              </button>
              <span className="px-1">Page {safePage + 1} of {pages}</span>
              <button type="button" className="btn-outline !min-h-[32px] !px-3 !py-1 text-xs" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>
                Next <IconChevron className="h-3.5 w-3.5 -rotate-90" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
