-- Owner alias for profiles. Run once in Supabase → SQL Editor. Idempotent.

alter table public.profiles add column if not exists alias text;
alter table public.profiles add column if not exists is_owner boolean not null default false;

-- Only the owner account (checked in the app against VITE_OWNER_EMAIL) can
-- set an alias; the row-level policy below lets each user update their own
-- profile row only.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
