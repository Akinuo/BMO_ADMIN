import { ACTIVE_DAYS, DAY_MS, STALLED_DAYS } from './config'
import { pct } from './format'
import { rankStudents } from './ranking'
import type { LessonStatRow, Student, StudentStatRow, StudentStatus } from './types'

function displayName(row: StudentStatRow): { name: string; hasName: boolean } {
  if (row.display_name && row.display_name.trim()) return { name: row.display_name.trim(), hasName: true }
  const local = row.email?.split('@')[0]
  return { name: local || 'Student', hasName: false }
}

/** Turns raw SQL rows into UI-ready students: progress %, status, stalled flag, rank. */
export function buildStudents(rows: StudentStatRow[], totalSteps: number, nowMs: number): Student[] {
  const base = rows.map(r => {
    const steps = Math.min(r.steps_completed, totalSteps > 0 ? totalSteps : r.steps_completed)
    const assessment =
      r.assessment_score !== null && r.assessment_total !== null
        ? {
            score: r.assessment_score,
            total: r.assessment_total,
            pct: pct(r.assessment_score, r.assessment_total),
            passed: !!r.assessment_passed,
            at: r.assessment_at,
          }
        : null

    let status: StudentStatus = 'not_started'
    if (assessment?.passed) status = 'certified'
    else if (totalSteps > 0 && steps >= totalSteps) status = 'completed'
    else if (steps > 0) status = 'in_progress'

    // "No progress for N days" — measured from their last step, or from sign-up if they never started.
    const since = new Date(r.last_activity ?? r.joined_at).getTime()
    const stalled = (status === 'not_started' || status === 'in_progress') && nowMs - since > STALLED_DAYS * DAY_MS

    const { name, hasName } = displayName(r)
    return {
      id: r.user_id,
      name,
      hasName,
      email: r.email,
      joinedAt: r.joined_at,
      lastSignInAt: r.last_sign_in_at,
      steps,
      lessons: r.lessons_completed,
      progress: pct(steps, totalSteps),
      firstActivity: r.first_activity,
      lastActivity: r.last_activity,
      assessment,
      status,
      stalled,
      assessmentPct: assessment ? assessment.pct : null,
    }
  })

  return rankStudents(base).map(({ assessmentPct: _drop, ...s }) => s as Student)
}

export type Summary = {
  total: number
  newThisWeek: number
  activeThisWeek: number
  notStarted: number
  inProgress: number
  completed: number
  certified: number
  finishedCourse: number // completed + certified
  stalled: number
  avgProgress: number // 0–100 across ALL students
  assessmentTaken: number
  assessmentPassRate: number | null // % of those who took it
  totalSteps: number
  totalLessons: number
}

export function summarize(students: Student[], lessons: LessonStatRow[], nowMs: number): Summary {
  const weekAgo = nowMs - ACTIVE_DAYS * DAY_MS
  const count = (s: StudentStatus) => students.filter(x => x.status === s).length
  const taken = students.filter(s => s.assessment)
  const passed = taken.filter(s => s.assessment?.passed).length
  const completed = count('completed')
  const certified = count('certified')
  return {
    total: students.length,
    newThisWeek: students.filter(s => new Date(s.joinedAt).getTime() >= weekAgo).length,
    activeThisWeek: students.filter(s => s.lastActivity && new Date(s.lastActivity).getTime() >= weekAgo).length,
    notStarted: count('not_started'),
    inProgress: count('in_progress'),
    completed,
    certified,
    finishedCourse: completed + certified,
    stalled: students.filter(s => s.stalled).length,
    avgProgress: students.length ? Math.round(students.reduce((a, s) => a + s.progress, 0) / students.length) : 0,
    assessmentTaken: taken.length,
    assessmentPassRate: taken.length ? Math.round((passed / taken.length) * 100) : null,
    totalSteps: lessons.reduce((a, l) => a + l.total_steps, 0),
    totalLessons: lessons.length,
  }
}
