/* ---------------------------------------------------------------------------
   Real profile view counts via Supabase. Falls back to a per-browser counter
   in localStorage when Supabase isn't configured — it just won't be a shared,
   cross-visitor number until Supabase is wired up
   (see supabase/migrations/0001_profile_views.sql).
   --------------------------------------------------------------------------- */
import { supabase } from "./supabase";

function localKey(username: string): string {
  return `tourn.lol/views/v1/${username.toLowerCase()}`;
}

function seenKey(username: string): string {
  return `tourn.lol/views-seen/v1/${username.toLowerCase()}`;
}

/** Reads the current view count without incrementing it. */
export async function getViewCount(username: string): Promise<number> {
  const handle = username.trim().toLowerCase();
  if (!handle) return 0;

  if (!supabase) {
    return Number(localStorage.getItem(localKey(handle))) || 0;
  }

  const { data, error } = await supabase
    .from("profile_views")
    .select("views")
    .eq("username", handle)
    .maybeSingle();
  if (error || !data) return 0;
  return Number(data.views) || 0;
}

/** Records one view for `username` — at most once per visitor per calendar
 *  day, tracked locally so refreshing the page can't inflate the count —
 *  and returns the updated total. Call this from the public profile route,
 *  not from the owner's own dashboard/preview. */
export async function recordView(username: string): Promise<number> {
  const handle = username.trim().toLowerCase();
  if (!handle) return 0;

  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(seenKey(handle)) === today) {
    return getViewCount(handle);
  }
  localStorage.setItem(seenKey(handle), today);

  if (!supabase) {
    const next = (Number(localStorage.getItem(localKey(handle))) || 0) + 1;
    localStorage.setItem(localKey(handle), String(next));
    return next;
  }

  const { data, error } = await supabase.rpc("increment_profile_view", { p_username: handle });
  if (error || typeof data !== "number") return getViewCount(handle);
  return data;
}
