import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IconArrowLeft, IconCertificate, IconCheck, IconChevron } from '@/components/icons'
import PrintButton from '@/components/PrintButton'
import { Avatar, PrintMasthead, ProgressBar, RankBadge, StalledChip, StatusChip } from '@/components/ui'
import { getDashboard, getStudentSteps } from '@/lib/data'
import { formatDate, formatDateTime, plural, timeAgo } from '@/lib/format'
import type { StepDetailRow } from '@/lib/types'

export const metadata: Metadata = { title: 'Student' }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type LessonGroup = {
  slug: string
  title: string
  position: number
  steps: StepDetailRow[]
}

function group(rows: StepDetailRow[]): LessonGroup[] {
  const map = new Map<string, LessonGroup>()
  for (const r of rows) {
    if (!map.has(r.lesson_slug)) map.set(r.lesson_slug, { slug: r.lesson_slug, title: r.lesson_title, position: r.lesson_position, steps: [] })
    map.get(r.lesson_slug)!.steps.push(r)
  }
  return [...map.values()].sort((a, b) => a.position - b.position)
}

function Stat({ label, children, sub }: { label: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="card p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold leading-tight text-denim">{children}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  )
}

export default async function StudentPage({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound()

  const { students, summary, nowMs } = await getDashboard()
  const s = students.find(x => x.id === params.id)
  if (!s) notFound()

  const lessons = group(await getStudentSteps(s.id))
  // the lesson they're working on right now opens by default
  const currentIdx = lessons.findIndex(l => l.steps.some(st => !st.completed_at))
  const rankedCount = students.filter(x => x.rank !== null).length
  const recent = lessons
    .flatMap(l => l.steps.filter(st => st.completed_at).map(st => ({ ...st, lessonTitle: l.title })))
    .sort((a, b) => new Date(b.completed_at as string).getTime() - new Date(a.completed_at as string).getTime())
    .slice(0, 8)

  return (
    <>
      <PrintMasthead title="Student progress report" />
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link href="/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-denim">
          <IconArrowLeft className="h-4 w-4" /> All students
        </Link>
        <PrintButton label="Print report" />
      </div>

      {/* Header */}
      <section className="card flex flex-wrap items-center gap-4 p-5">
        <Avatar name={s.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-bold text-denim">{s.name}</h1>
          {s.email && <p className="truncate text-sm text-muted">{s.email}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusChip status={s.status} />
            {s.stalled && <StalledChip />}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-chalk px-4 py-3">
          <RankBadge rank={s.rank} tied={s.tied} size="lg" />
          <div className="text-xs leading-snug text-muted">
            {s.rank !== null ? (
              <>
                <b className="block text-sm text-ink">Rank {s.rank}{s.tied ? ' (tied)' : ''}</b>
                of {plural(rankedCount, 'ranked student')}
              </>
            ) : (
              <>
                <b className="block text-sm text-ink">Not ranked yet</b>
                Ranked after the first step
              </>
            )}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section aria-label="Numbers" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card col-span-2 p-4 lg:col-span-1">
          <p className="eyebrow">Progress</p>
          <p className="mt-1.5 font-display text-2xl font-bold leading-tight text-denim">{s.progress}%</p>
          <ProgressBar value={s.progress} className="mt-2" />
        </div>
        <Stat label="Steps" sub={`${summary.totalSteps - s.steps} to go`}>{s.steps} <span className="text-base font-medium text-muted">/ {summary.totalSteps}</span></Stat>
        <Stat label="Lessons" sub="fully completed">{s.lessons} <span className="text-base font-medium text-muted">/ {summary.totalLessons}</span></Stat>
        <Stat
          label="Final assessment"
          sub={s.assessment ? (s.assessment.passed ? 'Passed · certificate earned' : 'Not passed yet') : 'Unlocks after all lessons'}
        >
          {s.assessment ? <>{s.assessment.score} <span className="text-base font-medium text-muted">/ {s.assessment.total} · {s.assessment.pct}%</span></> : <span className="text-base font-medium text-muted">Not taken</span>}
        </Stat>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Lessons */}
        <section className="card p-5 lg:col-span-2" aria-label="Lessons">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h2 className="card-title">Lesson by lesson</h2>
            <p className="text-xs tabular-nums text-muted">{s.lessons} of {summary.totalLessons} lessons complete</p>
          </div>
          <p className="mb-4 text-xs text-muted">Open a lesson to see each step and when it was finished. A step is done once its quiz question is answered correctly.</p>
          <ol className="lesson-rail grid gap-2.5">
            {lessons.map((l, i) => {
              const done = l.steps.filter(st => st.completed_at).length
              const complete = done === l.steps.length && l.steps.length > 0
              const last = l.steps.map(st => st.completed_at).filter(Boolean).sort().pop() ?? null
              return (
                <li key={l.slug}>
                  <span
                    className={`absolute left-0 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 font-display text-sm font-bold ${
                      complete ? 'border-green bg-green text-white' : done ? 'border-denim bg-paper text-denim' : 'border-border bg-chalk text-muted'
                    }`}
                  >
                    {complete ? <IconCheck className="h-4 w-4" /> : i + 1}
                  </span>
                  <details open={i === currentIdx} className="group rounded-lg border border-border bg-paper open:border-denim/30 open:shadow-sm">
                    <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-4 py-3 hover:bg-denim-light/40 [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{l.title}</p>
                        <div className="mt-2 flex gap-1" aria-hidden="true">
                          {l.steps.map(st => (
                            <span key={st.step_id} className={`h-1.5 flex-1 rounded-full ${st.completed_at ? (complete ? 'bg-green' : 'bg-denim') : 'bg-denim-light'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-ink">{done}/{l.steps.length} <span className="font-normal text-muted">steps</span></p>
                        <p className="text-xs text-muted">{complete ? `Finished ${formatDate(last)}` : done ? `Last step ${formatDate(last)}` : 'Not started'}</p>
                      </div>
                      <IconChevron className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180 print:hidden" />
                    </summary>
                    <ol className="grid gap-px border-t border-border px-4 py-2">
                      {l.steps.map(st => (
                        <li key={st.step_id} className="flex items-center gap-3 py-1.5 text-sm">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${st.completed_at ? (complete ? 'bg-green' : 'bg-denim') : 'border border-border bg-chalk'}`} />
                          <span className={`min-w-0 flex-1 ${st.completed_at ? 'text-ink' : 'text-muted'}`}>{st.step_title}</span>
                          <span className="shrink-0 text-xs tabular-nums text-muted">{st.completed_at ? formatDateTime(st.completed_at) : 'Not done'}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                </li>
              )
            })}
          </ol>
        </section>

        <div className="grid content-start gap-4">
          {/* Details */}
          <section className="card p-5" aria-label="Account details">
            <h2 className="card-title">Details</h2>
            <dl className="mt-3 grid gap-2.5 text-sm">
              {[
                ['Joined', formatDate(s.joinedAt)],
                ['Last signed in', s.lastSignInAt ? timeAgo(s.lastSignInAt, nowMs) : 'Never'],
                ['First step', s.firstActivity ? formatDate(s.firstActivity) : '—'],
                ['Last step', s.lastActivity ? timeAgo(s.lastActivity, nowMs) : '—'],
                ['Assessment taken', s.assessment?.at ? formatDate(s.assessment.at) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            {s.assessment?.passed && (
              <p className="mt-4 flex items-center gap-2 rounded bg-green-soft px-3 py-2 text-xs font-medium text-green">
                <IconCertificate className="h-4 w-4 shrink-0" /> Passed the final assessment
              </p>
            )}
          </section>

          {/* Recent */}
          <section className="card p-5" aria-label="Recent activity">
            <h2 className="card-title">Recent steps</h2>
            {recent.length ? (
              <ul className="mt-3 grid gap-3">
                {recent.map(r => (
                  <li key={r.step_id} className="flex gap-2.5">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-thread" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{r.step_title}</p>
                      <p className="truncate text-xs text-muted">{r.lessonTitle} · {timeAgo(r.completed_at, nowMs)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No steps completed yet.</p>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
