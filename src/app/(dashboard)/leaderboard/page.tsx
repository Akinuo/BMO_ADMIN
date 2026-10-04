import type { Metadata } from 'next'
import Link from 'next/link'
import { IconArrowRight, IconCertificate, IconLayers, IconStar, IconClock } from '@/components/icons'
import { Avatar, EmptyState, PageHeader, ProgressBar, RankBadge, StatusChip } from '@/components/ui'
import { LEADERBOARD_LIMIT } from '@/lib/config'
import { getDashboard } from '@/lib/data'
import { plural, timeAgo } from '@/lib/format'
import type { Student } from '@/lib/types'

export const metadata: Metadata = { title: 'Leaderboard' }

const RULES = [
  { Icon: IconLayers, title: 'Steps completed', body: 'The student who has completed more of the course ranks higher.' },
  { Icon: IconCertificate, title: 'Final assessment', body: 'If steps are equal, the higher assessment score wins. Any attempt beats none.' },
  { Icon: IconClock, title: 'Who got there first', body: 'If that is equal too, the student who reached it earlier ranks higher.' },
]

function PodiumCard({ s, place, totalSteps, className = '' }: { s: Student; place: 1 | 2 | 3; totalSteps: number; className?: string }) {
  const ring =
    place === 1 ? 'border-thread bg-amber-soft/60 shadow-md'
    : place === 2 ? 'border-silver/50'
    : 'border-bronze/40'
  return (
    <Link
      href={`/students/${s.id}`}
      className={`card fade-in group relative flex flex-col items-center gap-2 border-2 p-5 text-center transition-shadow hover:shadow-md ${ring} ${place === 1 ? 'md:-mt-4 md:pb-8' : ''} ${className}`}
    >
      {place === 1 && <IconStar className="absolute right-3 top-3 h-5 w-5 text-thread" />}
      <RankBadge rank={s.rank} tied={s.tied} size="lg" />
      <Avatar name={s.name} size="lg" />
      <div className="min-w-0 max-w-full">
        <p className="truncate font-display text-base font-bold text-ink group-hover:text-denim group-hover:underline">{s.name}</p>
        {s.email && <p className="truncate text-xs text-muted">{s.email}</p>}
      </div>
      <div className="w-full">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-display text-2xl font-bold text-denim">{s.progress}%</span>
          <span className="text-muted">{s.steps} / {totalSteps} steps</span>
        </div>
        <ProgressBar value={s.progress} className="mt-1.5" />
      </div>
      <p className="text-xs text-muted">
        {s.assessment ? <>Assessment <b className="text-ink">{s.assessment.score}/{s.assessment.total}</b> ({s.assessment.pct}%)</> : 'Assessment not taken'}
      </p>
    </Link>
  )
}

export default async function LeaderboardPage() {
  const { students, summary, nowMs } = await getDashboard()
  const ranked = students.filter(s => s.rank !== null)
  const unranked = students.length - ranked.length
  const shown = ranked.slice(0, LEADERBOARD_LIMIT)
  const podium = ranked.filter(s => (s.rank as number) <= 3).slice(0, 3)

  // Phones stack 1st · 2nd · 3rd. From md up, three cards sit as 2nd · 1st · 3rd (CSS order, same DOM).
  const mdOrder = (i: number) => (podium.length === 3 ? ['md:order-2', 'md:order-1', 'md:order-3'][i] : '')

  return (
    <>
      <PageHeader
        title="Leaderboard"
        subtitle={`${plural(ranked.length, 'student')} ranked${unranked ? ` · ${unranked} not started yet` : ''}`}
      />

      {/* How it works */}
      <section aria-label="How ranking works" className="card p-5">
        <h2 className="card-title">How ranking works</h2>
        <ol className="mt-3 grid gap-3 md:grid-cols-3">
          {RULES.map(({ Icon, title, body }, i) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-denim-light text-denim"><Icon className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-semibold text-ink"><span className="mr-1.5 text-muted">{i + 1}.</span>{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
          Students with exactly the same result share a rank (shown with <b>=</b>). Students who haven&rsquo;t completed a step aren&rsquo;t ranked.
        </p>
      </section>

      {ranked.length === 0 ? (
        <section className="card mt-4"><EmptyState title="No one is ranked yet">Students are ranked as soon as they complete their first step.</EmptyState></section>
      ) : (
        <>
          {/* Podium */}
          <section aria-label="Top three" className="mt-6">
            <div className={`grid items-end gap-4 ${podium.length >= 3 ? 'md:grid-cols-3' : podium.length === 2 ? 'md:grid-cols-2' : 'mx-auto max-w-sm'}`}>
              {podium.map((s, i) => (
                <PodiumCard key={s.id} s={s} place={(s.rank as 1 | 2 | 3)} totalSteps={summary.totalSteps} className={mdOrder(i)} />
              ))}
            </div>
          </section>

          {/* Full list */}
          <section aria-label="Full ranking" className="card mt-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="w-16 sm:w-20">Rank</th>
                    <th>Student</th>
                    <th className="hidden w-52 md:table-cell">Progress</th>
                    <th className="hidden xl:table-cell">Assessment</th>
                    <th className="hidden md:table-cell">Status</th>
                    <th className="hidden xl:table-cell">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(s => (
                    <tr key={s.id}>
                      <td><RankBadge rank={s.rank} tied={s.tied} /></td>
                      <td className="w-full max-w-0 md:w-auto md:max-w-[230px] xl:max-w-[240px]">
                        <Link href={`/students/${s.id}`} className="group flex min-w-0 items-center gap-3">
                          <Avatar name={s.name} />
                          <span className="truncate font-semibold text-ink group-hover:text-denim group-hover:underline">{s.name}</span>
                        </Link>
                        <div className="mt-2 md:hidden">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={s.progress} />
                            <span className="w-9 shrink-0 text-right text-xs font-semibold text-ink">{s.progress}%</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            <StatusChip status={s.status} />
                            <span className="text-[11px] text-muted">{s.steps}/{summary.totalSteps} steps</span>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="flex items-center gap-2.5">
                          <ProgressBar value={s.progress} />
                          <span className="w-10 shrink-0 text-right text-xs font-semibold text-ink">{s.progress}%</span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted">{s.steps} of {summary.totalSteps} steps &middot; {s.lessons} of {summary.totalLessons} lessons</div>
                      </td>
                      <td className="hidden whitespace-nowrap xl:table-cell">
                        {s.assessment ? (
                          <><b className="font-semibold text-ink">{s.assessment.score}</b><span className="text-muted"> / {s.assessment.total} · {s.assessment.pct}%</span></>
                        ) : <span className="text-muted">Not taken</span>}
                      </td>
                      <td className="hidden md:table-cell">
                        <StatusChip status={s.status} />
                        <div className="mt-1 whitespace-nowrap text-[11px] text-muted xl:hidden">{timeAgo(s.lastActivity, nowMs)}</div>
                      </td>
                      <td className="hidden whitespace-nowrap text-muted xl:table-cell">{timeAgo(s.lastActivity, nowMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(ranked.length > shown.length || unranked > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-chalk/60 px-4 py-3 text-xs text-muted">
                <span>
                  {ranked.length > shown.length && <>Showing the top {shown.length} of {ranked.length}. </>}
                  {unranked > 0 && <>{plural(unranked, 'student')} not ranked yet.</>}
                </span>
                <Link href="/students" className="flex items-center gap-1 font-semibold text-denim hover:underline">
                  All students <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}
