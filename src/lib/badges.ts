/* ---------------------------------------------------------------------------
   Badge system — platform badges, seasonal badges, Discord badges, and
   customisation (glow, monochrome, overlay colour, animation).

   All art is served from /public/badges — local files, not third-party CDN
   URLs — so a badge can never silently fail to load.
   --------------------------------------------------------------------------- */

/* ── types ─────────────────────────────────────────────────── */

export type BadgeGroup = "platform" | "seasonal" | "discord";
export type BadgeAnimationStyle = "none" | "pulse" | "shimmer" | "spin" | "bounce";

export type BadgeDef = {
  id: string;
  name: string;
  description: string;
  group: BadgeGroup;
  /** Local SVG path under /public/badges */
  art: string;
  /** Default tint colour for monochrome mode */
  color: string;
};

export type BadgeStyle = {
  glow: boolean;
  glowColor: string;
  glowIntensity: number; // 0–100
  glowPulse: boolean;
  monochrome: boolean;
  monoColor: string;
  overlay: boolean;
  overlayColor: string;
  overlayStrength: number; // 0–100
  animation: BadgeAnimationStyle;
  size: number; // 14–32px
};

export type BadgeInstance = {
  id: string;
  visible: boolean;
};

export type BadgeStore = {
  /** Which badges the user has equipped (ordered) */
  equipped: BadgeInstance[];
  /** Shared visual style applied to all badges */
  style: BadgeStyle;
};

/* ── defaults ──────────────────────────────────────────────── */

export const DEFAULT_BADGE_STYLE: BadgeStyle = {
  glow: false,
  glowColor: "#b4bffa",
  glowIntensity: 60,
  glowPulse: false,
  monochrome: false,
  monoColor: "#b4bffa",
  overlay: false,
  overlayColor: "#b4bffa",
  overlayStrength: 50,
  animation: "none",
  size: 22,
};

export const EMPTY_BADGE_STORE: BadgeStore = {
  equipped: [],
  style: { ...DEFAULT_BADGE_STYLE },
};

export const BADGE_ANIMATIONS: { id: BadgeAnimationStyle; name: string; hint: string }[] = [
  { id: "none", name: "None", hint: "Static" },
  { id: "pulse", name: "Pulse", hint: "Gentle breathing scale" },
  { id: "shimmer", name: "Shimmer", hint: "Light sweep across" },
  { id: "spin", name: "Spin", hint: "Slow rotation" },
  { id: "bounce", name: "Bounce", hint: "Small hop in place" },
];

/* ── platform badges (tourn.lol's own) ─────────────────────── */

const PLATFORM: BadgeDef[] = [
  { id: "owner", name: "Owner", description: "Platform creator", group: "platform", art: "/badges/icons/owner.gif", color: "#b4bffa" },
  { id: "founder", name: "Founder", description: "Founded the platform", group: "platform", art: "/badges/icons/founder.gif", color: "#b4bffa" },
  { id: "staff", name: "Staff", description: "Core team member", group: "platform", art: "/badges/icons/staffteam.png", color: "#38bdf8" },
  { id: "verified", name: "Verified", description: "Officially verified user", group: "platform", art: "/badges/icons/verifed.png", color: "#b4bffa" },
  { id: "premium", name: "Premium", description: "Supporter with premium perks", group: "platform", art: "/badges/icons/premium.png", color: "#f472b6" },
  { id: "booster", name: "Booster", description: "Server booster", group: "platform", art: "/badges/icons/booster.png", color: "#f472b6" },
  { id: "partner", name: "Partner", description: "Official platform partner", group: "platform", art: "/badges/icons/parnter.png", color: "#60a5fa" },
  { id: "donator", name: "Donator", description: "Donated to keep the site running", group: "platform", art: "/badges/icons/donator.gif", color: "#fbbf24" },
  { id: "coder", name: "Coder", description: "Contributed code", group: "platform", art: "/badges/icons/coder.png", color: "#22c55e" },
  { id: "newbie", name: "Newbie", description: "Joined recently", group: "platform", art: "/badges/icons/newbie.png", color: "#b4bffa" },
  { id: "user", name: "Active User", description: "Long-time active member", group: "platform", art: "/badges/icons/iverauser.gif", color: "#b4bffa" },
];

/* ── seasonal badges ───────────────────────────────────────── */

const SEASONAL: BadgeDef[] = [
  { id: "halloween_2026", name: "Halloween 2026", description: "Celebrated Halloween 2026", group: "seasonal", art: "/badges/icons/hallowen.gif", color: "#f97316" },
  { id: "christmas_2026", name: "Christmas 2026", description: "Celebrated Christmas 2026", group: "seasonal", art: "/badges/icons/christmas.gif", color: "#dc2626" },
];

/* ── Discord badges — local SVG art (reliable, never 404s) ─── */

const DISCORD: BadgeDef[] = [
  { id: "dc_indiscord", name: "Discord Member", description: "Member of the Discord community", group: "discord", art: "/badges/icons/indiscord.png", color: "#5865f2" },
];

/* ── full catalogue ────────────────────────────────────────── */

export const BADGE_CATALOGUE: BadgeDef[] = [...PLATFORM, ...SEASONAL, ...DISCORD];
export const BADGE_MAP = new Map(BADGE_CATALOGUE.map((b) => [b.id, b]));

export function badgeDef(id: string): BadgeDef | undefined {
  return BADGE_MAP.get(id);
}

/* ── persistence ───────────────────────────────────────────── */

function clamp(v: unknown, fallback: number, min: number, max: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
function hex(v: unknown, fallback: string): string {
  return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
}
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function animIn(v: unknown, fallback: BadgeAnimationStyle): BadgeAnimationStyle {
  return BADGE_ANIMATIONS.some((a) => a.id === v) ? (v as BadgeAnimationStyle) : fallback;
}

export function loadBadgeStore(userId: string): BadgeStore {
  try {
    const raw = localStorage.getItem(`tourn.lol/badges/v1/${userId}`);
    if (!raw) return { ...EMPTY_BADGE_STORE, equipped: [], style: { ...DEFAULT_BADGE_STYLE } };
    const parsed = JSON.parse(raw) as Partial<BadgeStore>;
    const style = (parsed.style ?? {}) as Partial<BadgeStyle>;
    const equipped = Array.isArray(parsed.equipped)
      ? parsed.equipped
          .filter((e): e is BadgeInstance => Boolean(e && typeof e === "object" && typeof e.id === "string"))
          .map((e) => ({ id: e.id, visible: e.visible !== false }))
      : [];
    return {
      equipped,
      style: {
        glow: bool(style.glow, DEFAULT_BADGE_STYLE.glow),
        glowColor: hex(style.glowColor, DEFAULT_BADGE_STYLE.glowColor),
        glowIntensity: clamp(style.glowIntensity, DEFAULT_BADGE_STYLE.glowIntensity, 0, 100),
        glowPulse: bool(style.glowPulse, DEFAULT_BADGE_STYLE.glowPulse),
        monochrome: bool(style.monochrome, DEFAULT_BADGE_STYLE.monochrome),
        monoColor: hex(style.monoColor, DEFAULT_BADGE_STYLE.monoColor),
        overlay: bool(style.overlay, DEFAULT_BADGE_STYLE.overlay),
        overlayColor: hex(style.overlayColor, DEFAULT_BADGE_STYLE.overlayColor),
        overlayStrength: clamp(style.overlayStrength, DEFAULT_BADGE_STYLE.overlayStrength, 0, 100),
        animation: animIn(style.animation, DEFAULT_BADGE_STYLE.animation),
        size: clamp(style.size, DEFAULT_BADGE_STYLE.size, 14, 32),
      },
    };
  } catch {
    return { ...EMPTY_BADGE_STORE, equipped: [], style: { ...DEFAULT_BADGE_STYLE } };
  }
}

export function saveBadgeStore(userId: string, store: BadgeStore): void {
  try {
    localStorage.setItem(`tourn.lol/badges/v1/${userId}`, JSON.stringify(store));
  } catch { /* private mode */ }
}
