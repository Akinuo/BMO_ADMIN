-- B.M.O Admin Dashboard — speed-ups. Run ONCE in the Supabase SQL Editor (same project). Safe to re-run.
-- Run it AFTER admin_dashboard.sql. The site works without it, just slower.
--
--   * Indexes on the columns the dashboard queries join and group by, so they stay fast as
--     progress rows pile up. They only read-speed; nothing in the student app changes.
--     (If one already exists under another name, the extra index is harmless.)
--   * admin_students_snapshot(): students + lessons as ONE json value. One round trip, the heavy
--     query runs once (the old way ran it again for every 1,000 students), and the 1,000-row
--     response cap no longer applies.

create index if not exists progress_user_completed_idx on public.progress (user_id, completed_at);
create index if not exists progress_step_idx           on public.progress (step_id);
create index if not exists steps_lesson_slug_idx       on public.steps (lesson_slug);
create index if not exists assessment_attempts_user_idx on public.assessment_attempts (user_id);

create or replace function public.admin_students_snapshot()
returns jsonb
language plpgsql stable security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'students', (select coalesce(jsonb_agg(to_jsonb(s) order by s.joined_at, s.user_id), '[]'::jsonb)
                 from public.admin_student_stats() s),
    'lessons',  (select coalesce(jsonb_agg(to_jsonb(l) order by l.lesson_position, l.lesson_slug), '[]'::jsonb)
                 from public.admin_lesson_stats() l)
  );
end
$$;

revoke all on function public.admin_students_snapshot() from public, anon;
grant execute on function public.admin_students_snapshot() to authenticated;
