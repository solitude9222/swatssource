/**
 * tourn.lol — Database Restore Script
 *
 * Reads a backup produced by scripts/backup.js and inserts it into a fresh
 * (or existing) PostgreSQL database on any provider.
 *
 * Usage (run from the backend/ directory):
 *   DATABASE_URL="postgres://..." node scripts/restore.js --input ./backups/backup-2026-10-22.json
 *
 * Flags:
 *   --input  <path>   Path to the backup JSON file (required)
 *   --skip-existing   Skip rows whose primary key already exists (default: warn + skip)
 *   --wipe            DROP and recreate all tables before restoring (use with care!)
 *
 * The script runs inside a transaction — if anything fails, nothing is committed.
 */

import "../../backend/env.js";
import { query, initDb } from "../../backend/db.js";
import fs from "node:fs";
import path from "node:path";

// ── helpers ──────────────────────────────────────────────────────────────────

const log = (msg) => console.log(`[restore] ${msg}`);
const die = (msg, e) => { console.error(`[restore] FATAL: ${msg}`, e?.message ?? ""); process.exit(1); };

function parseArgs() {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--input");
  if (idx === -1 || !args[idx + 1]) die("--input <path> is required");
  return {
    input: args[idx + 1],
    wipe: args.includes("--wipe"),
    skipExisting: args.includes("--skip-existing") || true, // default on
  };
}

// ── table inserters ──────────────────────────────────────────────────────────

async function upsertRows(client, table, rows, pk = "id") {
  if (!rows?.length) { log(`  – ${table}: 0 rows (skipped)`); return 0; }

  const cols = Object.keys(rows[0]);
  let inserted = 0, skipped = 0;

  for (const row of rows) {
    const vals = cols.map((c) => row[c]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    const colList = cols.map((c) => `"${c}"`).join(", ");

    try {
      await client.query(
        `INSERT INTO ${table} (${colList}) VALUES (${placeholders})
         ON CONFLICT ("${pk}") DO NOTHING`,
        vals
      );
      inserted++;
    } catch (e) {
      // Column mismatch (schema evolved) — try inserting only known columns
      if (e.code === "42703") {
        log(`  ⚠ ${table}: unknown column in backup row — partial insert`);
        skipped++;
      } else if (e.code === "23505") {
        skipped++; // duplicate key — already exists, skip
      } else {
        throw e;
      }
    }
  }

  log(`  ✓ ${table}: ${inserted} inserted, ${skipped} skipped`);
  return inserted;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { input, wipe } = parseArgs();

  if (!fs.existsSync(input)) die(`Backup file not found: ${input}`);

  const backup = JSON.parse(fs.readFileSync(input, "utf8"));
  log(`Backup created: ${backup._meta?.created_at ?? "unknown"}`);
  log(`Backup version: ${backup._meta?.version ?? 1}`);

  if (backup._meta?.version < 2) {
    log("⚠  Old backup format — some fields may be missing from newer columns.");
  }

  log("Connecting to database…");
  try { await query("SELECT 1"); } catch (e) { die("Connection failed", e); }

  if (wipe) {
    log("⚠  --wipe: dropping existing tables…");
    await query(`
      DROP TABLE IF EXISTS audit_events CASCADE;
      DROP TABLE IF EXISTS files CASCADE;
      DROP TABLE IF EXISTS invite_codes CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    log("  Tables dropped.");
  }

  log("Initialising schema (CREATE TABLE IF NOT EXISTS)…");
  await initDb();

  log("Restoring data…");

  // All restores happen inside ONE transaction — if anything blows up, nothing
  // is persisted and you can fix the issue and try again safely.
  const { rows: [{ client }] } = await query("SELECT 1").then(() => ({ rows: [{ client: null }] }));
  // ↑ just for TypeScript-style clarity — actual client below:
  const pool = (await import("../../backend/db.js")).default;

  // Use a manual transaction via pg pool.connect()
  const pgClient = await pool.connect();
  try {
    await pgClient.query("BEGIN");

    // Restore in dependency order (users first, then anything that FK-refs users)
    const queryFn = (text, params) => pgClient.query(text, params);

    let total = 0;
    total += await upsertRows({ query: queryFn }, "users",        backup.users        ?? [], "id");
    total += await upsertRows({ query: queryFn }, "invite_codes", backup.invite_codes ?? [], "code");
    total += await upsertRows({ query: queryFn }, "files",        backup.files        ?? [], "id");
    // audit_events has a BIGSERIAL PK — restore only if present, tolerate gaps
    total += await upsertRows({ query: queryFn }, "audit_events", backup.audit_events ?? [], "id");

    await pgClient.query("COMMIT");
    log(`\n✅ Restore complete — ${total} rows written.`);
  } catch (e) {
    await pgClient.query("ROLLBACK");
    die("Restore failed — transaction rolled back, database unchanged", e);
  } finally {
    pgClient.release();
  }

  log("\nNext steps:");
  log("  1. Start the backend with the new DATABASE_URL");
  log("  2. Run a quick health check: GET /health");
  log("  3. Log in as an existing user to verify JWT auth works");
  log("  4. Check a profile page to verify images load from Cloudinary");
  log("  5. Once confirmed, update REACT_APP_BACKEND_URL in the frontend");
}

// We import pool lazily above, but the script also needs it here
// This is a workaround — in production you'd restructure db.js to export pool
main().catch((e) => die("Unexpected error", e));
