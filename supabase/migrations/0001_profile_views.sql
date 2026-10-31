-- Profile view counters for tourn.lol.
--
-- Run this once in Supabase → SQL Editor (or `supabase db push` if you use
-- the CLI). Safe to re-run: every statement is idempotent.

create table if not exists public.profile_views (
  username   text primary key,
  views      bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.profile_views enable row level security;

-- View counts are public data shown on the profile itself, so anyone can
-- read them.
drop policy if exists "profile_views_select_all" on public.profile_views;
create policy "profile_views_select_all"
  on public.profile_views
  for select
  using (true);

-- No insert/update policy is granted to anon/authenticated on purpose.
-- The only way to change a row is through this function, which runs with
-- the privileges of its owner (security definer) and does its own
-- validation — a visitor can never set an arbitrary count directly.
create or replace function public.increment_profile_view(p_username text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_views bigint;
  v_handle text := lower(trim(p_username));
begin
  if v_handle = '' or length(v_handle) > 32 then
    raise exception 'invalid username';
  end if;

  insert into public.profile_views (username, views, updated_at)
  values (v_handle, 1, now())
  on conflict (username)
  do update set views = public.profile_views.views + 1, updated_at = now()
  returning views into v_views;

  return v_views;
end;
$$;

grant execute on function public.increment_profile_view(text) to anon, authenticated;
