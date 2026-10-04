// Row shapes returned by the SQL functions in supabase/admin_dashboard.sql.

export type StudentStatRow = {
  user_id: string
  email: string | null
  display_name: string | null
  joined_at: string
  last_sign_in_at: string | null
  steps_completed: number
  lessons_completed: number
  first_activity: string | null
  last_activity: string | null
  assessment_score: number | null
  assessment_total: number | null
  assessment_passed: boolean | null
  assessment_at: string | null
}

export type LessonStatRow = {
  lesson_slug: string
  title: string
  lesson_position: number
  total_steps: number
  students_started: number
  students_completed: number
  step_completions: number
}

export type DailyActivityRow = {
  day: string // yyyy-mm-dd
  steps_completed: number
  active_students: number
  new_students: number
}

export type StepDetailRow = {
  lesson_slug: string
  lesson_title: string
  lesson_position: number
  step_id: string
  step_position: number
  step_title: string
  completed_at: string | null
}

// ── Derived (what the UI works with) ─────────────────────────────────────────

export type StudentStatus = 'not_started' | 'in_progress' | 'completed' | 'certified'

export type Student = {
  id: string
  name: string // display name, or the email's local part, or "Student"
  hasName: boolean
  email: string | null
  joinedAt: string
  lastSignInAt: string | null
  steps: number
  lessons: number
  /** 0–100, whole number */
  progress: number
  firstActivity: string | null
  lastActivity: string | null
  assessment: { score: number; total: number; pct: number; passed: boolean; at: string | null } | null
  status: StudentStatus
  stalled: boolean
  /** null = not ranked yet (no steps completed) */
  rank: number | null
  /** true when another student shares exactly this rank */
  tied: boolean
}

export const STATUS_LABEL: Record<StudentStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Course complete',
  certified: 'Certified',
}
