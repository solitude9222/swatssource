# Migrating tourn.lol to a New Backend Provider

Follow this guide whenever you need to move off Railway (or any current host)
without losing any user data or uploaded images.

---

## What lives where

| Data | Location | Needs migration? |
|------|----------|-----------------|
| User accounts, profiles, links, widgets | PostgreSQL on Railway | **Yes** — export & import |
| Uploaded images (avatars, backgrounds, audio art) | **Cloudinary CDN** | **No** — already cloud-stored |
| Audio files | **Cloudinary CDN** | **No** |
| Invite codes, badges, audit log | PostgreSQL on Railway | **Yes** |
| JWT secrets, API keys | Railway env vars | Copy to new provider |

> **Key insight:** Because all media files are stored on Cloudinary (not on
> Railway's filesystem), you only need to migrate the database. Images will
> continue to load exactly as before from the same Cloudinary URLs.

---

## Step 1 — Export the database while still on Railway

Run the backup script **before** cancelling your Railway plan:

```bash
# From inside backend/ on Railway (via Railway CLI or a one-off command)
railway run node scripts/backup.js

# Or locally, pointing at the Railway database:
DATABASE_URL="$(railway variables get DATABASE_URL)" node scripts/backup.js
```

This creates `backend/backups/backup-YYYY-MM-DD-HH-MM-SS.json`.

**Download the file immediately** — copy it off Railway via:

```bash
# Option A: Railway CLI
railway run cat backups/backup-*.json > my-backup.json

# Option B: If you have the DATABASE_URL, run backup.js locally
DATABASE_URL="postgresql://..." node scripts/backup.js --output ./my-backup.json
```

Keep this file safe — it contains bcrypt-hashed passwords and tokens.

---

## Step 2 — Choose a new PostgreSQL provider

Recommended free/cheap options:

| Provider | Free tier | Notes |
|----------|-----------|-------|
| **Neon** | 0.5 GB, unlimited connections | Serverless, branching |
| **Supabase** | 500 MB, 2 projects | Has Studio UI, easy to browse data |
| **Render** | 256 MB (90-day trial) | Similar to Railway |
| **Railway (new project)** | $5 credit / month | Just start a new project |

Create a new PostgreSQL database and copy the connection string.

---

## Step 3 — Deploy the backend on the new provider

The backend is fully Dockerized (`backend/Dockerfile`) and provider-agnostic.
It runs on anything that can execute Node.js or Docker:

- Railway (new project)
- Render
- Fly.io
- Heroku
- Any VPS (DigitalOcean, Hetzner, Vultr)

Set every environment variable from `.env.example` on the new host.
**Use the exact same Cloudinary credentials** — do not create a new account.

---

## Step 4 — Restore the database

Point `DATABASE_URL` at the new database and run:

```bash
DATABASE_URL="postgresql://..." node scripts/restore.js --input ./my-backup.json
```

The script will:
1. Create all tables (via `initDb()`)
2. Insert every row inside a single transaction
3. Skip any row whose primary key already exists (safe to run multiple times)
4. Roll back everything if any step fails

---

## Step 5 — Verify before cutting over

```bash
# 1. Health check
curl https://your-new-backend.com/health

# 2. Log in as yourself and check your profile looks correct
# 3. Upload a new avatar — verify it appears on your profile
# 4. Check a widget (Discord, etc.) loads live data
```

---

## Step 6 — Cut over the frontend

Update `REACT_APP_BACKEND_URL` (Vercel / wherever the frontend is deployed)
to point at the new backend URL. Redeploy the frontend.

Keep the old Railway instance running for **at least 24 hours** after cutover —
this lets any cached DNS or in-flight sessions drain gracefully.

---

## Step 7 — Cancel Railway

Once you've confirmed everything works on the new host, cancel the Railway
subscription. Your Cloudinary account and its images are completely unaffected.

---

## Rollback plan

Because Cloudinary images are unaffected and passwords are bcrypt-hashed (so
they work identically on any provider), rollback is simply:

1. Point `REACT_APP_BACKEND_URL` back at Railway
2. Done — no data was changed

---

## Automating future backups

Add a cron job to back up daily so you always have a recent snapshot:

```js
// In your server.js (or a separate cron worker):
import cron from 'node-cron';
import { exec } from 'node:child_process';

// Daily at 03:00 UTC
cron.schedule('0 3 * * *', () => {
  exec('node scripts/backup.js', (err, stdout) => {
    if (err) console.error('[cron] Backup failed:', err.message);
    else console.log('[cron] Backup complete:', stdout.trim());
  });
});
```

Or simply add `"backup": "node scripts/backup.js"` to `package.json` and call
it from a Railway/Render cron job.
