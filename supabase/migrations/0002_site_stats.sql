-- Site-wide stats for the public landing page: total signed-up creators and
-- total profile views across everyone.
--
-- Run this once in Supabase → SQL Editor (or `supabase db push`). Safe to
-- re-run: every statement is idempotent.
--
-- Both numbers are read through security-definer functions instead of a
-- direct `select count(*) from profiles` from the client. That means they
-- work no matter what RLS policy exists (or doesn't) on `profiles` — the
-- function runs with the privileges of its owner, bypassing RLS for this
-- one read-only aggregate, and it can never leak a row, an id, a username
-- or anything else — only a single count.

create or replace function public.total_users()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::bigint from public.profiles;
$$;

grant execute on function public.total_users() to anon, authenticated;

create or replace function public.total_profile_views()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(views), 0)::bigint from public.profile_views;
$$;

grant execute on function public.total_profile_views() to anon, authenticated;
