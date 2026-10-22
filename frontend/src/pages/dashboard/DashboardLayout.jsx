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
  Layers, Star, PanelLeftClose, PanelLeftOpen, Globe, UserCheck,
} from "lucide-react";
import PremiumPlansModal from "@/components/PremiumPlansModal";
import DevlogFeedModal from "@/components/DevlogFeedModal";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup,
  CommandItem, CommandShortcut,
} from "@/components/ui/command";

const DISCORD_INVITE = "https://discord.gg/a9uwptuepD";

function LogoIcon() {
  return <Link to="/!/dashboard" aria-label="tourn.lol dashboard" className="flex h-12 w-12 items-center justify-center rounded-xl"><img src="/logo.png?v=10" alt="" className="h-10 w-10 object-contain" /></Link>;
}

function CompactTabLink({ t, label }) {
  const { pathname, search } = useLocation();
  const active = isTabActive(t, pathname, search);
  return (
    <Link
      to={t.to}
      title={label || t.label}
      aria-label={label || t.label}
      aria-current={active ? "page" : undefined}
      data-testid={t.testid}
      className={`mx-auto relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 overflow-hidden ${
        active ? "bg-[#b4bffa]/[0.10] text-[#b4bffa]" : "text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300"
      }`}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[#b4bffa]"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <t.icon className="h-[18px] w-[18px]" />
    </Link>
  );
}

function CompactGroup({ group, onNavigate }) {
  const Icon = group.icon;
  return <div className="space-y-1"><div className="my-2 h-px bg-white/[0.05]" /><button type="button" title={group.label} aria-label={`${group.label} pages`} onClick={() => onNavigate(group.tabs[0]?.to || "/!/dashboard")} className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-white/[0.035] hover:text-zinc-300"><Icon className="h-[18px] w-[18px]" /></button>{group.tabs.map((tab) => <CompactTabLink key={tab.to} t={tab} />)}</div>;
}

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
        to: "/!/dashboard", end: true, label: "Home", icon: LayoutDashboard, testid: "tab-overview",
        desc: "Your profile at a glance — stats, suggestions and quick actions",
      },
    ],
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    expandable: true,
    tabs: [
      { to: "/!/dashboard/badges", label: "Badges", icon: Award, testid: "tab-badges", desc: "Earn, equip and reorder your profile badges", ownHeader: true },
      { to: "/!/dashboard/editor?tab=about", label: "About me", icon: User, testid: "tab-editor", desc: "Display name, bio, avatar, background and accent colour" },
      { to: "/!/dashboard/links", label: "Links", icon: Link2, testid: "tab-links", desc: "Add, order and style the links on your page", ownHeader: true },
      { to: "/!/dashboard/widgets", label: "Widgets", icon: LayoutGrid, testid: "tab-widgets", desc: "Live platform widgets shown on your profile", ownHeader: true },
    ],
  },
  {
    id: "customize",
    label: "Customize",
    icon: Paintbrush,
    expandable: true,
    tabs: [
      { to: "/!/dashboard/editor?tab=appearance", label: "Appearance", icon: Paintbrush, testid: "tab-appearance", desc: "Card surface, decorations, glow, borders and fonts" },
      { to: "/!/dashboard/editor?tab=appearance", label: "Layout", icon: Layout, testid: "tab-layout", desc: "Layout style and positioning settings" },
      { to: "/!/dashboard/editor?tab=other", label: "Other", icon: Sparkles, testid: "tab-other", desc: "View counter, stats, card title and advanced toggles" },
    ],
  },
  {
    id: "shop",
    label: "Shop",
    icon: Store,
    expandable: true,
    tabs: [
      { to: "/!/dashboard/shop", label: "My Products", icon: ShoppingBag, testid: "tab-my-products", desc: "Upload and manage your store products", ownHeader: true },
      { to: "/!/dashboard/editor?tab=store", label: "Store Settings", icon: Store, testid: "tab-store-settings", desc: "Configure your storefront settings" },
      { to: "/!/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag, testid: "tab-marketplace", desc: "Community exchange for handles, accounts, and boosts" },
    ],
  },
  {
    id: "premium",
    label: "Premium",
    navLabel: "Premium",
    icon: Crown,
    flat: true,
    tabs: [
      {
        to: "/!/pricing", label: "Premium", icon: Crown, testid: "tab-premium",
        desc: "Unlock exclusive features and custom badges",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    expandable: true,
    tabs: [
      { to: "/!/dashboard/settings", label: "Account settings", icon: UserCheck, testid: "tab-settings", desc: "Standing, profile info, active sessions & preferences" },
      { to: "/!/dashboard/settings?tab=billing", label: "Billing & security", icon: ShieldCheck, testid: "tab-settings-billing", desc: "Account balance, purchases, security & 2FA" },
    ],
  },
  {
    id: "other",
    label: "Other",
    icon: Layers,
    expandable: true,
    tabs: [
      { to: "/!/dashboard/connections", label: "Connections", icon: Globe, testid: "tab-connections", desc: "Link Discord and other external accounts" },
      { to: "/!/dashboard/stats", label: "Statistics", icon: BarChart3, testid: "tab-stats", desc: "Profile views, link clicks and referrer breakdown" },
    ],
  },
];

/* Admin section definitions */
const ADMIN_SECTIONS = [
  { to: "/!/dashboard/admin", end: true, label: "Overview", icon: ShieldCheck, testid: "tab-admin-overview", ownHeader: true },
  { to: "/!/dashboard/admin/ranked", label: "Ranked", icon: Trophy, testid: "tab-admin-ranked", desc: "Tiers, stages, overrides and recalculation" },
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

/* Is this tab the page we are on? The editor tabs share one pathname and
   differ only by ?tab=, so a plain pathname match would light all of them. */
const EDITOR_PATH = "/!/dashboard/editor";
const SETTINGS_PATH = "/!/dashboard/settings";
const isTabActive = (t, pathname, search) => {
  const [path, query] = t.to.split("?");
  const exact = t.end || Boolean(query) || path === EDITOR_PATH || path === SETTINGS_PATH;
  const pathMatch = exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  if (!pathMatch) return false;
  if (path === SETTINGS_PATH) {
    const current = new URLSearchParams(search).get("tab") || "";
    const wanted = new URLSearchParams(query || "").get("tab") || "";
    if (wanted === "billing") return current === "billing";
    return current !== "billing";
  }
  if (path !== EDITOR_PATH) return true;
  const current = new URLSearchParams(search).get("tab") || "";
  const wanted = new URLSearchParams(query || "").get("tab") || "";
  // Visiting the editor without a ?tab= defaults to the About Me view.
  const effectiveCurrent = current || "about";
  if (wanted) return effectiveCurrent === wanted;
  // Legacy fallback for any editor nav item with no query — active when not on
  // one of the explicit Customize sub-tabs.
  return effectiveCurrent !== "appearance" && effectiveCurrent !== "layout"
      && effectiveCurrent !== "extra" && effectiveCurrent !== "entry";
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
  "group relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/20";

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
          ? `group relative flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/20 overflow-hidden ${
              active
                ? "bg-[#b4bffa]/[0.10] text-white"
                : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
            }`
          : `${rowBase} ${active ? "bg-[#b4bffa]/[0.10] text-zinc-100" : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"}`
      }
    >
      {active && sub && (
        <motion.span
          layoutId="sidebar-active-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[#b4bffa]"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <t.icon
        className={`${sub ? "h-4 w-4" : "h-[18px] w-[18px]"} shrink-0 transition-colors duration-200 ${
          active ? "text-[#b4bffa]" : "text-zinc-600 group-hover:text-zinc-400"
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
        className={`${rowBase} ${lit ? "bg-[#b4bffa]/[0.10] text-zinc-100" : containsActive ? "bg-white/[0.04] text-zinc-200" : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"}`}
      >
        {Icon && (
          <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${lit ? "text-[#b4bffa]" : containsActive ? "text-zinc-400" : "text-zinc-600 group-hover:text-zinc-400"}`} />
        )}
        <span className="truncate">{group.label}</span>
        {containsActive && !open && <span className="h-1.5 w-1.5 rounded-full bg-[#b4bffa] shadow-[0_0_6px_rgba(59,91,240,0.7)]" />}
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-300 ${lit ? "text-[#b4bffa]" : "text-zinc-600"} ${
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
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
      className="group block rounded-xl border border-white/[0.06] bg-[#0a0a0b] px-3 py-2.5 transition-colors duration-200 hover:border-white/15"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.05] bg-[#080809] transition-transform duration-300 group-hover:scale-105">
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
    <div className="flex h-[60px] w-full shrink-0 items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0a0a0b] px-3 transition-colors duration-200 hover:border-white/15">
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
        className="group flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/[0.06] bg-[#080809] text-zinc-500 outline-none transition-colors duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-500/40"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

/* Round-cornered icon button used in the header's top-right cluster. */
const headerBtn =
  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/[0.06] bg-[#0b0b0c] text-zinc-500 outline-none transition-colors duration-200 hover:border-white/15 hover:bg-[#101012] hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-white/20";

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
          <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            ref={menuRef}
            data-testid="account-menu"
            className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-xl border border-white/[0.07] bg-[#09090a] shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
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
                      <span className="shrink-0 rounded-full bg-brand-500/15 px-2 py-0.5 text-[9px] font-bold uppercase text-zinc-300">current</span>
                    ) : (
                      <button
                        type="button"
                        data-testid={`switch-account-${acc.username}`}
                        disabled={busy}
                        onClick={() => doSwitch(acc.id)}
                        className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-zinc-300 transition hover:border-white/15 hover:text-white disabled:opacity-50"
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
                  <Plus className="h-3.5 w-3.5 text-zinc-500" /> Add another account
                </button>
              ) : (
                <div data-testid="link-account-form" className="mt-1 space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => { setAddMode("credentials"); setError(""); }}
                      className={`flex-1 py-1 rounded-md transition ${addMode === "credentials" ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-200"}`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddMode("discord"); setError(""); }}
                      className={`flex-1 py-1 rounded-md transition ${addMode === "discord" ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-200"}`}
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
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#18181a] px-3 py-1.5 text-[11px] font-bold text-zinc-100 transition hover:bg-[#222224] disabled:opacity-50"
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
                      className="text-[10px] text-zinc-600 hover:text-zinc-300 transition"
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
                <ExternalLink className="h-3.5 w-3.5 text-zinc-500" /> View public profile
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
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(() => {
    try { return window.localStorage.getItem("swats_dashboard_sidebar_compact") === "true"; }
    catch { return false; }
  });

  // Scope shared dialog and form-control styling to the dashboard, and remove it
  // again when leaving so the public pages keep their own palette.
  useEffect(() => {
    document.body.classList.add("dash-theme");
    return () => document.body.classList.remove("dash-theme");
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
  const commandTabs = [
    ...NAV_GROUPS.flatMap((group) => group.tabs),
    ...(isAdmin ? [ADMIN_ITEM, ...adminTabs.filter((section) => section.to !== ADMIN_ITEM.to)] : []),
  ];

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
    <div className="dash-font dash-checkered-bg flex min-h-screen text-zinc-100">
      {/* Navigation stays quiet and fixed while the page content owns the scroll. */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-white/[0.06] bg-[#080809] transition-[width] duration-200 lg:block ${sidebarCompact ? "w-[76px]" : "w-[292px]"}`}>
        <div className="flex h-full flex-col overflow-hidden">
          {/* Logo */}
          <div className={`flex h-[80px] shrink-0 items-center ${sidebarCompact ? "justify-center px-2" : "justify-center px-5"}`}>
            {sidebarCompact ? <LogoIcon /> : <Logo size="text-[26px]" />}
          </div>

          {/* Search */}
          <div className={`shrink-0 pb-3 ${sidebarCompact ? "px-3" : "px-4"}`}>
            {sidebarCompact ? (
              <button type="button" title="Search dashboard (Ctrl+K)" aria-label="Search dashboard" onClick={() => setCommandOpen(true)} className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-[#101012] text-zinc-500 hover:text-zinc-200">
                <Search className="h-4 w-4" />
              </button>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  data-testid="nav-search-bar"
                  value={navQuery}
                  onChange={(e) => setNavQuery(e.target.value)}
                  onFocus={() => setCommandOpen(false)}
                  placeholder="Search pages…"
                  className="h-10 w-full rounded-xl border border-white/[0.06] bg-[#0b0b0c] pl-9 pr-14 text-[13px] text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/15"
                />
                <button type="button" aria-label="Open command palette" onClick={() => setCommandOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/[0.07] px-1.5 py-0.5 font-mono2 text-[9px] text-zinc-600 hover:text-zinc-300">{navigator.platform?.includes("Mac") ? "⌘K" : "Ctrl K"}</button>
              </div>
            )}
          </div>

          {!sidebarCompact && <div className="mx-4 h-px shrink-0 bg-white/[0.05]" />}

          {/* Navigation list */}
          <nav className={`scrollbar-none mt-2 flex-1 space-y-1 overflow-y-auto pb-2 ${sidebarCompact ? "px-2" : "px-3"}`}>
            {groups.map((group) => {
              if (group.flat) {
                return group.tabs.map((t) => sidebarCompact ? <CompactTabLink key={t.to} t={t} label={group.navLabel || t.label} /> : <TabLink key={t.to} t={t} sub={false} label={group.navLabel || t.label} />);
              }
              const containsActive = activeGroup?.id === group.id;
              const isOpen = Boolean(q) || !collapsed[group.id];
              return sidebarCompact ? (
                <CompactGroup key={group.id} group={group} onNavigate={navigate} />
              ) : (
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
          <div className={`shrink-0 space-y-2 border-t border-white/[0.06] ${sidebarCompact ? "p-2" : "p-3"}`}>
            <button
              type="button"
              onClick={() => setPopup("premium")}
              data-testid="premium-link"
              title={sidebarCompact ? "Upgrade to Premium" : undefined}
              className={`group flex h-[54px] w-full cursor-pointer items-center rounded-xl border border-white/[0.06] bg-[#0b0b0c] text-left outline-none transition-colors duration-200 hover:border-white/15 focus-visible:ring-2 focus-visible:ring-[#b4bffa]/60 ${sidebarCompact ? "justify-center px-2" : "gap-3 px-3"}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#111113] text-zinc-400">
                <Star className="h-4 w-4 fill-current transition-transform duration-200 group-hover:scale-110" />
              </span>
              {!sidebarCompact && <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[13px] font-semibold text-zinc-200">Upgrade to Premium</span>
                <span className="block truncate text-[10px] text-zinc-600">Unlock exclusive features</span>
              </span>}
            </button>

            {!sidebarCompact && <CommunityCard />}
            {sidebarCompact ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#171719] text-xs ring-1 ring-white/10" title={user.display_name || user.username}>
                  {user.profile?.avatar_url ? <img src={fileUrl(user.profile.avatar_url)} alt="" className="h-full w-full object-cover" /> : (user.display_name || user.username || "?")[0]?.toUpperCase()}
                </div>
                <button type="button" onClick={handleLogout} title="Log out" aria-label="Log out" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0b0b0c] text-zinc-500 hover:text-red-300"><LogOut className="h-4 w-4" /></button>
              </div>
            ) : <UserCard user={user} onLogout={handleLogout} />}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="px-5 pt-5 sm:px-8">
          {/* Breadcrumb on the left, quick actions on the right */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden">
                <Link to="/!/dashboard" aria-label="tourn.lol dashboard" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0a0a0b]"><img src="/logo.png?v=10" alt="" className="h-6 w-6 object-contain" /></Link>
              </div>
              <nav
                aria-label="Breadcrumb"
                data-testid="dash-breadcrumb"
                className="hidden min-w-0 items-center gap-2 rounded-xl border border-white/[0.06] bg-[#0a0a0b] px-3.5 py-2 text-xs sm:flex"
              >
                <Link to="/!/dashboard" aria-label="Dashboard home" className="text-zinc-500 transition-colors hover:text-zinc-200">
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
              <button type="button" data-testid="sidebar-compact-toggle" title={sidebarCompact ? "Expand sidebar" : "Collapse sidebar"} aria-label={sidebarCompact ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={sidebarCompact} onClick={() => setSidebarCompact((current) => { const next = !current; try { window.localStorage.setItem("swats_dashboard_sidebar_compact", String(next)); } catch { /* Keep the control usable when storage is blocked. */ } return next; })} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-[#09090a] text-zinc-600 transition hover:text-zinc-200 lg:flex">
                {sidebarCompact ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
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
              <button type="button" data-testid="command-palette-open" title="Search pages (Ctrl+K)" aria-label="Search pages" onClick={() => setCommandOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0b0b0c] text-zinc-500 transition hover:text-zinc-200 sm:hidden"><Search className="h-4 w-4" /></button>
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
                <span className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase text-zinc-300 sm:inline-flex">
                  <Crown className="h-3 w-3 text-amber-400" /> {user.tier}
                </span>
              )}
              <AccountMenu user={user} />
            </div>
          </div>

          {/* Page title: icon tile, title, one-line description */}
          {!ownHeader && (
            <div className="mt-5 flex items-center gap-4" data-testid="dash-page-header">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0c0c0d]">
                <PageIcon className="h-6 w-6 text-zinc-400" />
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
              className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-[#0a0a0b] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                        ? "bg-[#171719] text-white shadow-sm"
                        : "text-zinc-600 hover:bg-white/[0.035] hover:text-zinc-200"
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
        <AnnouncementBanner className="mt-4 border-y border-white/[0.05] bg-white/[0.01] px-6 py-3" />

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
                    ? "border-[#b4bffa]/30 bg-[#b4bffa]/[0.10] text-white"
                    : "border-white/[0.06] bg-[#0a0a0b] text-zinc-600 hover:text-zinc-200"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </Link>
            );
          })}
        </div>

        <main id="dashboard-main" className="mx-auto w-full min-w-0 flex-1 p-5 pt-5 sm:p-8 sm:pt-6">
          {/* No per-address key here. Keying the wrapper by `${pathname}${search}`
              remounted the whole page on every query-string change — the
              editor's own section tabs live in `?tab=`, so switching tab tore
              the page down, re-ran its effects and replayed its entrance
              animation. React reconciles the <Outlet /> instead, and the
              entrance animation plays once when the dashboard boots. */}
          <div className="dash-route">
            <Outlet />
          </div>
        </main>
      </div>

      {/* The dashboard's own popups. Mounted once here so the sidebar, the
          notification footer and any page all open the same instance. */}
      <PremiumPlansModal open={popup === "premium"} onClose={() => setPopup(null)} />
      <DevlogFeedModal open={popup === "devlog"} onClose={() => setPopup(null)} />
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search dashboard pages…" aria-label="Search dashboard pages" />
        <CommandList>
          <CommandEmpty>No matching pages.</CommandEmpty>
          <CommandGroup heading="Dashboard">
            {commandTabs.map((tab) => (
              <CommandItem key={tab.to} value={`${tab.label} ${tab.desc || ""}`} onSelect={() => { navigate(tab.to); setCommandOpen(false); }}>
                <tab.icon className="h-4 w-4 text-zinc-500" />
                <span>{tab.label}</span>
                {tab.to === activeTab?.to && <CommandShortcut>Current</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
