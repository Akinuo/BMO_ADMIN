import { cache } from 'react'
import { ACTIVITY_DAYS, TIMEZONE } from './config'
import { requireAdmin } from './auth'
import { ttlCache } from './cache'
import { createClient } from './supabase/server'
import { buildStudents, summarize } from './students'
import type { AdminRow, DailyActivityRow, LessonStatRow, StepDetailRow, StudentStatRow } from './types'

type Client = ReturnType<typeof createClient>

const isMissingFunction = (error: { code?: string; message: string }) =>
  error.code === 'PGRST202' || error.code === '42883' || /could not find the function|does not exist/i.test(error.message)

// PostgREST caps a response at 1,000 rows by default. Page through so totals are never silently cut off.
// (Slow path: each page re-runs the whole SQL function. Prefer admin_students_snapshot, below.)
const CHUNK = 1000

async function rpcAll<T>(supabase: Client, fn: string, args?: Record<string, unknown>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += CHUNK) {
    const { data, error } = await supabase.rpc(fn, args).range(from, from + CHUNK - 1)
    if (error) throw new Error(`${fn}: ${error.message}`)
    const page = (data ?? []) as T[]
    rows.push(...page)
    if (page.length < CHUNK) return rows
  }
}

type Snapshot = { statRows: StudentStatRow[]; lessons: LessonStatRow[] }

// supabase/performance.sql adds admin_students_snapshot(): students + lessons as ONE jsonb value,
// so there is a single round trip, a single run of the heavy query, and no 1,000-row cap.
// If it hasn't been installed yet, fall back to the original calls (and look again in a few minutes).
let snapshotMissingUntil = 0

async function loadSnapshot(supabase: Client): Promise<Snapshot> {
  if (Date.now() >= snapshotMissingUntil) {
    const { data, error } = await supabase.rpc('admin_students_snapshot')
    if (!error) {
      const snap = (data ?? {}) as { students?: StudentStatRow[]; lessons?: LessonStatRow[] }
      return { statRows: snap.students ?? [], lessons: snap.lessons ?? [] }
    }
    if (!isMissingFunction(error)) throw new Error(`admin_students_snapshot: ${error.message}`)
    snapshotMissingUntil = Date.now() + 5 * 60 * 1000
  }
  const [statRows, lessons] = await Promise.all([
    rpcAll<StudentStatRow>(supabase, 'admin_student_stats'),
    rpcAll<LessonStatRow>(supabase, 'admin_lesson_stats'),
  ])
  return { statRows, lessons }
}

/**
 * For the uncached per-student query: starts the admin check and the fetch together (one round trip
 * saved), then only hands the data over once the admin check has passed. The SQL function checks
 * is_admin() itself, so starting early exposes nothing.
 */
async function adminThen<T>(data: Promise<T>): Promise<T> {
  data.catch(() => {}) // if the admin check redirects first, don't leave this rejection unhandled
  await requireAdmin()
  return data
}

/**
 * Everything the overview / students / leaderboard pages need, fetched once per request
 * (React `cache` de-dupes it across layout + page) and shared between requests for a few seconds.
 * `fetchedAt` is when the numbers were actually read from the database.
 *
 * The admin check comes FIRST: the shared cache must only ever be touched by a confirmed admin
 * (otherwise a non-admin's failed load could be shared with, or refreshed by, a real admin).
 */
export const getDashboard = cache(async () => {
  await requireAdmin()
  const supabase = createClient()
  const { statRows, lessons, fetchedAt } = await ttlCache('snapshot', async () => ({
    ...(await loadSnapshot(supabase)),
    fetchedAt: Date.now(),
  }))

  const nowMs = Date.now()
  const totalSteps = lessons.reduce((a, l) => a + l.total_steps, 0)
  const students = buildStudents(statRows, totalSteps, nowMs)
  const summary = summarize(students, lessons, nowMs)
  return { students, lessons, summary, totalSteps, nowMs, fetchedAt }
})

export const getActivity = cache(async (days: number = ACTIVITY_DAYS): Promise<DailyActivityRow[]> => {
  await requireAdmin()
  const supabase = createClient()
  return ttlCache(`activity:${days}`, async () => {
    const { data, error } = await supabase.rpc('admin_daily_activity', { p_days: days, p_tz: TIMEZONE })
    if (error) throw new Error(`admin_daily_activity: ${error.message}`)
    return (data ?? []) as DailyActivityRow[]
  })
})

export async function getStudentSteps(userId: string): Promise<StepDetailRow[]> {
  const supabase = createClient()
  return adminThen(
    (async () => {
      const { data, error } = await supabase.rpc('admin_student_steps', { p_user: userId })
      if (error) throw new Error(`admin_student_steps: ${error.message}`)
      return (data ?? []) as StepDetailRow[]
    })(),
  )
}

type AdminsResult = { admins: AdminRow[]; setupNeeded: boolean; error: string | null }

/**
 * Never throws: in production Next.js hides thrown messages, which left the Admins page
 * showing a generic error when the SQL hadn't been run yet. Return the state instead.
 */
export async function getAdmins(): Promise<AdminsResult> {
  await requireAdmin()
  const supabase = createClient()
  const { data, error } = await supabase.rpc('admin_list_admins')
  if (error) {
    const missing = isMissingFunction(error)
    return { admins: [], setupNeeded: missing, error: missing ? null : 'Could not load the admin list. Please try again.' }
  }
  return { admins: (data ?? []) as AdminRow[], setupNeeded: false, error: null }
}
