-- B.M.O Admin Dashboard — database support.
--
-- Run ONCE in the Supabase SQL Editor of the SAME project the student site (VAL / B.M.O) uses,
-- after 0001_init.sql and 0002_assessment.sql have been run. Safe to re-run.
--
-- What this does:
--   * Adds four READ-ONLY functions the admin site calls. Nothing is created, edited or deleted
--     in any student table, and no existing RLS policy is changed — the student site is untouched.
--   * Every function checks public.is_admin() first (the same check your existing admin RLS
--     policies use), so only accounts with profiles.role = 'admin' ever get data back. A student
--     who somehow calls them gets a "not authorized" error.
--   * They run as SECURITY DEFINER so they can read emails/names from auth.users, which the
--     browser can never read directly. This is why the admin site needs NO service_role key.
--
-- "Students" = every account whose profile role is 'student' (or has no profile row), whose email
-- is confirmed and which isn't soft-deleted. Unconfirmed sign-ups can't log in, so they aren't
-- counted. To count them too, delete the `u.email_confirmed_at is not null` line in
-- admin_student_stats(), admin_lesson_stats() and admin_daily_activity().

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. One row per student: identity + progress + final-assessment result
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_student_stats()
returns table (
  user_id           uuid,
  email             text,
  display_name      text,
  joined_at         timestamptz,
  last_sign_in_at   timestamptz,
  steps_completed   int,
  lessons_completed int,
  first_activity    timestamptz,
  last_activity     timestamptz,
  assessment_score  int,
  assessment_total  int,
  assessment_passed boolean,
  assessment_at     timestamptz
)
language plpgsql stable security definer
set search_path = public, auth
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  with lesson_totals as (
    select s.lesson_slug, count(*)::int as total
    from public.steps s
    group by s.lesson_slug
  ),
  per_lesson as (
    select p.user_id, s.lesson_slug, count(*)::int as done
    from public.progress p
    join public.steps s on s.id = p.step_id
    group by p.user_id, s.lesson_slug
  ),
  agg as (
    select pl.user_id,
           sum(pl.done)::int as steps_completed,
           (count(*) filter (where pl.done >= lt.total))::int as lessons_completed
    from per_lesson pl
    join lesson_totals lt on lt.lesson_slug = pl.lesson_slug
    group by pl.user_id
  ),
  times as (
    select p.user_id,
           min(p.completed_at) as first_activity,
           max(p.completed_at) as last_activity
    from public.progress p
    group by p.user_id
  )
  select u.id,
         u.email::text,
         coalesce(
           nullif(u.raw_user_meta_data->>'display_name', ''),
           nullif(u.raw_user_meta_data->>'full_name', ''),
           nullif(u.raw_user_meta_data->>'name', '')
         ),
         u.created_at,
         u.last_sign_in_at,
         coalesce(a.steps_completed, 0),
         coalesce(a.lessons_completed, 0),
         t.first_activity,
         t.last_activity,
         aa.score,
         aa.total,
         aa.passed,
         aa.completed_at
  from auth.users u
  left join public.profiles pr on pr.id = u.id
  left join agg a on a.user_id = u.id
  left join times t on t.user_id = u.id
  left join public.assessment_attempts aa on aa.user_id = u.id
  where coalesce(pr.role, 'student') = 'student'
    and u.deleted_at is null
    and u.email_confirmed_at is not null
  order by u.created_at, u.id;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. One row per lesson: how many students started / finished it
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_lesson_stats()
returns table (
  lesson_slug        text,
  title              text,
  lesson_position    int,
  total_steps        int,
  students_started   int,
  students_completed int,
  step_completions   int
)
language plpgsql stable security definer
set search_path = public, auth
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  with students as (
    select u.id
    from auth.users u
    left join public.profiles pr on pr.id = u.id
    where coalesce(pr.role, 'student') = 'student'
      and u.deleted_at is null
      and u.email_confirmed_at is not null
  ),
  lesson_totals as (
    select s.lesson_slug, count(*)::int as total
    from public.steps s
    group by s.lesson_slug
  ),
  per_student as (
    select p.user_id, s.lesson_slug, count(*)::int as done
    from public.progress p
    join public.steps s on s.id = p.step_id
    join students st on st.id = p.user_id
    group by p.user_id, s.lesson_slug
  ),
  per_lesson as (
    select ps.lesson_slug,
           count(*)::int as started,
           (count(*) filter (where ps.done >= lt.total))::int as completed,
           sum(ps.done)::int as completions
    from per_student ps
    join lesson_totals lt on lt.lesson_slug = ps.lesson_slug
    group by ps.lesson_slug
  )
  select l.slug,
         l.title,
         l.position,
         coalesce(lt.total, 0),
         coalesce(pl.started, 0),
         coalesce(pl.completed, 0),
         coalesce(pl.completions, 0)
  from public.lessons l
  left join lesson_totals lt on lt.lesson_slug = l.slug
  left join per_lesson pl on pl.lesson_slug = l.slug
  order by l.position, l.slug;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Daily activity for the last N days (days are cut at midnight Philippine time)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_daily_activity(p_days int default 30, p_tz text default 'Asia/Manila')
returns table (
  day             date,
  steps_completed int,
  active_students int,
  new_students    int
)
language plpgsql stable security definer
set search_path = public, auth
as $$
#variable_conflict use_column
declare
  v_days int := greatest(1, least(coalesce(p_days, 30), 366));
  v_today date := (now() at time zone p_tz)::date;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  with students as (
    select u.id, u.created_at
    from auth.users u
    left join public.profiles pr on pr.id = u.id
    where coalesce(pr.role, 'student') = 'student'
      and u.deleted_at is null
      and u.email_confirmed_at is not null
  ),
  days as (
    select (v_today - g)::date as d from generate_series(0, v_days - 1) as g
  ),
  prog as (
    select (p.completed_at at time zone p_tz)::date as d,
           count(*)::int as steps,
           count(distinct p.user_id)::int as students
    from public.progress p
    join students st on st.id = p.user_id
    where (p.completed_at at time zone p_tz)::date > v_today - v_days
    group by 1
  ),
  joins as (
    select (st.created_at at time zone p_tz)::date as d, count(*)::int as n
    from students st
    where (st.created_at at time zone p_tz)::date > v_today - v_days
    group by 1
  )
  select days.d,
         coalesce(prog.steps, 0),
         coalesce(prog.students, 0),
         coalesce(joins.n, 0)
  from days
  left join prog  on prog.d  = days.d
  left join joins on joins.d = days.d
  order by days.d;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Step-by-step progress for ONE student (used by the student detail page)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_student_steps(p_user uuid)
returns table (
  lesson_slug     text,
  lesson_title    text,
  lesson_position int,
  step_id         text,
  step_position   int,
  step_title      text,
  completed_at    timestamptz
)
language plpgsql stable security definer
set search_path = public, auth
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select l.slug,
         l.title,
         l.position,
         s.id,
         s.position,
         s.title,
         p.completed_at
  from public.lessons l
  join public.steps s on s.lesson_slug = l.slug
  left join public.progress p on p.step_id = s.id and p.user_id = p_user
  order by l.position, l.slug, s.position, s.id;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Lock down who may call them: signed-in users only (and each one re-checks is_admin()).
-- ─────────────────────────────────────────────────────────────────────────────
revoke all on function public.admin_student_stats()               from public, anon;
revoke all on function public.admin_lesson_stats()                from public, anon;
revoke all on function public.admin_daily_activity(int, text)     from public, anon;
revoke all on function public.admin_student_steps(uuid)           from public, anon;

grant execute on function public.admin_student_stats()            to authenticated;
grant execute on function public.admin_lesson_stats()             to authenticated;
grant execute on function public.admin_daily_activity(int, text)  to authenticated;
grant execute on function public.admin_student_steps(uuid)        to authenticated;
