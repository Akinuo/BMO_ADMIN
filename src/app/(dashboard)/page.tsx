import type { Metadata } from 'next'
import Link from 'next/link'
import { ActivityChart, LessonFunnel } from '@/components/charts'
import { IconAlert, IconArrowRight, IconCertificate, IconCheck, IconLayers, IconPulse, IconUsers } from '@/components/icons'
import RefreshButton from '@/components/RefreshButton'
import { EmptyState, KpiCard, PageHeader, ProgressBar, RankBadge, StudentLink } from '@/components/ui'
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

export default async function OverviewPage() {
  const [{ students, lessons, summary, nowMs }, activity] = await Promise.all([getDashboard(), getActivity()])

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
        actions={<RefreshButton />}
      />

      {/* KPIs */}
      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <KpiCard
            accent
            label="Total students"
            value={summary.total.toLocaleString('en-PH')}
            hint={summary.newThisWeek ? `+${summary.newThisWeek} joined in the last ${ACTIVE_DAYS} days` : `None new in the last ${ACTIVE_DAYS} days`}
            icon={<IconUsers className="h-4 w-4" />}
          />
        </div>
        <KpiCard
          label={`Active · ${ACTIVE_DAYS} days`}
          value={summary.activeThisWeek.toLocaleString('en-PH')}
          hint={hasStudents ? `${pct(summary.activeThisWeek, summary.total)}% of students` : '—'}
          icon={<IconPulse className="h-4 w-4" />}
        />
        <KpiCard
          label="Average progress"
          value={`${summary.avgProgress}%`}
          hint={`of ${plural(summary.totalSteps, 'step')}, across all students`}
          icon={<IconLayers className="h-4 w-4" />}
        />
        <KpiCard
          label="Finished all lessons"
          value={summary.finishedCourse.toLocaleString('en-PH')}
          hint={hasStudents ? `${pct(summary.finishedCourse, summary.total)}% of students` : '—'}
          icon={<IconCheck className="h-4 w-4" />}
        />
        <KpiCard
          label="Certified"
          value={summary.certified.toLocaleString('en-PH')}
          hint={
            summary.assessmentPassRate !== null
              ? `${summary.assessmentPassRate}% pass rate · ${plural(summary.assessmentTaken, 'attempt')}`
              : 'No assessment taken yet'
          }
          icon={<IconCertificate className="h-4 w-4" />}
        />
      </section>

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
          <h2 className="card-title">Activity, last {ACTIVITY_DAYS} days</h2>
          <p className="mb-4 text-xs text-muted">Steps completed per day</p>
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
      </div>
    </>
  )
}
