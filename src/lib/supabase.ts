import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Real auth turns on the moment both env vars exist; without them the UI shows
 *  a "not configured" state instead of any local account. */
export const supabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
