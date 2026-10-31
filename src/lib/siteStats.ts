/* ---------------------------------------------------------------------------
   Site-wide stats for the public landing page — total creators signed up
   and total profile views across everyone. Backed by two security-definer
   Postgres functions (see supabase/migrations/0002_site_stats.sql) so they
   read correctly regardless of the RLS policy on `profiles`.
   --------------------------------------------------------------------------- */
import { supabase, supabaseConfigured } from "./supabase";

export type SiteStats = {
  users: number | null;
  views: number | null;
};

/** Both fields are `null` when the number isn't available — Supabase isn't
 *  configured, or the 0002_site_stats.sql migration hasn't been run yet —
 *  so the landing page can hide the stat instead of showing a fake zero. */
export async function getSiteStats(): Promise<SiteStats> {
  if (!supabase || !supabaseConfigured) return { users: null, views: null };

  const [usersRes, viewsRes] = await Promise.all([
    supabase.rpc("total_users"),
    supabase.rpc("total_profile_views"),
  ]);

  return {
    users: usersRes.error ? null : Number(usersRes.data) || 0,
    views: viewsRes.error ? null : Number(viewsRes.data) || 0,
  };
}
