import { DAY_MS, TIMEZONE } from './config'

const dateFmt = new Intl.DateTimeFormat('en-PH', { timeZone: TIMEZONE, day: 'numeric', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('en-PH', {
  timeZone: TIMEZONE, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
})
const shortDayFmt = new Intl.DateTimeFormat('en-PH', { timeZone: 'UTC', day: 'numeric', month: 'short' })
const longDayFmt = new Intl.DateTimeFormat('en-PH', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })

export const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : '—')
export const formatDateTime = (iso: string | null) => (iso ? dateTimeFmt.format(new Date(iso)) : '—')

/** `day` is a plain yyyy-mm-dd calendar date from the SQL function (already in TIMEZONE). */
export const formatDay = (day: string) => shortDayFmt.format(new Date(`${day}T00:00:00Z`))
export const formatDayLong = (day: string) => longDayFmt.format(new Date(`${day}T00:00:00Z`))

/** "just now", "5 min ago", "3 h ago", "2 d ago", then a date after 30 days. */
export function timeAgo(iso: string | null, nowMs: number): string {
  if (!iso) return 'Never'
  const diff = nowMs - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`
  if (diff < DAY_MS) return `${Math.floor(diff / 3_600_000)} h ago`
  if (diff < 30 * DAY_MS) return `${Math.floor(diff / DAY_MS)} d ago`
  return formatDate(iso)
}

export const pct = (n: number, d: number) => (d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0)

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-PH')} ${n === 1 ? one : many}`

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}
