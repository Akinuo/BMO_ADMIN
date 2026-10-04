import { formatDay, formatDayLong, pct, plural } from '@/lib/format'
import type { DailyActivityRow, LessonStatRow } from '@/lib/types'

/** Steps completed per day. Plain CSS bars — responsive, no chart library. */
export function ActivityChart({ data }: { data: DailyActivityRow[] }) {
  const max = Math.max(1, ...data.map(d => d.steps_completed))
  // round the top of the scale so the half-way gridline is a whole number
  const top = max <= 10 ? Math.max(2, Math.ceil(max / 2) * 2) : max <= 100 ? Math.ceil(max / 10) * 10 : Math.ceil(max / 20) * 20
  const total = data.reduce((a, d) => a + d.steps_completed, 0)
  const joined = data.reduce((a, d) => a + d.new_students, 0)
  const empty = total === 0
  const gap = data.length > 45 ? 'gap-px' : 'gap-[3px]'

  return (
    <figure aria-label={`Steps completed per day over the last ${data.length} days`}>
      <div className={`relative flex h-44 items-end ${gap} pl-8`}>
        {/* gridlines + scale */}
        {[1, 0.5, 0].map(f => (
          <div key={f} className="pointer-events-none absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${f * 100}%`, transform: 'translateY(50%)' }}>
            <span className="w-6 text-right text-[10px] leading-none text-muted">{Math.round(top * f)}</span>
            <span className="h-px flex-1 bg-border/70" />
          </div>
        ))}
        {data.map(d => {
          const h = (d.steps_completed / top) * 100
          return (
            <div
              key={d.day}
              className="group relative z-10 flex h-full flex-1 items-end"
              title={`${formatDayLong(d.day)} — ${plural(d.steps_completed, 'step')}, ${plural(d.active_students, 'student')} active${d.new_students ? `, ${d.new_students} new` : ''}`}
            >
              <div
                className={`grow-y w-full rounded-t-[3px] ${d.steps_completed ? 'bg-denim group-hover:bg-denim-deep' : 'bg-denim-light'}`}
                style={{ height: d.steps_completed ? `max(${h}%, 3px)` : '2px' }}
              />
            </div>
          )
        })}
      </div>
      {/* one marker per day that had a new sign-up */}
      <div className={`mt-1.5 flex h-2 ${gap} pl-8`} aria-hidden="true">
        {data.map(d => (
          <div key={d.day} className="flex flex-1 justify-center">
            {d.new_students > 0 && <span className="h-2 w-2 rounded-full bg-thread" />}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between pl-8 text-[11px] text-muted">
        <span>{formatDay(data[0]?.day ?? '1970-01-01')}</span>
        <span>{formatDay(data[Math.floor(data.length / 2)]?.day ?? '1970-01-01')}</span>
        <span>{formatDay(data[data.length - 1]?.day ?? '1970-01-01')}</span>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-denim" />Steps completed</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-thread" />Day with a new sign-up</span>
        <span className="ml-auto font-medium text-ink">
          {empty ? 'No activity in this period yet' : `${plural(total, 'step')} · ${plural(joined, 'new student')}`}
        </span>
      </figcaption>
    </figure>
  )
}

/** One row per lesson, in course order: finished vs. started-but-not-finished, out of all students. */
export function LessonFunnel({ lessons, totalStudents }: { lessons: LessonStatRow[]; totalStudents: number }) {
  return (
    <div>
      <ol className="grid gap-3.5">
        {lessons.map((l, i) => {
          const done = pct(l.students_completed, totalStudents)
          const partial = pct(l.students_started - l.students_completed, totalStudents)
          return (
            <li key={l.lesson_slug}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="mr-2 font-display font-bold text-denim">{i + 1}</span>
                  <span className="font-medium text-ink">{l.title}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  <b className="font-semibold text-ink">{l.students_completed}</b> finished
                  {l.students_started - l.students_completed > 0 && <> · {l.students_started - l.students_completed} in progress</>}
                </span>
              </div>
              <div
                className="flex h-2.5 w-full overflow-hidden rounded-full bg-denim-light"
                role="img"
                aria-label={`${l.title}: ${l.students_completed} of ${totalStudents} students finished, ${l.students_started - l.students_completed} in progress`}
              >
                <div className="grow-x h-full bg-denim" style={{ width: `${done}%` }} />
                <div className="grow-x h-full bg-thread/70" style={{ width: `${partial}%` }} />
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-denim" />Finished the lesson</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-thread/70" />Started, not finished</span>
        <span className="ml-auto">Out of {plural(totalStudents, 'student')}</span>
      </p>
    </div>
  )
}
