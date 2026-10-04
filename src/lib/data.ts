import { cache } from 'react'
import { ACTIVITY_DAYS, TIMEZONE } from './config'
import { requireAdmin } from './auth'
import { createClient } from './supabase/server'
import { buildStudents, summarize } from './students'
import type { AdminRow, DailyActivityRow, LessonStatRow, StepDetailRow, StudentStatRow } from './types'

type Client = ReturnType<typeof createClient>

// PostgREST caps a response at 1,000 rows by default. Page through so totals are never silently cut off.
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

/**
 * Everything the overview / students / leaderboard pages need, fetched once per request
 * (React `cache` de-dupes it across layout + page).
 */
export const getDashboard = cache(async () => {
  await requireAdmin()
  const supabase = createClient()

  const [statRows, lessons] = await Promise.all([
    rpcAll<StudentStatRow>(supabase, 'admin_student_stats'),
    rpcAll<LessonStatRow>(supabase, 'admin_lesson_stats'),
  ])

  const nowMs = Date.now()
  const totalSteps = lessons.reduce((a, l) => a + l.total_steps, 0)
  const students = buildStudents(statRows, totalSteps, nowMs)
  const summary = summarize(students, lessons, nowMs)
  return { students, lessons, summary, totalSteps, nowMs }
})

export const getActivity = cache(async (): Promise<DailyActivityRow[]> => {
  await requireAdmin()
  const supabase = createClient()
  const { data, error } = await supabase.rpc('admin_daily_activity', { p_days: ACTIVITY_DAYS, p_tz: TIMEZONE })
  if (error) throw new Error(`admin_daily_activity: ${error.message}`)
  return (data ?? []) as DailyActivityRow[]
})

export async function getStudentSteps(userId: string): Promise<StepDetailRow[]> {
  await requireAdmin()
  const supabase = createClient()
  const { data, error } = await supabase.rpc('admin_student_steps', { p_user: userId })
  if (error) throw new Error(`admin_student_steps: ${error.message}`)
  return (data ?? []) as StepDetailRow[]
}

export async function getAdmins(): Promise<AdminRow[]> {
  await requireAdmin()
  const supabase = createClient()
  const { data, error } = await supabase.rpc('admin_list_admins')
  if (error) throw new Error(`admin_list_admins: ${error.message}`)
  return (data ?? []) as AdminRow[]
}
