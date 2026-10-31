-- Admin flag, premium flag and the second (swats.bio) alias for profiles.
-- Run once in Supabase → SQL Editor. Safe to re-run — every statement is
-- idempotent.
--
--   alias     → the primary vanity alias, shown as tourn.lol/<alias>
--   alias2    → the premium second claim, shown as swats.bio/<alias2>
--   premium   → source of truth for the premium gate (admins can grant it)
--   is_admin  → gates the admin dashboard; DB policies rely on it

alter table public.profiles add column if not exists alias2 text;
alter table public.profiles add column if not exists premium boolean not null default false;
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Helper used by RLS policies. Reads the caller's own row, so an admin label
-- can never be self-granted through the client — only by an admin (or the
-- owner bootstrapping themselves once via this file's UPDATE below).
create or replace function public.is_current_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- Admins can edit any profile row (moderate aliases, grant premium/revoke).
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles
  for update
  using (public.is_current_admin());

-- Regular users keep updating only their own row (re-created defensively,
-- in case 0003 has not been run on this database yet).
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Bootstrap yourself as the first admin. IMPORTANT: run this as a second
-- statement after the ALTERs above, replacing your uuid — it can only be
-- done from the SQL editor; the app cannot grant its own admin.
--   update public.profiles set is_admin = true where username = '<your handle>';
