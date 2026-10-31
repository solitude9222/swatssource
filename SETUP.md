# tourn.lol — full setup guide

Every step, click by click. Follow top to bottom; each step ends with a
"check" so you know it worked before moving on.

**What you need:** a GitHub account, a Supabase account, a Discord account,
and (later, for the backend) a Railway account. Everything here is free-tier
friendly.

---

## 0. Get the code running locally

```bash
git clone https://github.com/solitude9222/tourn.git
cd tourn
npm install
npm run dev        # opens on http://127.0.0.1:5180
```

`npm run dev` works with no configuration — you'll see the site, but sign-in
is disabled until step 3. Typecheck/build whenever you want:

```bash
npm run build      # typecheck + production bundle in dist/
```

---

## 1. Create the Supabase project

1. Go to <https://supabase.com> → **Start your project** → sign in.
2. **New project**:
   - Name: `tourn`
   - Database password: generate one and **save it somewhere** (this is your
     `DATABASE_URL` password later).
   - Region: pick the one closest to your players (e.g. West EU / US East).
3. Wait ~2 minutes for provisioning.

### 1a. Grab your keys

- Left sidebar → **Project Settings** (gear) → **API**.
- Copy **Project URL** → this is `VITE_SUPABASE_URL`.
- Copy **anon public** key (NOT the service_role!) → `VITE_SUPABASE_ANON_KEY`.
- Also copy **service_role** if you plan to run the backend — it bypasses all
  security, so it only ever goes into `.env` plain vars / Railway, never
  `VITE_`, never the repo.

✅ **Check:** you have three strings saved in a notepad.

### 1b. Create the database tables

- Left sidebar → **SQL Editor** → **New query**.
- Paste this whole block and press **Run** (bottom-right):

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

-- view counters (public reads, anonymous increments are rate-limited client-side)
create table if not exists public.profile_views (
  username text primary key,
  views bigint not null default 0
);

alter table public.profile_views enable row level security;

create policy "views are public"
  on public.profile_views for select using (true);

create policy "anyone can increment views"
  on public.profile_views for update using (true) with check (true);

create policy "anyone can create a counter"
  on public.profile_views for insert with check (true);
```

✅ **Check:** SQL Editor → **Table Editor** → you see `profiles` and
`profile_views`, and **Database → Replication** shows no errors. If the views
SQL conflicts with an existing `supabase/migrations/0001_profile_views.sql`
you already ran, skip that part.

### 1c. Turn on the auth providers

- **Authentication → Sign In / Providers → Email**: toggle **ON**, and leave
  **Confirm email** ON (password sign-ins for accounts that add an email).
- **Authentication → URL Configuration**:
  - Site URL: `http://127.0.0.1:5180` for now (change to your domain at launch).
  - **Redirect URLs** → add `http://127.0.0.1:5180` and your future
    production domain.

---

## 2. Create the Discord OAuth app

1. Go to <https://discord.com/developers/applications> → **New Application**.
   - Name: `tourn.lol` → Create.
2. Left sidebar → **OAuth2**:
   - Copy **Client ID** → `VITE_DISCORD_CLIENT_ID` (already filled in your
     `.env` if you keep `1557279875423932467`).
   - Click **Reset Secret**, copy it → `DISCORD_CLIENT_SECRET`.
3. Under **Redirects**, click **Add Redirect** and paste EXACTLY:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   (your project ref is the `abcd1234` part of your Supabase URL). Save
   changes.
4. Back in **Supabase → Authentication → Providers → Discord**:
   - Toggle ON.
   - Paste the Client ID and Client Secret → Save.

✅ **Check:** Discord OAuth2 page shows the supabase callback redirect;
Supabase Discord provider is enabled with both values saved.

---

## 3. Fill in `.env` and restart

Copy `.env.example` to `.env` and fill in the top block:

```bash
cp .env.example .env
```

```bash
# REQUIRED
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...        # the long anon key
VITE_OWNER_EMAIL=you@example.com     # the email of YOUR Discord account

# SERVER-ONLY (fine to fill now; Railway needs them later)
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # the service_role key
DISCORD_CLIENT_SECRET=...            # from step 2
JWT_SECRET=<random 64 chars>
DATABASE_URL=postgresql://postgres:<db-password>@db.<ref>.supabase.co:5432/postgres
ADMIN_PASSWORD=<something long>
```

**One file, two audiences.** `.env` is gitignored. Vite only bundles the
`VITE_`-prefixed vars; the plain ones are ignored by the frontend and exist
for the backend (locally now, on Railway later).

**How production gets its config (no host env vars!):** the backend serves a
tiny public script at `/env.js` that exposes ONLY the whitelisted public
values (Supabase URL, anon key, owner email, client ids). `index.html` loads
it before the app bundle, so a static deploy on Vercel/Netlify needs **zero
environment variables** — everything is configured in Railway. `.env` keeps
working as the local-development fallback.

**Restart the dev server** (Ctrl+C, `npm run dev`) — Vite reads env only at
startup.

✅ **Check:** open <http://127.0.0.1:5180> → click **Sign up** → the dialog
shows "Sign up with Discord" with no "not configured" warning.

---

## 4. First run — create your owner account

1. On the home page click **Claim your link** → **Sign up with Discord**.
2. Discord asks for permission → Authorize. You land back on the site,
   signed in, and a `profiles` row was auto-created.
3. Open **#/dashboard** — the rail should show **Settings** and your handle.
4. **Make yourself owner** (one of):
   - Your Discord email matches `VITE_OWNER_EMAIL` → done automatically.
   - Or run in Supabase SQL editor:
     ```sql
     update public.profiles set is_owner = true where username = '<your-handle>';
     ```
5. **Settings → Security**: add your email + choose a password (leave
   "current password" empty the first time). Now you can sign in either way.
6. **Settings → Claims**: claim your alias → `tourn.lol/<alias>` becomes your
   public link (`#/profile/<handle>`).
7. Optional — grant yourself premium + admin:
   ```sql
   update public.profiles set premium = true, is_admin = true where username = '<your-handle>';
   ```
   Then sign out and back in to refresh the flags.

✅ **Check:** the home hero card shows **your** profile, and `#/demo` renders
your real public page with an "Edit this page" button.

---

## 5. The Discord bot (verification codes for password/2FA)

This is the bot that DMs 6-digit codes so a stolen browser session can't
change your password, email, or 2FA.

### 5a. Create the bot

1. <https://discord.com/developers/applications> → **New Application** →
   name it `tourn.lol verifier`.
2. Left sidebar → **Bot**:
   - Click **Reset Token** → copy it → `DISCORD_BOT_TOKEN`.
   - **Privileged Gateway Intents**: leave all OFF (it only sends DMs, it
     doesn't read servers).
3. Left sidebar → **OAuth2 → URL Generator**:
   - Scopes: ✅ `bot`
   - Bot permissions: ✅ `Send Direct Messages`
   - Copy the generated URL, open it, and add the bot to your personal
     server (you need a server so you can DM with it; a private one is fine).
     → that server's id is `DISCORD_GUILD_ID` (right-click server → Copy
     Server ID; enable Developer Mode in Discord settings first).

### 5b. Store each user's Discord id

When a user signs in through Discord, Supabase metadata contains their
provider id. Add a column and backfill:

```sql
alter table public.profiles add column if not exists discord_id text;

-- backfill from existing users (provider id lives in identities)
update public.profiles p
set discord_id = i.id
from auth.identities i
where i.user_id = p.id and i.provider = 'discord';
```

And keep it fresh on sign-in — the backend (or a small Supabase Edge
Function) upserts `discord_id` from the session's identity on every login.

### 5c. The code flow (backend endpoints to build in swatssource)

```
POST /api/security/request-code
  auth: user's Supabase JWT
  body: { action: "password" | "email" | "mfa" }
  → generates a 6-digit code (crypto.randomInt), stores
    bcrypt(code) + action + user_id + expires_at (10 min) in
    verification_codes table, and the bot DMs:
      "tourn.lol — your code is 123456. It expires in 10 minutes.
       If you didn't request this, ignore it."

POST /api/security/confirm-code
  auth: user's Supabase JWT
  body: { code }
  → compares hash, checks expiry, marks used, returns ok.
  → frontend then calls the Supabase admin API (service role) to apply
    the password/email/MFA change on behalf of the user.
```

Table:

```sql
create table if not exists public.verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  action text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.verification_codes enable row level security;
-- no public policies on purpose: only the service role touches this table.
```

Rules that keep this safe: codes are single-use, expire in 10 minutes,
max 3 requests per user per hour, and the bot DM is the only delivery
channel (never emails codes, never logs them).

### 5d. Until the bot ships

Settings → Security already uses the safe defaults: password changes
re-verify the current password, and 2FA is a standard authenticator-app
TOTP via Supabase MFA. The bot adds a second channel on top.

---

## 6. Deploy the backend to Railway (this is where ALL env lives)

1. <https://railway.com> → **New Project** → **Deploy from GitHub repo** →
   pick `solitude9222/swatssource` (the backend lives in its `backend/`).
2. Service → **Variables** → add **every** var from your `.env` — both the
   public ones (so `/env.js` can serve them) and the secrets:
   - Public: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
     `VITE_OWNER_EMAIL`, `VITE_DISCORD_CLIENT_ID`, `VITE_SPOTIFY_CLIENT_ID`
   - Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `DISCORD_CLIENT_SECRET`,
     `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `JWT_SECRET`, `DATABASE_URL`,
     `ADMIN_PASSWORD`, plus `STRIPE_*` / `TURNSTILE_SECRET_KEY` when you
     wire those up.
3. Add the public-env endpoint to the backend (Express example — this is
   what `index.html` loads; whitelist only, never expose secrets):

   ```js
   app.get("/env.js", (_req, res) => {
     res.set("Content-Type", "application/javascript");
     res.set("Cache-Control", "public, max-age=60");
     res.send(
       `window.__ENV__ = ${JSON.stringify({
         VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? "",
         VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? "",
         VITE_OWNER_EMAIL: process.env.VITE_OWNER_EMAIL ?? "",
         VITE_DISCORD_CLIENT_ID: process.env.VITE_DISCORD_CLIENT_ID ?? "",
         VITE_SPOTIFY_CLIENT_ID: process.env.VITE_SPOTIFY_CLIENT_ID ?? "",
       })};`,
     );
   });
   ```

4. Deploy → copy the public URL (e.g.
   `https://swatssource-production.up.railway.app`). That exact URL is
   already wired into `index.html`'s `<script src="…/env.js">` — if you
   change it, update that one line.
5. In the **frontend** `.env`, keep `VITE_API_BASE_URL` pointing at the same
   URL for local dev.

✅ **Check:** open `https://<backend>/env.js` in a browser → you see
`window.__ENV__ = {…}` with the public values and NO secrets.

---

## 7. Deploy the frontend (zero env vars — Railway provides everything)

### Vercel

1. <https://vercel.com> → **Add New** → **Project** → import
   `solitude9222/tourn`.
2. Framework preset: **Vite** (build `npm run build`, output `dist`).
3. **Do NOT add any environment variables** — the build has no secrets, and
   at runtime `index.html` pulls the public config from Railway's `/env.js`.
4. Deploy.

### Netlify (alternative — `_redirects` already in `public/`)

Import the repo, build command `npm run build`, publish directory `dist`,
**no environment variables**, deploy.

### Final production steps

- Supabase → **Authentication → URL Configuration**: set **Site URL** to your
  production domain and add it to **Redirect URLs**.
- Update `VITE_OWNER_EMAIL` **in Railway** (and locally) if your production
  account email differs — `/env.js` re-serves it within a minute (60s cache).

✅ **Check:** visit your domain → Sign up with Discord → land back signed in;
`/demo` shows your page. If the auth dialog says "not configured", the
`/env.js` script isn't reachable — check step 6's ✅ first.

---

## 8. Where things live (cheat sheet)

| What | Where |
| --- | --- |
| Frontend code | `src/` (React 19 + Vite) |
| Widget live data | `src/lib/widgetLive.ts` (public APIs + `/api/roblox`, `/api/steam-profile` dev proxies) |
| Background effects engine | `src/lib/bgEffects.ts` (12 canvas effects) |
| Audio player (upload-only) | `src/components/AudioPlayer.tsx` |
| Auth | `src/lib/auth.tsx` — Discord sign-up only, email sign-in |
| Settings page | `src/components/SettingsPage.tsx` |
| Premium page | `#/premium` (`src/components/Pages.tsx`) |
| Demo page | `/demo` (`src/components/DemoPage.tsx`) |
| Supabase schema | SQL in step 1b (+ `supabase/migrations/`) |
| Server secrets | Railway env only (never `VITE_`) |

---

## 9. Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Sign-in isn't wired up yet" | `.env` missing/empty Supabase vars, or dev server not restarted after editing `.env`. |
| `Invalid API key` in console | You pasted the `service_role` key into `VITE_SUPABASE_ANON_KEY` — use the **anon public** key. |
| Discord login loops back signed-out | Redirect URL in Discord OAuth2 doesn't exactly match `https://<ref>.supabase.co/auth/v1/callback`, or the site URL isn't in Supabase → URL Configuration. |
| Signed in but dashboard empty / no profile row | The SQL in 1b wasn't run, or the trigger failed — check Table Editor for your row; re-run the `handle_new_user` block. |
| "That email doesn't match…" on password set | Leave **current password empty** the first time (Discord accounts have none yet). |
| Roblox widget says "temporarily unreachable" | You're on a static host — the `/api/roblox` proxy only exists in `npm run dev` / `npm run preview`. Wire a serverless proxy for production. |
| Spotify audio doesn't play | By design — the audio player is upload-only now. Upload an MP3 in Assets → Audio player. |
| View counter stays 0 | The `profile_views` table/policies from 1b are missing. |
