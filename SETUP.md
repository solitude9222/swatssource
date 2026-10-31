# tourn.lol — setup

**The short version first (4 steps, ~20 minutes). Deep details below.**

Supabase **is** your Postgres — there is no separate database to install.

---

## ⚡ Short version

### 1) Supabase — your database + login service (~5 min)

1. <https://supabase.com> → Start your project → **New project**
   (name `tourn`, **save the database password** it generates).
2. **Settings → API** — copy three things:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
3. **SQL Editor → New query** → paste the SQL from [step 1b](#1b-create-the-database-tables) → **Run**.
4. **Authentication → Providers → Email** → ON (leave "Confirm email" ON).
5. **Authentication → URL Configuration** → Site URL `http://127.0.0.1:5180`,
   and add it to **Redirect URLs** too.

### 2) Discord — the sign-up button + the code bot (~5 min)

1. <https://discord.com/developers/applications> → **New Application** → `tourn.lol`.
2. **OAuth2**: Client ID is already in `.env` (`1557279875423932467`).
3. **OAuth2 → Reset Secret** → copy → `DISCORD_CLIENT_SECRET`.
4. **OAuth2 → Redirects** → add exactly:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
5. **Bot → Reset Token** → copy → `DISCORD_BOT_TOKEN` (this is the
   verification-codes bot — invite it with only *Send Direct Messages*).
6. **Supabase → Authentication → Providers → Discord** → paste Client ID +
   secret → enable.

### 3) Railway — where ALL env vars live (~10 min)

1. <https://railway.com> → New Project → Deploy from GitHub repo →
   your backend repo → this gives you
   `https://tourn-production.up.railway.app`.
2. **Variables** → paste **everything** from the complete `.env` list
   ([below](#-the-complete-env)) — public values AND secrets.
3. Add the `/env.js` endpoint to the backend (copy-paste, [step 6](#6-add-the-envjs-endpoint-to-the-backend)) → deploy.
4. ✅ **Check:** open `https://tourn-production.up.railway.app/env.js` in a
   browser → you see `window.__ENV__ = {…}` with public values and **no
   secrets**.

### 4) Vercel — frontend with ZERO config (~2 min)

1. <https://vercel.com> → Add New → Project → import `solitude9222/tourn`.
2. Preset **Vite** → Deploy → **do not add any environment variables**.
3. Done. `index.html` pulls the config from Railway's `/env.js` at runtime.
   (Keep `FRONTEND_URL`/redirects in Supabase pointing at your real domain.)

### 5) Make yourself the owner

1. Home → **Claim your link** → Discord → authorize.
2. Your Discord email = `VITE_OWNER_EMAIL` → you're the owner automatically
   (or run: `update public.profiles set is_owner = true where username = '<handle>';`).
3. **Settings → Security** → add email + choose a password.
4. **Settings → Claims** → claim your alias → `tourn.lol/<alias>` is live.

---

# Deep details

## Run it locally

```bash
git clone https://github.com/solitude9222/tourn.git
cd tourn
npm install
npm run dev     # http://127.0.0.1:5180
```

Copy `.env.example` → `.env`, fill it in, **restart the dev server** (Vite
reads env only at startup). Locally the frontend reads `.env` directly; in
production it reads Railway's `/env.js` — same values, one source of truth.

---

## <a id="-the-complete-env"></a>📋 The complete `.env`

One file, everything. `VITE_` = public, plain = secrets. Supabase **is**
your Postgres.

```bash
# ───────── URLs ─────────
FRONTEND_URL=https://tourn.lol
BACKEND_URL=https://tourn-production.up.railway.app
VITE_API_BASE_URL=https://tourn-production.up.railway.app

# ───────── Supabase (auth + built-in Postgres) ─────────
VITE_SUPABASE_URL=              # Settings → API → Project URL
VITE_SUPABASE_ANON_KEY=         # Settings → API → anon public
SUPABASE_SERVICE_ROLE_KEY=      # Settings → API → service_role (backend only!)
DATABASE_URL=                   # Settings → Database → Connection string → URI

# ───────── Owner / admin ─────────
VITE_OWNER_EMAIL=               # your email → owner profile + /demo
ADMIN_EMAIL=
ADMIN_PASSWORD=

# ───────── Discord ─────────
VITE_DISCORD_CLIENT_ID=1557279875423932467
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=              # the verification-codes bot
DISCORD_GUILD_ID=
DISCORD_REDIRECT_URI=           # https://<ref>.supabase.co/auth/v1/callback

# ───────── Spotify ─────────
VITE_SPOTIFY_CLIENT_ID=b5e787041316466893ef7eabfb717e3a
SPOTIFY_CLIENT_SECRET=

# ───────── Security / sessions ─────────
JWT_SECRET=                     # random 64+ chars (openssl rand -hex 32)
VIEW_SECRET=

# ───────── Payments (Premium checkout, later) ─────────
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ───────── Bot protection ─────────
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAFThWr36t2uJbW1e
TURNSTILE_SECRET_KEY=
```

---

## 1b. Create the database tables

Supabase → **SQL Editor → New query** → paste → **Run**:

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
  discord_id text,
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

-- remember each user's Discord id (the bot DMs them here)
update public.profiles p
set discord_id = i.id
from auth.identities i
where i.user_id = p.id and i.provider = 'discord';

-- view counters
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

-- verification codes for the Discord bot (service role only — no public policies)
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
```

✅ **Check:** Table Editor shows `profiles`, `profile_views`,
`verification_codes`.

---

## 6. Add the `/env.js` endpoint to the backend

This is what the frontend loads — it serves **only** the whitelisted public
values from Railway's env. Express example:

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
      VITE_TURNSTILE_SITE_KEY: process.env.VITE_TURNSTILE_SITE_KEY ?? "",
      VITE_STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
    })};`,
  );
});
```

Never put a secret in this list — anything here is readable by every visitor.

The frontend already points at it:
`index.html` → `<script src="https://tourn-production.up.railway.app/env.js">`.
If your Railway URL ever changes, update that one line.

---

## 7. The Discord bot flow (verification codes)

The bot DMs a 6-digit code before any password / email / 2FA change, so a
stolen browser session can't lock you out.

Backend endpoints to build in Railway:

```
POST /api/security/request-code   { action: "password" | "email" | "mfa" }
  → random 6-digit code → store hash in verification_codes (10 min expiry)
  → bot DMs: "tourn.lol — your code is 123456. Expires in 10 minutes."

POST /api/security/confirm-code   { code }
  → compare hash, check expiry + single-use → ok
  → then apply the change via the service-role key
```

Rules: single-use codes, 10-minute expiry, max 3 requests per user per hour,
DM-only delivery. Until the bot ships, Settings → Security already uses safe
defaults (current-password re-verification + TOTP authenticator 2FA).

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Sign-in isn't wired up yet" | `/env.js` unreachable or Supabase vars missing in Railway. Check `https://tourn-production.up.railway.app/env.js` first. Locally: fill `.env` + restart. |
| `Invalid API key` | You pasted `service_role` into `VITE_SUPABASE_ANON_KEY` — use the **anon public** key. |
| Discord login loops back signed-out | Redirect URL in Discord OAuth2 ≠ `https://<ref>.supabase.co/auth/v1/callback`, or your domain is missing in Supabase → URL Configuration. |
| Signed in but no dashboard/profile row | The SQL in 1b wasn't run (check Table Editor for your row). |
| Password set fails with "current password incorrect" | Leave current password **empty** the first time (Discord accounts have none yet). |
| Roblox widget "temporarily unreachable" | Static hosts have no `/api/roblox` proxy — it exists in `npm run dev` / `npm run preview`. |
| View counter stays 0 | `profile_views` table/policies missing (run 1b). |
