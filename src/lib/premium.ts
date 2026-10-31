/* ---------------------------------------------------------------------------
   Premium flag — gates a bounded set of cosmetic extras. The exact list
   lives next to each gate (DashboardAssets.tsx and DashboardLinks.tsx), not
   here, but in short: background/overlay effects beyond "None", the
   flashier audio styles + file-upload audio, and the Glass/Glow link card
   styles. Everything else (badges, widgets, text effects, layout, the
   links feature itself) stays free.

   Stored per-account, same local-first pattern as every other dashboard
   store (about/widgets/badges/links) — there's no backend of its own yet.

   There is currently no live checkout (see ShopPage — Stripe's publishable
   key is empty), so nothing in the product can set this to true for a real
   user yet. It exists now so the gating UI and the "Buy premium" CTA both
   have something real to flip once checkout goes live. To test the locked
   state locally: localStorage.setItem("tourn.lol/premium/v1/<your user
   id>", "1") in the browser console, then refresh.
   --------------------------------------------------------------------------- */

function key(userId: string): string {
  return `tourn.lol/premium/v1/${userId}`;
}

export function loadIsPremium(userId: string): boolean {
  try {
    return localStorage.getItem(key(userId)) === "1";
  } catch {
    return false;
  }
}

export function setIsPremium(userId: string, active: boolean): void {
  try {
    if (active) localStorage.setItem(key(userId), "1");
    else localStorage.removeItem(key(userId));
  } catch {
    /* private mode — the choice just won't persist across visits */
  }
}

/** Every locked control sends the visitor here instead of applying the change. */
export function goToPremium(): void {
  window.location.hash = "#/premium";
}
