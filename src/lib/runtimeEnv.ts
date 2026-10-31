/* ---------------------------------------------------------------------------
   Runtime public env.

   The frontend is a static bundle — but env vars must live ONLY in Railway
   (no per-host env config in Vercel/Netlify). The backend solves this by
   serving a tiny public script at `/env.js` that does:

       window.__ENV__ = {
         VITE_SUPABASE_URL: "https://…supabase.co",
         VITE_SUPABASE_ANON_KEY: "eyJ…",
         VITE_OWNER_EMAIL: "you@example.com"
       };

   index.html loads that script (classic, blocking) before the app bundle, so
   by the time this module runs the values are on window. `import.meta.env`
   stays as the fallback so local `.env` development works exactly as before.
   The backend WHITELISTS which vars it exposes — secrets never appear here.
   --------------------------------------------------------------------------- */

export type PublicEnvKey =
  | "VITE_SUPABASE_URL"
  | "VITE_SUPABASE_ANON_KEY"
  | "VITE_OWNER_EMAIL"
  | "VITE_DISCORD_CLIENT_ID"
  | "VITE_SPOTIFY_CLIENT_ID"
  | "VITE_TURNSTILE_SITE_KEY"
  | "VITE_STRIPE_PUBLISHABLE_KEY"
  | "VITE_API_BASE_URL";

type PublicEnv = Partial<Record<PublicEnvKey, string>>;

declare global {
  interface Window {
    __ENV__?: PublicEnv;
  }
}

export function publicEnv(key: PublicEnvKey): string {
  const runtime = window.__ENV__?.[key];
  if (runtime && runtime.trim()) return runtime.trim();
  const buildTime = (import.meta.env as Record<string, unknown>)[key];
  return typeof buildTime === "string" ? buildTime.trim() : "";
}
