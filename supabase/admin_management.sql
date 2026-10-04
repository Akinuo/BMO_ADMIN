-- B.M.O Admin Dashboard — admin management.
--
-- Run ONCE in the Supabase SQL Editor (same project), after admin_dashboard.sql. Safe to re-run.
--
-- Adds three functions that let an existing admin manage other admins from the dashboard
-- (Admins page). Same security model as admin_dashboard.sql:
--   * every function checks public.is_admin() first
--   * SECURITY DEFINER, so no service_role key is ever needed in the website
--   * you can only promote an account that ALREADY EXISTS with a confirmed email
--     (the person signs up first — in the student app or with Google — then you add them here)
--   * you can't remove yourself, and the last remaining admin can never be removed

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. List all admins
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_list_admins()
returns table (
  user_id         uuid,
  email           text,
  display_name    text,
  joined_at       timestamptz,
  last_sign_in_at timestamptz
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
  select u.id,
         u.email::text,
         coalesce(
           nullif(u.raw_user_meta_data->>'display_name', ''),
           nullif(u.raw_user_meta_data->>'full_name', ''),
           nullif(u.raw_user_meta_data->>'name', '')
         ),
         u.created_at,
         u.last_sign_in_at
  from auth.users u
  join public.profiles pr on pr.id = u.id
  where pr.role = 'admin'
    and u.deleted_at is null
  order by u.created_at, u.id;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Make an existing account an admin (by email)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_add_admin(p_email text)
returns uuid
language plpgsql volatile security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_id    uuid;
  v_conf  timestamptz;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if v_email = '' or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;

  select u.id, u.email_confirmed_at into v_id, v_conf
  from auth.users u
  where lower(u.email) = v_email and u.deleted_at is null
  limit 1;

  if v_id is null then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
  if v_conf is null then
    raise exception 'email_not_confirmed' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.profiles where id = v_id and role = 'admin') then
    raise exception 'already_admin' using errcode = 'P0001';
  end if;

  update public.profiles set role = 'admin' where id = v_id;
  if not found then
    insert into public.profiles (id, role) values (v_id, 'admin');
  end if;

  return v_id;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Remove admin rights (account becomes a normal student again)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_remove_admin(p_user uuid)
returns void
language plpgsql volatile security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_user = auth.uid() then
    raise exception 'cannot_remove_self' using errcode = 'P0001';
  end if;

  if (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'last_admin' using errcode = 'P0001';
  end if;

  update public.profiles set role = 'student' where id = p_user and role = 'admin';
  if not found then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
end
$$;

revoke all on function public.admin_list_admins()         from public, anon;
revoke all on function public.admin_add_admin(text)       from public, anon;
revoke all on function public.admin_remove_admin(uuid)    from public, anon;

grant execute on function public.admin_list_admins()      to authenticated;
grant execute on function public.admin_add_admin(text)    to authenticated;
grant execute on function public.admin_remove_admin(uuid) to authenticated;
