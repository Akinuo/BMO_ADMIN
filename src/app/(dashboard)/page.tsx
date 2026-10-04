import type { Metadata } from 'next'
import Link from 'next/link'
import { ActivityChart, LessonFunnel } from '@/components/charts'
import { IconAlert, IconArrowRight, IconCheck } from '@/components/icons'
import PrintButton from '@/components/PrintButton'
import RefreshButton from '@/components/RefreshButton'
import { EmptyState, KpiStrip, PageHeader, ProgressBar, RankBadge, StudentLink } from '@/components/ui'
import { ACTIVE_DAYS, ACTIVITY_DAYS, STALLED_DAYS } from '@/lib/config'
import { getActivity, getDashboard } from '@/lib/data'
import { formatDateTime, pct, plural, timeAgo } from '@/lib/format'

export const metadata: Metadata = { title: 'Overview' }

const SEGMENTS = [
  { key: 'certified', label: 'Certified', color: 'bg-green' },
  { key: 'completed', label: 'Course complete', color: 'bg-thread' },
  { key: 'inProgress', label: 'In progress', color: 'bg-denim' },
  { key: 'notStarted', label: 'Not started', color: 'bg-border' },
] as const

const RANGES = [7, 30, 90] as const

const sum = (rows: { steps_completed: number }[]) => rows.reduce((a, r) => a + r.steps_completed, 0)
const sumNew = (rows: { new_students: number }[]) => rows.reduce((a, r) => a + r.new_students, 0)

/** "▲ 18%" / "▼ 5%" / "no change" compared with the previous period. */
function Trend({ now, before }: { now: number; before: number }) {
  if (now === before) return <span className="chip-muted">{now === 0 ? 'no activity' : 'no change'}</span>
  if (before === 0) return <span className="chip-green">▲ new</span>
  const change = Math.round(((now - before) / before) * 100)
  return <span className={change > 0 ? 'chip-green' : 'chip-red'}>{change > 0 ? '▲' : '▼'} {Math.abs(change)}%</span>
}

export default async function OverviewPage({ searchParams }: { searchParams: { range?: string } }) {
  const range = RANGES.find(r => String(r) === searchParams.range) ?? ACTIVITY_DAYS
  // Always fetch at least 14 days so "this week vs last week" works even on the 7-day view.
  const [{ students, lessons, summary, nowMs }, activityAll] = await Promise.all([getDashboard(), getActivity(Math.max(range, 14))])
  const activity = activityAll.slice(-range)
  const week = activityAll.slice(-7)
  const prevWeek = activityAll.slice(-14, -7)
  const ready = students
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.lastActivity ?? b.joinedAt).getTime() - new Date(a.lastActivity ?? a.joinedAt).getTime())

  const top = students.filter(s => s.rank !== null).slice(0, 5)
  const stalled = students
    .filter(s => s.stalled)
    .sort((a, b) => new Date(a.lastActivity ?? a.joinedAt).getTime() - new Date(b.lastActivity ?? b.joinedAt).getTime())
  const hasStudents = summary.total > 0

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={<>Live from your database &middot; updated {formatDateTime(new Date(nowMs).toISOString())}</>}
        actions={<><PrintButton label="Print report" /><RefreshButton /></>}
      />

      {/* KPIs */}
      <KpiStrip
        items={[
          {
            hero: true, label: 'Total students', value: summary.total.toLocaleString('en-PH'),
            hint: summary.newThisWeek ? `+${summary.newThisWeek} joined in the last ${ACTIVE_DAYS} days` : `None new in the last ${ACTIVE_DAYS} days`,
          },
          {
            label: `Active in ${ACTIVE_DAYS} days`, value: summary.activeThisWeek.toLocaleString('en-PH'),
            hint: hasStudents ? `${pct(summary.activeThisWeek, summary.total)}% of students` : '—', bar: pct(summary.activeThisWeek, summary.total),
          },
          { label: 'Average progress', value: `${summary.avgProgress}%`, hint: `of ${plural(summary.totalSteps, 'step')}`, bar: summary.avgProgress },
          {
            label: 'Finished all lessons', value: summary.finishedCourse.toLocaleString('en-PH'),
            hint: hasStudents ? `${pct(summary.finishedCourse, summary.total)}% of students` : '—', bar: pct(summary.finishedCourse, summary.total),
          },
          {
            label: 'Certified', value: summary.certified.toLocaleString('en-PH'), tone: 'bg-green', bar: pct(summary.certified, summary.total),
            hint: summary.assessmentPassRate !== null
              ? `${summary.assessmentPassRate}% pass rate · ${plural(summary.assessmentTaken, 'attempt')}`
              : 'No assessment taken yet',
          },
        ]}
      />

      {/* Status breakdown */}
      <section aria-label="Where students are" className="card mt-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="card-title">Where everyone is</h2>
          <p className="text-xs text-muted">{plural(summary.total, 'student')}</p>
        </div>
        {hasStudents ? (
          <>
            <div className="mt-3 flex h-3.5 w-full overflow-hidden rounded-full bg-chalk" role="img"
              aria-label={SEGMENTS.map(s => `${s.label}: ${summary[s.key]}`).join(', ')}>
              {SEGMENTS.map(s => (
                <div key={s.key} className={`grow-x h-full ${s.color}`} style={{ width: `${(summary[s.key] / summary.total) * 100}%` }} />
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              {SEGMENTS.map(s => (
                <div key={s.key} className="flex items-start gap-2.5">
                  <span className={`mt-1 h-3 w-3 shrink-0 rounded-sm ${s.color}`} />
                  <div>
                    <dt className="text-xs text-muted">{s.label}</dt>
                    <dd className="font-display text-xl font-bold leading-tight text-ink">
                      {summary[s.key]} <span className="text-xs font-medium text-muted">{pct(summary[s.key], summary.total)}%</span>
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <EmptyState title="No students yet">When students create an account in the student app, they appear here automatically.</EmptyState>
        )}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Activity */}
        <section className="card p-5 lg:col-span-2" aria-label="Recent activity">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="card-title">Activity, last {range} days</h2>
              <p className="text-xs text-muted">Steps completed per day</p>
            </div>
            <nav aria-label="Time range" className="flex gap-1 rounded-full bg-chalk p-1 print:hidden">
              {RANGES.map(r => (
                <Link
                  key={r}
                  href={r === ACTIVITY_DAYS ? '/' : `/?range=${r}`}
                  scroll={false}
                  aria-current={r === range ? 'true' : undefined}
                  className={`flex min-h-[36px] min-w-[44px] items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors ${
                    r === range ? 'bg-denim text-white' : 'text-muted hover:text-denim'
                  }`}
                >
                  {r}d
                </Link>
              ))}
            </nav>
          </div>
          <dl className="mb-4 mt-3 flex flex-wrap gap-x-8 gap-y-2 border-y border-border py-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Steps completed · last 7 days</dt>
              <dd className="mt-0.5 flex items-center gap-2">
                <span className="font-display text-xl font-bold text-denim">{sum(week).toLocaleString('en-PH')}</span>
                <Trend now={sum(week)} before={sum(prevWeek)} />
                <span className="text-xs text-muted">vs previous 7 days</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">New students · last 7 days</dt>
              <dd className="mt-0.5 flex items-center gap-2">
                <span className="font-display text-xl font-bold text-denim">{sumNew(week).toLocaleString('en-PH')}</span>
                <Trend now={sumNew(week)} before={sumNew(prevWeek)} />
              </dd>
            </div>
          </dl>
          <ActivityChart data={activity} />
        </section>

        {/* Top performers */}
        <section className="card flex flex-col p-5" aria-label="Top students">
          <div className="flex items-baseline justify-between">
            <h2 className="card-title">Top students</h2>
            <Link href="/leaderboard" className="flex items-center gap-1 text-xs font-semibold text-denim hover:underline">
              Leaderboard <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {top.length ? (
            <ol className="mt-3 grid gap-3">
              {top.map(s => (
                <li key={s.id} className="flex items-center gap-3">
                  <RankBadge rank={s.rank} tied={s.tied} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">
                      <Link href={`/students/${s.id}`} className="hover:text-denim hover:underline">{s.name}</Link>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <ProgressBar value={s.progress} />
                      <span className="w-9 shrink-0 text-right text-xs font-semibold text-muted">{s.progress}%</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="No one is ranked yet">Students appear here after completing their first step.</EmptyState>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Lesson funnel */}
        <section className="card p-5 lg:col-span-2" aria-label="Lesson completion">
          <h2 className="card-title">Lesson completion</h2>
          <p className="mb-4 text-xs text-muted">Lessons unlock in order, so the bars show where students slow down.</p>
          {lessons.length ? <LessonFunnel lessons={lessons} totalStudents={summary.total} /> : <EmptyState title="No lessons found" />}
        </section>

        <div className="grid content-start gap-4">
        {/* Needs a nudge */}
        <section className="card flex flex-col p-5" aria-label="Students who may need a nudge">
          <div className="flex items-baseline justify-between">
            <h2 className="card-title">Needs a nudge</h2>
            <span className="text-xs text-muted">{STALLED_DAYS}+ days quiet</span>
          </div>
          {stalled.length ? (
            <>
              <ul className="mt-3 grid gap-3">
                {stalled.slice(0, 6).map(s => (
                  <li key={s.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1"><StudentLink s={s} /></div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-semibold text-red">{timeAgo(s.lastActivity ?? s.joinedAt, nowMs)}</div>
                      <div className="text-[11px] text-muted">{s.steps ? `${s.progress}% done` : 'never started'}</div>
                    </div>
                  </li>
                ))}
              </ul>
              {stalled.length > 6 && (
                <p className="mt-3 text-xs text-muted">
                  and {stalled.length - 6} more &middot;{' '}
                  <Link href="/students?filter=stalled" className="font-semibold text-denim hover:underline">see all</Link>
                </p>
              )}
            </>
          ) : (
            <div className="my-auto px-2 py-8 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-soft text-green"><IconCheck className="h-5 w-5" /></span>
              <p className="mt-3 text-sm font-semibold text-ink">Nobody is stalled</p>
              <p className="mt-1 text-xs text-muted">Everyone unfinished has made progress in the last {STALLED_DAYS} days.</p>
            </div>
          )}
          {stalled.length > 0 && (
            <p className="mt-auto flex items-start gap-1.5 pt-4 text-[11px] leading-snug text-muted">
              <IconAlert className="mt-px h-3.5 w-3.5 shrink-0" />
              Counted from their last completed step, or from sign-up if they never started.
            </p>
          )}
        </section>

        {/* Finished every lesson, final assessment not passed yet */}
        <section className="card flex flex-col p-5" aria-label="Ready for the final assessment">
          <div className="flex items-baseline justify-between">
            <h2 className="card-title">Ready for the assessment</h2>
            <span className="text-xs text-muted">{ready.length}</span>
          </div>
          {ready.length ? (
            <>
              <ul className="mt-3 grid gap-3">
                {ready.slice(0, 5).map(s => (
                  <li key={s.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1"><StudentLink s={s} /></div>
                    <span className={`shrink-0 text-xs font-semibold ${s.assessment ? 'text-amber' : 'text-muted'}`}>
                      {s.assessment ? `Scored ${s.assessment.pct}%` : 'Not taken'}
                    </span>
                  </li>
                ))}
              </ul>
              {ready.length > 5 && (
                <p className="mt-3 text-xs text-muted">
                  and {ready.length - 5} more &middot;{' '}
                  <Link href="/students?filter=completed" className="font-semibold text-denim hover:underline">see all</Link>
                </p>
              )}
            </>
          ) : (
            <p className="px-2 py-6 text-center text-xs text-muted">
              Students who finish every lesson but haven&rsquo;t passed the final assessment show up here.
            </p>
          )}
        </section>
        </div>
      </div>
    </>
  )
}
