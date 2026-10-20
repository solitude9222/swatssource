import { useEffect, useState, useRef } from "react";
import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/landing/Navbar";
import { api, fileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import { FaDiscord } from "react-icons/fa6";
import NotificationBell from "@/components/NotificationBell";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import AuthGateNotice from "@/components/AuthGateNotice";
import {
  LayoutDashboard, Paintbrush, Link2, Award, LayoutGrid, Settings, LayoutTemplate,
  Trophy, BarChart3, Users, Ticket, SlidersHorizontal, LineChart, LogOut,
  ExternalLink, Crown, ChevronDown, Sparkles, BellRing, Newspaper, ShieldCheck, Plus,
  ScrollText, Loader2, Gift, ShoppingBag, Store, Search, User, Home, ChevronRight, Eye,
  Layers, Star,
} from "lucide-react";
import PremiumPlansModal from "@/components/PremiumPlansModal";
import DevlogFeedModal from "@/components/DevlogFeedModal";

const DISCORD_INVITE = "https://discord.gg/a9uwptuepD";

/* ---------------------------------------------------------------------------
   The sidebar is grouped into collapsible categories; the page header shows a
   breadcrumb (Home › category › page), the page's own icon tile, title and
   one-line description, so the shell reads "here is the area I am in".
   A category can be folded away, but the one holding the current page never
   collapses, so a route is never hidden.
   `ownHeader` marks pages that render their own <PageHeader>, so the shell
   does not print a second title above it.
   --------------------------------------------------------------------------- */
const NAV_GROUPS = [
  {
    id: "main",
    label: "Main",
    navLabel: "Home",
    icon: Home,
    flat: true,
    tabs: [
      {
        to: "/!/dashboard", end: true, label: "Overview", icon: LayoutDashboard, testid: "tab-overview",
        desc: "Your profile at a glance: stats, checklist and connections",
      },
    ],
  },
  {
    id: "customization",
    label: "Customize",
    icon: Paintbrush,
    expandable: true,
    tabs: [
      { to: "/!/dashboard/editor?tab=appearance", label: "Appearance", icon: Paintbrush, testid: "tab-appearance", desc: "Card surface, glow, borders, fonts and link looks" },
      { to: "/!/dashboard/editor", label: "Profile", icon: User, testid: "tab-editor", desc: "Profile details, visibility toggles and card styling" },
      { to: "/!/dashboard/editor?tab=layout", label: "Layout", icon: LayoutTemplate, testid: "tab-layout", desc: "Choose page structure and arrangement" },
      { to: "/!/dashboard/badges", label: "Badges", icon: Award, testid: "tab-badges", desc: "Equip, reorder and manage your profile badges" },
      { to: "/!/dashboard/links", label: "Links", icon: Link2, testid: "tab-links", desc: "Add, order and style the links on your page" },
      { to: "/!/dashboard/widgets", label: "Widgets", icon: LayoutGrid, testid: "tab-widgets", desc: "Live widgets shown on your profile" },
    ],
  },
  {
    id: "other",
    label: "Other",
    icon: Layers,
    expandable: true,
    tabs: [
      { to: "/!/dashboard/shop", label: "Marketplace", icon: Store, testid: "tab-shop", desc: "Browse cosmetics, effects and extras for your profile" },
      { to: "/!/dashboard/leaderboard", label: "Leaderboard", icon: Trophy, testid: "tab-leaderboard", ownHeader: true },
      { to: "/!/dashboard/templates", label: "Templates", icon: LayoutTemplate, testid: "tab-templates", desc: "Start from a ready-made profile template" },
      { to: "/!/dashboard/settings", label: "Settings", icon: Settings, testid: "tab-settings", desc: "Account, security and integrations" },
    ],
  },
];

/* Admin section definitions */
const ADMIN_SECTIONS = [
  { to: "/!/dashboard/admin", end: true, label: "Overview", icon: ShieldCheck, testid: "tab-admin-overview", ownHeader: true },
  { to: "/!/dashboard/admin/ranked", label: "Ranked", icon: Trophy, testid: "tab-admin-ranked", desc: "Manage ranked seasons and standings" },
  { to: "/!/dashboard/admin/users", label: "Users", icon: Users, testid: "tab-admin-users", ownHeader: true },
  { to: "/!/dashboard/admin/invites", label: "Invites", icon: Ticket, testid: "tab-admin-invites", desc: "Create and review invite codes" },
  { to: "/!/dashboard/admin/notify", label: "Notify", icon: BellRing, testid: "tab-admin-notify", ownHeader: true },
  { to: "/!/dashboard/admin/devlogs", label: "Devlogs", icon: Newspaper, testid: "tab-admin-devlogs", ownHeader: true },
  { to: "/!/dashboard/admin/site", label: "Site", icon: SlidersHorizontal, testid: "tab-admin-site", desc: "Site-wide switches and settings" },
  { to: "/!/dashboard/admin/analytics", label: "Analytics", icon: LineChart, testid: "tab-admin-analytics", desc: "Traffic and growth across the platform" },
  { to: "/!/dashboard/admin/audit", label: "Audit", icon: ScrollText, testid: "tab-admin-audit", desc: "A log of admin actions" },
];

const ADMIN_ITEM = {
  to: "/!/dashboard/admin",
  label: "Admin",
  icon: ShieldCheck,
  testid: "tab-admin",
  desc: "Platform administration",
};

const ALL_TABS = [
  ...NAV_GROUPS.flatMap((g) => g.tabs),
  ADMIN_ITEM,
  ...ADMIN_SECTIONS,
];

const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 };

/* Is this tab the page we are on? The three editor tabs share one pathname and
   differ only by ?tab=, so a plain pathname match would light all of them. */
const EDITOR_PATH = "/!/dashboard/editor";
const isTabActive = (t, pathname, search) => {
  const [path, query] = t.to.split("?");
  const exact = t.end || Boolean(query) || path === EDITOR_PATH;
  const pathMatch = exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  if (!pathMatch) return false;
  if (path !== EDITOR_PATH) return true;
  const current = new URLSearchParams(search).get("tab") || "";
  const wanted = new URLSearchParams(query || "").get("tab") || "";
  if (wanted) return current === wanted;
  // "Profile": the About Me sub-tab and the Audios / Extra sub-tabs.
  return current !== "appearance" && current !== "layout";
};

const tabFor = (pathname, search = "") => {
  const hits = ALL_TABS.filter((t) => isTabActive(t, pathname, search));
  hits.sort((a, b) => b.to.length - a.to.length);
  return hits[0] || null;
};

const groupFor = (pathname, search = "") => {
  if (pathname.startsWith("/!/dashboard/admin")) {
    return NAV_GROUPS.find((g) => g.id === "other") || null;
  }
  const tab = tabFor(pathname, search);
  if (!tab) return null;
  return NAV_GROUPS.find((g) => g.tabs.some((tb) => tb.to === tab.to)) || null;
};

/* Shared look of a top-level sidebar row (Home and the category headers). */
const rowBase =
  "group relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#a48df4]/60";

/* A sub-page link inside an open category (or the flat Home link). */
const TabLink = ({ t, sub = true, label }) => {
  const { pathname, search } = useLocation();
  const active = isTabActive(t, pathname, search);
  return (
    <Link
      to={t.to}
      data-testid={t.testid}
      aria-current={active ? "page" : undefined}
      className={
        sub
          ? `group relative flex h-9 w-full items-center gap-2.5 rounded-lg border px-3 text-[13px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#a48df4]/60 ${
              active
                ? "border-[#a48df4]/60 bg-[#25183e] text-white"
                : "border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-white"
            }`
          : `${rowBase} ${active ? "bg-[#2e1b4d] text-[#d8b4fe]" : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"}`
      }
    >
      <t.icon
        className={`${sub ? "h-4 w-4" : "h-[18px] w-[18px]"} shrink-0 transition-colors duration-200 ${
          active ? (sub ? "text-[#c084fc]" : "text-[#d8b4fe]") : "text-zinc-500 group-hover:text-zinc-200"
        }`}
      />
      <span className="truncate">{label || t.label}</span>
    </Link>
  );
};

/* A foldable category. The chevron rotates, the list animates its height and the
   header turns blue while the page you are on lives inside it, so folding the
   sidebar can never lose your route. */
function NavGroup({ group, open, onToggle, containsActive }) {
  const Icon = group.icon;
  const lit = containsActive && open;
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        data-testid={`navgroup-${group.id}`}
        className={`${rowBase} ${lit ? "bg-[#2e1b4d] text-[#d8b4fe]" : containsActive ? "bg-white/[0.03] text-zinc-200" : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"}`}
      >
        {Icon && (
          <Icon className={`h-[18px] w-[18px] shrink-0 ${lit ? "text-[#d8b4fe]" : "text-zinc-500 group-hover:text-zinc-200"}`} />
        )}
        <span className="truncate">{group.label}</span>
        {containsActive && !open && <span className="h-1.5 w-1.5 rounded-full bg-[#c084fc] animate-pulse" />}
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-300 ${lit ? "text-[#d8b4fe]" : "text-zinc-500"} ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pb-1 pl-3 pt-1.5">
              {group.tabs.map((t) => (
                <TabLink key={t.to} t={t} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommunityCard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get("/stats").then(({ data }) => { if (alive) setStats(data); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <a
      href={DISCORD_INVITE}
      target="_blank"
      rel="noreferrer"
      data-testid="discord-card"
      className="group block rounded-2xl border border-[#1f1f1f] bg-[#111111] px-3 py-2.5 transition-colors duration-200 hover:border-[#a48df4]/50"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] transition-transform duration-300 group-hover:scale-105">
          <FaDiscord className="h-4 w-4 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-white">Join Discord</div>
          {stats && Number.isFinite(stats.bio_links) ? (
            <div className="mt-0.5 flex items-center gap-1.5 truncate text-[10px] text-zinc-500">
              <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
              {stats.bio_links.toLocaleString()} bios · {Number(stats.total_views || 0).toLocaleString()} views
            </div>
          ) : (
            <div className="mt-0.5 truncate text-[10px] text-zinc-500">Community, support and news</div>
          )}
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors duration-200 group-hover:text-white" />
      </div>
    </a>
  );
}

function UserCard({ user, onLogout }) {
  const initial = (user.display_name || user.username || "?")[0]?.toUpperCase();
  const isPremium = user.tier === "premium" || user.tier === "admin" || user.is_owner;
  return (
    <div className="flex h-[60px] w-full shrink-0 items-center gap-3 rounded-2xl border border-[#1f1f1f] bg-[#111111] px-3 transition-colors duration-200 hover:border-[#2a2a2e]">
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-800 text-xs ring-1 ring-white/10">
        {user.profile?.avatar_url ? (
          <img src={fileUrl(user.profile.avatar_url)} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-bold text-zinc-300">{initial}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 truncate text-[13px] font-semibold text-white">
          <span className="truncate">{user.display_name || user.username}</span>
          {isPremium && <Crown className="h-3 w-3 shrink-0 text-amber-400" />}
        </div>
        <div className="flex items-center gap-1.5 truncate font-mono2 text-[10px] text-zinc-500">
          <span className="truncate">@{user.username}</span>
          {Number.isFinite(user.uid_number) && (
            <span className="shrink-0 text-zinc-400">
              ID {user.uid_number} <span className="sr-only">UID {user.uid_number}</span>
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        data-testid="logout-btn"
        title="Log out"
        aria-label="Log out"
        className="group flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] text-zinc-400 outline-none transition-colors duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-500/40"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

/* Round-cornered icon button used in the header's top-right cluster. */
const headerBtn =
  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#1f1f1f] bg-[#111111] text-[#c084fc] outline-none transition-colors duration-200 hover:border-[#a48df4]/50 hover:bg-[#1d132e] focus-visible:ring-2 focus-visible:ring-[#a48df4]/60";

/* The top-right account menu: a click on the avatar opens every account this
   session can reach — the current one, the paired accounts to swap between,
   an inline form that pairs a new one (signing into it once verifies it), and
   the sign-out. The paired accounts stay mutual-only, so the menu can never
   show an account the other side has not agreed to. */
function AccountMenu({ user }) {
  const { switchable, loadSwitchable, switchAccount, linkAccount, startPair, unlinkAccount, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addMode, setAddMode] = useState("credentials"); // "credentials" | "discord"
  const [ident, setIdent] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState("");
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Auto-close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !buttonRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("touchstart", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("touchstart", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Re-read the pairing when the menu opens, so a link made in another tab is
  // here too.
  useEffect(() => {
    if (open) loadSwitchable();
  }, [open, loadSwitchable]);

  const doSwitch = async (targetId) => {
    setBusy(true);
    const res = await switchAccount(targetId);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    window.location.reload();
  };

  const doLinkCredentials = async (e) => {
    e?.preventDefault?.();
    if (!ident.trim() || !password) {
      setError("Enter username/email and password");
      return;
    }
    setBusy(true);
    setError("");
    const res = await linkAccount(ident.trim(), password, needsCode ? code.trim() : undefined);
    setBusy(false);
    if (!res.ok) {
      if (res.code === "totp_required") {
        setNeedsCode(true);
        setError("Enter 6-digit two-factor authentication code");
      } else {
        setError(res.error || "Failed to link account");
      }
      return;
    }
    toast.success("Account paired! You can switch between them anytime.");
    setAdding(false);
    setIdent("");
    setPassword("");
    setCode("");
    setNeedsCode(false);
  };

  /* Add another account via Discord: stages a pair intent and redirects to OAuth callback */
  const doPair = async () => {
    setBusy(true);
    setError("");
    const res = await startPair();
    setBusy(false);
    if (!res.ok) setError(res.error || "Could not start the Discord sign-in");
  };

  const initial = (name) => (name || "?")[0]?.toUpperCase();
  const avatar = (acc, sizeClass) => (
    <div className={`${sizeClass} shrink-0 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/10`}>
      {acc.avatar_url ? (
        <img src={fileUrl(acc.avatar_url)} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={`flex h-full w-full items-center justify-center text-zinc-400`}>{initial(acc.display_name)}</span>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        data-testid="account-menu-button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title={`${user.display_name || user.username} — account menu`}
        className="hidden h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm ring-1 ring-white/10 transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-500/60 sm:flex"
      >
        {user.profile?.avatar_url ? (
          <img src={fileUrl(user.profile.avatar_url)} alt="" className="h-full w-full object-cover" />
        ) : (
          initial(user.display_name || user.username)
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            ref={menuRef}
            data-testid="account-menu"
            className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#101014] shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
          >
            <div data-testid="account-switcher" className="max-h-72 overflow-y-auto p-2">
              {switchable.map((acc) => {
                const current = acc.id === user.id;
                return (
                  <div key={acc.id} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2">
                    {avatar(acc, "h-8 w-8")}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-zinc-100">{acc.display_name}</div>
                      <div className="truncate font-mono2 text-[10px] text-zinc-500">@{acc.username}</div>
                    </div>
                    {current ? (
                      <span className="shrink-0 rounded-full bg-brand-500/15 px-2 py-0.5 text-[9px] font-bold uppercase text-brand-300">current</span>
                    ) : (
                      <button
                        type="button"
                        data-testid={`switch-account-${acc.username}`}
                        disabled={busy}
                        onClick={() => doSwitch(acc.id)}
                        className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-zinc-300 transition hover:border-brand-500/40 hover:text-brand-200 disabled:opacity-50"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                );
              })}

              {!adding ? (
                <button
                  type="button"
                  data-testid="add-account"
                  onClick={() => { setAdding(true); setError(""); setAddMode("credentials"); }}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.04]"
                >
                  <Plus className="h-3.5 w-3.5 text-brand-400" /> Add another account
                </button>
              ) : (
                <div data-testid="link-account-form" className="mt-1 space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => { setAddMode("credentials"); setError(""); }}
                      className={`flex-1 py-1 rounded-md transition ${addMode === "credentials" ? "bg-brand-500/25 text-brand-200" : "text-zinc-400 hover:text-zinc-200"}`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddMode("discord"); setError(""); }}
                      className={`flex-1 py-1 rounded-md transition ${addMode === "discord" ? "bg-brand-500/25 text-brand-200" : "text-zinc-400 hover:text-zinc-200"}`}
                    >
                      Discord
                    </button>
                  </div>

                  {error && <p className="text-[10px] text-red-400 font-medium">{error}</p>}

                  {addMode === "credentials" ? (
                    <form onSubmit={doLinkCredentials} className="space-y-2">
                      <input
                        type="text"
                        placeholder="Username or email"
                        value={ident}
                        onChange={(e) => setIdent(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-brand-500/50"
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-brand-500/50"
                      />
                      {needsCode && (
                        <input
                          type="text"
                          placeholder="6-digit 2FA code"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="w-full rounded-lg border border-amber-500/40 bg-black/50 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-400"
                        />
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={busy}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Link account"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAdding(false); setError(""); }}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] leading-relaxed text-zinc-400">
                        Sign in with the <span className="font-semibold text-zinc-200">other Discord account</span>. We link the two accounts so you can switch between them here.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          data-testid="pair-discord"
                          onClick={doPair}
                          disabled={busy}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#5865F2] px-3 py-1.5 text-[11px] font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FaDiscord className="h-3.5 w-3.5" />}
                          Continue with Discord
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAdding(false); setError(""); }}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-1 text-center">
                    <Link
                      to="/!/register"
                      onClick={() => setOpen(false)}
                      className="text-[10px] text-zinc-500 hover:text-brand-300 transition"
                    >
                      Need to create a new profile? Register here →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-2">
              <a
                href={`/${user.username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.04]"
              >
                <ExternalLink className="h-3.5 w-3.5 text-brand-400" /> View public profile
              </a>
              <button
                type="button"
                onClick={async () => { await logout(); window.location.href = "/"; }}
                data-testid="account-menu-logout"
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <LogOut className="h-3.5 w-3.5" /> Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const [collapsed, setCollapsed] = useState({});
  // Which in-dashboard popup is open: null, "premium" or "devlog".
  const [popup, setPopup] = useState(null);

  const [navQuery, setNavQuery] = useState("");

  // The dashboard remaps the brand colour scale to blue (see index.css). It is a
  // body class so dialogs portalled outside this tree are themed too, and it is
  // removed again so the public site keeps its own palette.
  useEffect(() => {
    document.body.classList.add("dash-theme");
    return () => document.body.classList.remove("dash-theme");
  }, []);

  if (!user || user === false) return null;

  const isAdmin = user.role === "admin" || user.is_owner;
  const isOwner = user.is_owner || user.role === "owner";
  const adminTabs = isOwner
    ? ADMIN_SECTIONS
    : ADMIN_SECTIONS.filter((s) => s.to === "/!/dashboard/admin" || s.to.includes("users") || s.to.includes("analytics"));

  const q = navQuery.trim().toLowerCase();
  const filteredGroups = q
    ? NAV_GROUPS.map((g) => ({
        ...g,
        tabs: g.tabs.filter((t) => t.label.toLowerCase().includes(q) || (g.navLabel || "").toLowerCase().includes(q)),
      })).filter((g) => g.tabs.length > 0)
    : NAV_GROUPS;

  const groups = filteredGroups.map((g) => {
    if (g.id === "other") {
      const tabs = isAdmin ? [...g.tabs, ADMIN_ITEM] : g.tabs;
      return { ...g, tabs };
    }
    return g;
  });

  const activeGroup = groupFor(pathname, search);
  const activeTab = tabFor(pathname, search);
  const isInsideAdmin = pathname.startsWith("/!/dashboard/admin");
  const strip = isInsideAdmin ? adminTabs : [];

  // What the header prints: inside Admin the page is "Admin" (its sections are the tab bar).
  const headerTab = isInsideAdmin ? ADMIN_ITEM : activeTab;
  const pageTitle = headerTab?.label || "Dashboard";
  const pageDesc = headerTab?.desc;
  const PageIcon = headerTab?.icon || LayoutDashboard;
  const currentSection = isInsideAdmin ? ADMIN_SECTIONS.find((s) => isTabActive(s, pathname, search)) : null;
  // Pages that draw their own <PageHeader> do not get a second title from the shell.
  const ownHeader = isInsideAdmin ? Boolean(currentSection?.ownHeader) : Boolean(activeTab?.ownHeader);

  const crumbs = isInsideAdmin
    ? [{ label: "Other" }, { label: "Admin" }, ...(currentSection && currentSection.to !== "/!/dashboard/admin" ? [{ label: currentSection.label }] : [])]
    : activeGroup && !activeGroup.flat
      ? [{ label: activeGroup.label }, { label: pageTitle }]
      : [{ label: pageTitle }];

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="dash-font flex min-h-screen bg-[#09090b] text-zinc-100">
      {/* Sidebar: a floating rounded panel, like the reference. */}
      <aside className="sticky top-0 hidden h-screen w-[308px] min-w-[308px] shrink-0 p-3 lg:block">
        <div className="dash-panel flex h-full flex-col overflow-hidden rounded-[28px]">
          {/* Logo */}
          <div className="flex h-[68px] shrink-0 items-center justify-center px-5">
            <Logo size="text-2xl" />
          </div>

          {/* Search */}
          <div className="shrink-0 px-4 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                data-testid="nav-search-bar"
                value={navQuery}
                onChange={(e) => setNavQuery(e.target.value)}
                placeholder="search dashboard…"
                className="h-10 w-full rounded-xl border border-[#2a2a2e] bg-[#0d0d0d] pl-9 pr-3 text-[13px] text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-[#a48df4]"
              />
            </div>
          </div>

          <div className="mx-4 h-px shrink-0 bg-[#1f1f1f]" />

          {/* Navigation list */}
          <nav className="scrollbar-none mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-2">
            {groups.map((group) => {
              if (group.flat) {
                return group.tabs.map((t) => <TabLink key={t.to} t={t} sub={false} label={group.navLabel || t.label} />);
              }
              const containsActive = activeGroup?.id === group.id;
              const isOpen = Boolean(q) || !collapsed[group.id];
              return (
                <NavGroup
                  key={group.id}
                  group={group}
                  open={isOpen}
                  containsActive={containsActive}
                  onToggle={() => setCollapsed((c) => ({ ...c, [group.id]: isOpen }))}
                />
              );
            })}
            {groups.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-zinc-500">Nothing matches “{navQuery}”.</div>
            )}
          </nav>

          {/* Bottom: upgrade card, community, account */}
          <div className="shrink-0 space-y-2 border-t border-[#1f1f1f] p-3">
            <button
              type="button"
              onClick={() => setPopup("premium")}
              data-testid="premium-link"
              className="group flex h-[58px] w-full cursor-pointer items-center gap-3 rounded-2xl border border-[#1f1f1f] bg-[#111111] px-3 text-left outline-none transition-colors duration-200 hover:border-[#a48df4]/50 focus-visible:ring-2 focus-visible:ring-[#a48df4]/60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2e1b4d] text-[#c084fc]">
                <Star className="h-4 w-4 fill-current transition-transform duration-200 group-hover:scale-110" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[13px] font-semibold text-white">
                  Upgrade to Premium
                </span>
                <span className="block truncate text-[10px] text-zinc-500">Unlock exclusive features</span>
              </span>
            </button>

            <CommunityCard />
            <UserCard user={user} onLogout={handleLogout} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#09090b]">
        <header className="px-5 pt-5 sm:px-8">
          {/* Breadcrumb on the left, quick actions on the right */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden">
                <Logo size="text-base" />
              </div>
              <nav
                aria-label="Breadcrumb"
                data-testid="dash-breadcrumb"
                className="hidden min-w-0 items-center gap-2 rounded-xl border border-[#1f1f1f] bg-[#111111] px-3.5 py-2 text-xs sm:flex"
              >
                <Link to="/!/dashboard" aria-label="Dashboard home" className="text-zinc-400 transition-colors hover:text-white">
                  <Home className="h-3.5 w-3.5" />
                </Link>
                {crumbs.map((c, i) => (
                  <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-2">
                    <ChevronRight className="h-3 w-3 shrink-0 text-zinc-600" />
                    <span className={`truncate ${i === crumbs.length - 1 ? "font-semibold text-white" : "text-zinc-400"}`}>
                      {c.label}
                    </span>
                  </span>
                ))}
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPopup("devlog")}
                data-testid="devlog-link"
                title="Devlog"
                aria-label="Devlog"
                className={`${headerBtn} text-zinc-400 hover:text-white`}
              >
                <Newspaper className="h-4 w-4" />
              </button>
              <Link
                to={`/${user.username}`}
                target="_blank"
                data-testid="view-public-btn"
                title="View public profile"
                aria-label="View public profile"
                className={headerBtn}
              >
                <Eye className="h-4 w-4" />
              </Link>
              {/* The bell stays visible on mobile */}
              <NotificationBell />
              {user.tier !== "free" && (
                <span className="hidden items-center gap-1 rounded-full border border-[#a48df4]/40 bg-[#a48df4]/15 px-2.5 py-1 text-[10px] font-bold uppercase text-white sm:inline-flex">
                  <Crown className="h-3 w-3 text-amber-400" /> {user.tier}
                </span>
              )}
              <AccountMenu user={user} />
            </div>
          </div>

          {/* Page title: icon tile, title, one-line description */}
          {!ownHeader && (
            <div className="mt-5 flex items-center gap-4" data-testid="dash-page-header">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#1f1f1f] bg-[#111111]">
                <PageIcon className="h-6 w-6 text-[#c084fc]" />
              </div>
              <div className="min-w-0">
                <motion.h1
                  key={pathname + search}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="truncate text-[28px] font-bold leading-tight tracking-tight text-white"
                >
                  {pageTitle}
                </motion.h1>
                {pageDesc && <p className="mt-0.5 truncate text-[13px] text-zinc-400">{pageDesc}</p>}
              </div>
            </div>
          )}

          {/* Section tabs: a segmented bar for the pages inside Admin. */}
          {strip.length > 0 && (
            <nav
              aria-label="Admin sections"
              className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {strip.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  data-testid={t.testid ? `strip-${t.testid}` : undefined}
                  className={({ isActive }) =>
                    `flex min-w-[96px] flex-1 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition-colors duration-200 ${
                      isActive
                        ? "bg-[#a48df4] text-black shadow-sm"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                    }`
                  }
                >
                  <t.icon className="h-3.5 w-3.5 shrink-0" />
                  {t.label}
                </NavLink>
              ))}
            </nav>
          )}
        </header>

        {/* Admin "Auth check" and live announcements, above the page content so
            they are read before whatever the page itself says. */}
        <AuthGateNotice />
        {/* Renders nothing (no padding, no border) when nothing is live. */}
        <AnnouncementBanner className="mt-4 border-y border-[#1f1f1f] bg-white/[0.01] px-6 py-3" />

        {/* Mobile tabs: every destination, since the sidebar is hidden. */}
        <div className="mt-4 flex snap-x gap-2 overflow-x-auto px-5 py-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
          {[...NAV_GROUPS.flatMap((g) => g.tabs), ...(isAdmin ? [ADMIN_ITEM] : [])].map((t) => {
            const active = isTabActive(t, pathname, search);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium outline-none transition-colors duration-200 ${
                  active
                    ? "border-[#a48df4]/60 bg-[#25183e] text-white"
                    : "border-[#1f1f1f] bg-[#111111] text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </Link>
            );
          })}
        </div>

        <main id="dashboard-main" className="mx-auto w-full min-w-0 flex-1 p-5 pt-5 sm:p-8 sm:pt-6">
          <Outlet />
        </main>
      </div>

      {/* The dashboard's own popups. Mounted once here so the sidebar, the
          notification footer and any page all open the same instance. */}
      <PremiumPlansModal open={popup === "premium"} onClose={() => setPopup(null)} />
      <DevlogFeedModal open={popup === "devlog"} onClose={() => setPopup(null)} />
    </div>
  );
}
