# tourn.lol

A bio-link site for people who play. One handle (`tourn.lol/yourname`), a live
profile card, a widget stack (Discord, Roblox, Spotify, Steam, weather, …), a
links row and a fully customisable public page. Signed-in accounts get a full
dashboard: About me, Assets (effects/cursor/audio), Widgets, Links, Badges,
Card/layout and Settings (claims, security, premium).

Built with React 19 + Vite. Auth runs on Supabase (Discord OAuth + optional
email/password), presence comes from Lanyard, and platform data is read from
each platform's public API through same-origin proxies.

## Run it

```bash
npm install
npm run dev     # http://127.0.0.1:5180
npm run build   # typecheck + production bundle in dist/
```

## Accounts (real, no demo mode)

There are **no demo accounts**. Sign-in is disabled until the Supabase env
vars exist; the auth dialog says exactly that when they're missing.

- **Sign-up is Discord-only.** `Continue with Discord` creates the account via
  Supabase OAuth.
- **Email + password sign-in** works for accounts that added a password.
  After a Discord sign-up, open **Settings → Security** to add an email and
  choose a password (current password stays empty the first time).
- The **owner** is the account whose email matches `VITE_OWNER_EMAIL`. Their
  profile renders on the home page card and at `/demo`, and they get the
  owner-alias control.

### 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API**: copy the Project URL and the `anon` public key.
3. `cp .env.example .env` and paste both values.
4. Restart `npm run dev` (Vite only reads env at startup).

### 2. Profiles table

Run this in the Supabase SQL editor. It creates the public profile row that the
hero card, leaderboard and `/demo` page read, and keeps it in sync with
`auth.users` for Discord OAuth sign-ups.

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  avatar_url text,
  alias text unique,
  alias2 text unique,
  premium boolean not null default false,
  is_admin boolean not null default false,
  is_owner boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are public"
  on public.profiles for select using (true);

create policy "insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "update own profile"
  on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'preferred_username',
      split_part(coalesce(new.email, 'player'), '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

The app also upserts the row after every sign-in and sets `is_owner` when the
account's email matches `VITE_OWNER_EMAIL`. To make the owner claimable by
handle too, run: `update public.profiles set is_owner = true where id = '<uuid>';`

Profile customisation (about, widgets, badges, links, assets) is stored
per-account in the browser's localStorage and merges cleanly once you move it
server-side; view counts use `profile_views`
(`supabase/migrations/0001_profile_views.sql` if present in your copy).

### 3. Discord OAuth (the only sign-up method)

1. [Discord Developer Portal](https://discord.com/developers/applications) →
   New Application → OAuth2.
2. Add this redirect URL exactly:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Copy the **Client ID** into `VITE_DISCORD_CLIENT_ID` (public) and the
   **Client Secret** into Supabase → Authentication → Providers → Discord.
4. Enable the Discord provider in Supabase.
5. Supabase → Authentication → URL Configuration: add `http://127.0.0.1:5180`
   for development and your production origin.

### 4. Email + password (optional, sign-in only)

Enable the Email provider in Supabase with **Confirm email** on. Discord
accounts add an email/password from **Settings → Security** afterwards
(`updateUser({ email })` + `updateUser({ password })`) — they can then sign in
either way. Password changes re-verify the current password when one exists.

## The Discord bot (verification codes)

The plan: a small `tourn.lol` bot that DMs 6-digit codes for security-sensitive
actions — password changes, email changes and 2FA changes — so a stolen browser
session still can't lock you out.

How it fits together:

1. **Bot**: create a Discord application → Bot, copy the bot token into the
   backend env as `DISCORD_BOT_TOKEN` (never into a `VITE_` var).
2. **Link**: store the user's Discord ID on their profile row
   (`discord_id uuid`/`text` column, captured from OAuth metadata).
3. **Challenge**: Settings → Security asks the backend for a code; the backend
   generates a random 6-digit code, stores its hash with a 10-minute expiry,
   and the bot DMs it ("tourn.lol — your code is 123456").
4. **Verify**: the frontend sends the code back; the backend compares hashes
   and only then proxies the privileged call (password/email/MFA change).
5. Invite the bot with the `bot` + `messages.read` scopes only — it needs no
   server permissions, just DMs.

Until the bot ships, Settings → Security shows the standard Supabase flow
(password re-verification + TOTP via authenticator app).

## The cards & widgets

Everything on the bio comes from public APIs, read directly by the browser:

| Widget | Source | Needs |
| --- | --- | --- |
| Discord | `api.lanyard.rest` + a lookup worker | account joined to the Lanyard Discord |
| Server | `discord.com/api/v10/invites/:code?with_counts=true` | a valid invite code |
| Roblox | `users/thumbnails/friends.roblox.com` via `/api/roblox` proxy | a profile URL or ID |
| Spotify | Lanyard's `spotify` object, featured-track fallback, oEmbed | Spotify activity on Discord |
| Steam | `steamcommunity.com/:id/:vanity/?xml=1` via `/api/steam-profile` | a public profile URL |
| Weather / Minecraft / YouTube / GitHub | open-meteo, mcsrvstat, oEmbed, GitHub API | public data only |

The Roblox and Steam endpoints have no CORS headers, so `vite.config.ts`
exposes same-origin proxies (`/api/roblox`, `/api/steam-profile`) with a
browser-like user agent and a retry for dev and `vite preview`. On a static
host those two widgets report that the platform is unreachable rather than
inventing numbers.

## Audio player

Upload-only by design: an MP3/WAV/OGG/M4A file stored per account, custom
cover art, title/artist, accent colour, size, and four styles (Compact,
Marquee — seamless infinite scroll, Vinyl, Lyrics). Lyrics can be pasted or
uploaded as plain text or LRC (timestamps glide the lines to playback), with
an automatic synced lookup as fallback. No streaming embeds, no third-party
player scripts.

## Dashboard

Open `#/dashboard` while signed in. The left rail holds Overview, the Profile
group (About me, Assets, Widgets, Links, Card/layout, Badges), the Extra group
(Templates, Analytics, Leaderboard, Entry screen), then Settings and Premium.
Settings is a full page (claims, security and plan) — platform connections are
added as widgets, not settings.

`/demo` (and `#/demo`) renders the real public link page: the owner's profile
once the owner account is signed in, any signed-in account's own page, or a
clean placeholder when no owner is configured — never fake data.

## Premium

`#/premium` is the full plan page (price, Free-vs-Premium table, FAQ). The
headline perks: background/overlay effects beyond None, the flashier audio
styles + upload audio, Glass/Glow link card styles, and a second claim on
swats.bio. Checkout is disabled during the beta; Premium is granted on the
profile row (`premium boolean`) by an admin.

## Security posture (honest version)

- **Auth**: Supabase GoTrue — sessions are httpOnly JWTs; the anon key is
  public by design and every write is gated by RLS. Enable RLS (the SQL above
  does) or the anon key can write anything.
- **Secrets**: nothing server-side lives in this repo. Discord/Stripe/bot
  tokens belong in the swatssource backend env (Railway), never in `VITE_`
  vars — anything prefixed `VITE_` ships to the browser.
- **Local data**: profile customisation in localStorage is per-browser; treat
  it as a cache until it moves to Supabase.
- **Known gaps until the bot ships**: password changes verify the current
  password client-side via re-auth but there is no second factor on email
  changes; TOTP (2FA) is available today in Settings → Security.

## Structure

```
src/
  App.tsx                 routing, hero identity, dialogs
  config.ts               site example data + per-account settings
  lib/auth.tsx            Supabase auth (Discord sign-up, email sign-in)
  lib/bgEffects.ts        12 animated canvas background effects
  lib/profileAssets.ts    per-account customisation model
  lib/widgets.ts          widget platform catalogue
  lib/widgetLive.ts       live data fetchers per platform
  components/Dashboard.tsx  dashboard shell, rail and overview stats
  components/SettingsPage.tsx  settings page (claims, security, premium)
  components/Pages.tsx    leaderboard, shop, premium
  components/DemoPage.tsx real public link page at /demo
```

## Notes

- No analytics, no tracking, no persistent server of your own. The only
  server-side code is the local Roblox/Steam proxies in Vite dev/preview.
- The shop is a preview — checkout is intentionally disabled until the beta
  ends. Premium grants are admin-issued on the profile row.
