import { useEffect, useState } from "react";

export type Route =
  | ""
  | "leaderboard"
  | "shop"
  | "premium"
  | "dashboard"
  | "profile"
  | "admin"
  | "demo";

const DEMO_PATH = "/demo";

function isDemoPath(): boolean {
  return window.location.pathname.replace(/\/+$/, "").toLowerCase() === DEMO_PATH;
}

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  if (hash === "demo") return "demo";
  if (hash === "leaderboard" || hash === "shop" || hash === "dashboard" || hash === "premium") {
    return hash;
  }
  if (hash === "admin") return "admin";
  if (hash.startsWith("profile/")) return "profile";
  if (!hash && isDemoPath()) return "demo";
  return "";
}

/** The handle in `#/profile/<handle>`, or null when the hash is not a profile page. */
export function profileHandleFromHash(): string | null {
  const hash = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  if (!hash.startsWith("profile/")) return null;
  const handle = decodeURIComponent(hash.slice("profile/".length)).trim().toLowerCase();
  return handle || null;
}

/** Tiny hash router — the site is four static pages, no router dependency needed. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => readRoute());

  useEffect(() => {
    const apply = () => {
      setRoute(readRoute());
      window.scrollTo({ top: 0, behavior: "auto" });
    };

    const onChange = () => {
      const doc = document as Document & {
        startViewTransition?: (callback: () => void) => unknown;
      };
      if (!doc.startViewTransition) {
        apply();
        return;
      }

      // A view transition can be skipped entirely (for example when the tab is
      // backgrounded), which aborts the callback. Always apply the route, even
      // when the transition never runs.
      let applied = false;
      const run = () => {
        if (applied) return;
        applied = true;
        apply();
      };

      try {
        const transition = doc.startViewTransition(run) as
          | { finished?: Promise<unknown> }
          | undefined;
        void transition?.finished?.catch(run);
      } catch {
        run();
      }
    };

    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

export function hrefFor(route: Route): string {
  return route ? `#/${route}` : "#/";
}

export function profileHref(handle: string): string {
  return `#/profile/${encodeURIComponent(handle)}`;
}
