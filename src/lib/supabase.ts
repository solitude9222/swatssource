import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "./runtimeEnv";

// Values come from Railway's /env.js at runtime (no env vars on the static
// host), falling back to import.meta.env for local .env development.
const url = publicEnv("VITE_SUPABASE_URL");
const anonKey = publicEnv("VITE_SUPABASE_ANON_KEY");

/** Real auth turns on the moment both values exist; without them the UI shows
 *  a "not configured" state instead of any local account. */
export const supabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
