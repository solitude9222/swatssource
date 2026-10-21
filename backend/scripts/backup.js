/**
 * tourn.lol — Database Backup Script
 *
 * Exports every table that matters to a single timestamped JSON file so you
 * can restore to any PostgreSQL provider without needing pg_dump access.
 *
 * Usage (run from the backend/ directory):
 *   node scripts/backup.js
 *   node scripts/backup.js --output ./backups/manual.json
 *
 * Output: backups/backup-<timestamp>.json
 *
 * The Cloudinary files themselves do NOT need backing up — they are stored on
 * Cloudinary's CDN and accessed via the same credentials on any new backend.
 * Only the `files` metadata table (storage_url references) is exported.
 */

import "../../backend/env.js"; // load + sanitise env vars first
import { query, initDb } from "../../backend/db.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── helpers ──────────────────────────────────────────────────────────────────

const log = (msg) => console.log(`[backup] ${msg}`);
const err = (msg, e) => { console.error(`[backup] ERROR: ${msg}`, e?.message ?? ""); process.exit(1); };

function parseArgs() {
  const idx = process.argv.indexOf("--output");
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = path.join(__dirname, "..", "backups");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `backup-${stamp}.json`);
}

// ── table exporters ──────────────────────────────────────────────────────────

async function exportTable(table, orderBy = "created_at") {
  try {
    const { rows } = await query(`SELECT * FROM ${table} ORDER BY ${orderBy} ASC`);
    log(`  ✓ ${table}: ${rows.length} rows`);
    return rows;
  } catch (e) {
    log(`  ⚠ ${table}: could not export (${e.message}) — skipping`);
    return [];
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const outputPath = parseArgs();
  log(`Starting backup → ${outputPath}`);
  log("Connecting to database…");

  // Validate connection without running full initDb
  try {
    await query("SELECT 1");
  } catch (e) {
    err("Database connection failed", e);
  }

  log("Exporting tables…");

  const backup = {
    _meta: {
      version: 2,
      created_at: new Date().toISOString(),
      description: "tourn.lol full database export — restore with scripts/restore.js",
      note: "Cloudinary images are NOT included — they live on Cloudinary already.",
    },
    users: await exportTable("users", "created_at"),
    files: await exportTable("files", "created_at"),
    invite_codes: await exportTable("invite_codes", "created_at"),
    audit_events: await exportTable("audit_events", "created_at"),
    // Add any custom tables here as the schema grows:
    // e.g. notifications: await exportTable("notifications", "created_at"),
  };

  const total = Object.values(backup)
    .filter(Array.isArray)
    .reduce((s, t) => s + t.length, 0);

  fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2), "utf8");
  const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);

  log(`\n✅ Backup complete`);
  log(`   File: ${outputPath}`);
  log(`   Size: ${sizeMB} MB`);
  log(`   Rows: ${total} total`);
  log(`   Users: ${backup.users.length}`);
  log(`   Files: ${backup.files.length}`);
  log(`   Invite codes: ${backup.invite_codes.length}`);
  log(`\n⚠  Keep this file safe — it contains hashed passwords and tokens.`);
  log(`   Copy it off Railway now (rsync, scp, or paste into a secure vault).`);
}

main().catch((e) => err("Unexpected error", e));
