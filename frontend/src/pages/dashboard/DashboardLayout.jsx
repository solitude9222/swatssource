import { useEffect, useState, useRef } from "react";
import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/landing/Navbar";
import { api, fileUrl } from "@/lib/api";
import { FaDiscord } from "react-icons/fa6";
import NotificationBell from "@/components/NotificationBell";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import AuthGateNotice from "@/components/AuthGateNotice";
import {
  LayoutDashboard, Paintbrush, Link2, Award, LayoutGrid, Settings, LayoutTemplate,
  Trophy, BarChart3, Users, Ticket, SlidersHorizontal, LineChart, LogOut,
  ExternalLink, Crown,  ChevronDown, Sparkles, BellRing, Newspaper, ShieldCheck, Plus,
  ScrollText, Loader2, Gift, ShoppingBag, Store, Search,
} from "lucide-react";
import PremiumPlansModal from "@/components/PremiumPlansModal";
import DevlogFeedModal from "@/components/DevlogFeedModal";

const DISCORD_INVITE = "https://discord.gg/a9uwptuepD";

/* ---------------------------------------------------------------------------
   The sidebar is grouped into collapsible categories, and the content header
   shows that category's tabs — so the shell reads "here is the area I am in"
   instead of one flat wall of eleven links. A category can be folded away, but
   the one holding the current page never collapses, so a route is never hidden.
   --------------------------------------------------------------------------- */
const NAV_GROUPS = [
  {
    id: "main",
    label: "Main",
    tabs: [
      { to: "/!/dashboard", end: true, label: "Overview", icon: LayoutDashboard, testid: "tab-overview" },
    ],
  },
  {
    id: "customization",
    label: "Customization",
    icon: Paintbrush,
    expandable: true,
    tabs: [
      { to: "/!/dashboard/badges", label: "Badges", icon: Award, testid: "tab-badges" },
      { to: "/!/dashboard/editor", label: "Card / Layout", icon: Paintbrush, testid: "tab-editor" },
      { to: "/!/dashboard/links", label: "Links", icon: Link2, testid: "tab-links" },
      { to: "/!/dashboard/widgets", label: "Widgets", icon: LayoutGrid, testid: "tab-widgets" },
      { to: "/!/dashboard/effects", label: "Effects / Media", icon: Sparkles, testid: "tab-effects" },
    ],
  },
  {
    id: "other",
    label: "Other",
    tabs: [
      { to: "/!/dashboard/shop", label: "Marketplace", icon: Store, testid: "tab-shop" },
      { to: "/!/dashboard/leaderboard", label: "Leaderboard", icon: Trophy, testid: "tab-leaderboard" },
      { to: "/!/dashboard/templates", label: "Templates", icon: LayoutTemplate, testid: "tab-templates" },
      { to: "/!/dashboard/settings", label: "Settings", icon: Settings, testid: "tab-settings" },
    ],
  },
];

/* Admin section definitions */
const ADMIN_SECTIONS = [
  { to: "/!/dashboard/admin", end: true, label: "Overview", icon: ShieldCheck, testid: "tab-admin-overview" },
  { to: "/!/dashboard/admin/ranked", label: "Ranked", icon: Trophy, testid: "tab-admin-ranked" },
  { to: "/!/dashboard/admin/users", label: "Users", icon: Users, testid: "tab-admin-users" },
  { to: "/!/dashboard/admin/invites", label: "Invites", icon: Ticket, testid: "tab-admin-invites" },
  { to: "/!/dashboard/admin/notify", label: "Notify", icon: BellRing, testid: "tab-admin-notify" },
  { to: "/!/dashboard/admin/devlogs", label: "Devlogs", icon: Newspaper, testid: "tab-admin-devlogs" },
  { to: "/!/dashboard/admin/site", label: "Site", icon: SlidersHorizontal, testid: "tab-admin-site" },
  { to: "/!/dashboard/admin/analytics", label: "Analytics", icon: LineChart, testid: "tab-admin-analytics" },
  { to: "/!/dashboard/admin/audit", label: "Audit", icon: ScrollText, testid: "tab-admin-audit" },
];

const ADMIN_ITEM = {
  to: "/!/dashboard/admin",
  label: "Admin",
  icon: ShieldCheck,
  testid: "tab-admin",
};

const ALL_TABS = [
  ...NAV_GROUPS.flatMap((g) => g.tabs),
  ADMIN_ITEM,
  ...ADMIN_SECTIONS,
];

const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 };

const groupFor = (pathname) => {
  if (pathname.startsWith("/!/dashboard/admin")) {
    return { id: "other", label: "Other" };
  }
  const exact = ALL_TABS.find((t) => t.to === pathname);
  if (exact) return NAV_GROUPS.find((g) => g.tabs.some((tb) => tb.to === exact.to)) || null;
  const partial = ALL_TABS.find((t) => t.to !== "/!/dashboard" && pathname.startsWith(t.to));
  if (partial) return NAV_GROUPS.find((g) => g.tabs.some((tb) => tb.to === partial.to)) || null;
  return null;
};

const tabFor = (pathname) =>
  ALL_TABS.find((t) => t.to === pathname) ||
  ALL_TABS.find((t) => t.to !== "/!/dashboard" && pathname.startsWith(t.to)) ||
  null;

const TabLink = ({ t }) => (
  <NavLink
    to={t.to}
    end={t.end}
    data-testid={t.testid}
    className={({ isActive }) =>
      `group relative flex w-[266px] h-[43px] shrink-0 items-center gap-3 rounded-xl px-3.5 text-[14px] font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-500/60 ${
        isActive ? "text-white shadow-sm" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive ? (
          <motion.span
            layoutId="dash-nav-active"
            transition={spring}
            className="absolute inset-0 rounded-xl border border-brand-400/30 bg-gradient-to-r from-brand-500/20 to-brand-500/5 shadow-[0_0_16px_rgba(164,141,244,0.15)]"
          />
        ) : (
          <span className="absolute inset-0 rounded-xl bg-white/0 transition-colors duration-200 group-hover:bg-white/[0.03]" />
        )}
        <t.icon
          className={`relative z-10 w-[18px] h-[18px] shrink-0 transition-transform duration-200 ${
            isActive ? "scale-105 text-brand-300" : "group-hover:scale-105 text-zinc-400 group-hover:text-zinc-200"
          }`}
        />
        <span className="relative z-10 truncate">{t.label}</span>
        {isActive && (
          <motion.span
            layoutId="dash-nav-marker"
            transition={spring}
            className="relative z-10 ml-auto h-2 w-2 rounded-full bg-brand-400 shadow-[0_0_8px_#a48df4]"
          />
        )}
      </>
    )}
  </NavLink>
);

/* A foldable category. The chevron rotates, the list animates its height and a
   dot marks the folded category that holds the page you are on, so folding the
   sidebar can never lose your route. */
function NavGroup({ group, open, onToggle, containsActive }) {
  const Icon = group.icon;
  return (
    <div className="w-[266px] mb-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        data-testid={`navgroup-${group.id}`}
        className={`group flex w-[266px] h-[36px] items-center gap-2 rounded-xl px-2.5 text-left outline-none transition-all duration-200 hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
          containsActive ? "bg-white/[0.02] text-zinc-200" : "text-zinc-400"
        }`}
      >
        {Icon && (
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-500/10 text-brand-300 transition-colors group-hover:bg-brand-500/20">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 transition-colors duration-200 group-hover:text-zinc-200">
          {group.label}
        </span>
        {containsActive && !open && <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />}
        <ChevronDown
          className={`ml-auto h-3 w-3 shrink-0 text-zinc-500 transition-transform duration-300 ${
            open ? "rotate-0" : "-rotate-90"
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
            <div className={`space-y-[12px] pt-1.5 ${group.expandable ? "pl-2 border-l border-white/[0.07] ml-2.5 my-1" : ""}`}>
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
      className="group block rounded-xl border border-white/[0.06] bg-gradient-to-br from-brand-500/[0.12] to-white/[0.02] p-2.5 transition-colors duration-200 hover:border-brand-400/30"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] border border-white/10 transition-transform duration-300 group-hover:scale-105">
          <FaDiscord className="h-3.5 w-3.5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold text-zinc-100">Join our Discord</div>
        </div>
        <ExternalLink className="h-3 w-3 shrink-0 text-zinc-500 transition-colors duration-200 group-hover:text-brand-300" />
      </div>
      {stats && Number.isFinite(stats.bio_links) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-zinc-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {stats.bio_links.toLocaleString()} bios · {Number(stats.total_views || 0).toLocaleString()} views
        </div>
      )}
    </a>
  );
}

function UserCard({ user, onLogout }) {
  const initial = (user.display_name || user.username || "?")[0]?.toUpperCase();
  const isPremium = user.tier === "premium" || user.tier === "admin" || user.is_owner;
  return (
    <div className="w-[260px] h-[70px] min-h-[70px] mx-auto flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.04] hover:border-brand-500/30 px-3 transition-all duration-200 shadow-md shrink-0">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-800 text-sm ring-2 ring-white/10 shadow-inner">
        {user.profile?.avatar_url ? (
          <img src={fileUrl(user.profile.avatar_url)} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-bold text-zinc-300">{initial}</span>
        )}
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-bold text-white flex items-center gap-1.5">
          <span>{user.display_name || user.username}</span>
          {isPremium && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
        </div>
        <div className="truncate font-mono2 text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
          <span>@{user.username}</span>
          {Number.isFinite(user.uid_number) && (
            <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[9px] text-zinc-400 font-bold">
              #{user.uid_number} <span className="sr-only">UID {user.uid_number}</span>
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
        className="group shrink-0 rounded-xl p-2 text-zinc-400 outline-none transition-colors duration-200 hover:bg-red-500/15 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-500/40 cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

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
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState({});
  // Which in-dashboard popup is open: null, "premium" or "devlog".
  const [popup, setPopup] = useState(null);

  const [navQuery, setNavQuery] = useState("");

  if (!user || user === false) return null;

  const isAdmin = user.role === "admin" || user.is_owner;
  const isOwner = user.is_owner || user.role === "owner";
  const adminTabs = isOwner
    ? ADMIN_SECTIONS
    : ADMIN_SECTIONS.filter((s) => s.to === "/!/dashboard/admin" || s.to.includes("users") || s.to.includes("analytics"));

  const filteredGroups = navQuery.trim()
    ? NAV_GROUPS.map((g) => ({
        ...g,
        tabs: g.tabs.filter((t) => t.label.toLowerCase().includes(navQuery.toLowerCase().trim())),
      })).filter((g) => g.tabs.length > 0)
    : NAV_GROUPS;

  const groups = filteredGroups.map((g) => {
    if (g.id === "other") {
      const tabs = isAdmin ? [...g.tabs, ADMIN_ITEM] : g.tabs;
      return { ...g, tabs };
    }
    return g;
  });

  const activeGroup = groupFor(pathname);
  const activeTab = tabFor(pathname);
  const isInsideAdmin = pathname.startsWith("/!/dashboard/admin");
  const strip = isInsideAdmin ? adminTabs : (activeGroup?.tabs || []);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    /* sw-page-bg, not a flat fill: the page darkens from a lifted grey at the top
       to near-black at the bottom, so the rounded panels have something to sit on. */
    <div className="dash-font flex min-h-screen sw-page-bg text-zinc-100">
      {/* Sidebar - w-[304px] according to measurements */}
      <aside className="sticky top-0 hidden h-screen w-[304px] min-w-[304px] max-w-[304px] shrink-0 flex-col border-r border-white/[0.08] bg-gradient-to-b from-[#11121d]/98 via-[#0c0d15]/98 to-[#06070a]/98 backdrop-blur-3xl px-[19px] pb-[18px] lg:flex shadow-[14px_0_45px_rgba(0,0,0,0.65)] overflow-hidden">
        {/* Logo/header: 304 × 88 px */}
        <div className="w-[304px] -mx-[19px] h-[88px] min-h-[88px] px-6 flex items-center justify-between border-b border-white/[0.06] shrink-0">
          <Logo size="text-lg" />
          <span className="px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-[10px] font-bold text-brand-300 uppercase tracking-widest shadow-sm">
            Studio
          </span>
        </div>

        {/* User account card: 260 × 70 px */}
        <div className="pt-3 shrink-0 flex justify-center">
          <UserCard user={user} onLogout={handleLogout} />
        </div>

        {/* Search bar: 260 × 38 px */}
        <div className="pt-3 pb-1 shrink-0 flex justify-center">
          <div className="relative w-[260px] h-[38px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              data-testid="nav-search-bar"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="Search navigation…"
              className="w-[260px] h-[38px] rounded-xl bg-white/[0.03] border border-white/10 pl-9 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Navigation list with item spacing 10-14px */}
        <nav className="mt-2 flex-1 overflow-y-auto px-0.5 space-y-[12px] scrollbar-none flex flex-col items-center">
          {groups.map((group) => {
            if (group.to) return <TabLink key={group.id} t={{ ...group, end: false }} />;

            const containsActive = activeGroup?.id === group.id;
            const isOpen = !collapsed[group.id];
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

          {/* Bottom section divider: 1 px */}
          <div className="w-[260px] h-px bg-white/[0.08] my-2 shrink-0" />

          <div className="space-y-[12px] w-[260px] flex flex-col items-center">
            {/* Premium upgrade card: 260 × 71 px */}
            <button
              type="button"
              onClick={() => setPopup("premium")}
              data-testid="premium-link"
              className="group relative flex w-[260px] h-[71px] min-h-[71px] items-center gap-3 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/15 via-brand-500/5 to-transparent px-3 text-left transition-all duration-200 hover:border-brand-500/60 hover:shadow-[0_0_20px_rgba(164,141,244,0.18)] cursor-pointer shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-300 shadow-sm shrink-0">
                <Sparkles className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Swats Premium</span>
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">Unlock all widgets & themes</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPopup("devlog")}
              data-testid="devlog-link"
              className="group relative flex w-[260px] h-[38px] items-center gap-3 rounded-xl px-3 text-left text-xs font-semibold text-zinc-400 outline-none transition-all duration-200 hover:bg-white/[0.04] hover:text-white focus-visible:ring-2 focus-visible:ring-brand-500/50 cursor-pointer shrink-0"
            >
              <Newspaper className="h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 group-hover:scale-110 group-hover:text-zinc-300" />
              <span className="truncate">Devlog</span>
              <span className="ml-auto shrink-0 font-mono2 text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">what's new</span>
            </button>

            <Link
              to={`/${user.username}`}
              target="_blank"
              data-testid="view-public-btn"
              className="group relative flex w-[260px] h-[38px] items-center gap-3 rounded-xl px-3 text-xs font-semibold text-zinc-400 outline-none transition-all duration-200 hover:bg-white/[0.04] hover:text-white focus-visible:ring-2 focus-visible:ring-brand-500/50 shrink-0"
            >
              <ExternalLink className="h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 group-hover:scale-110 group-hover:text-zinc-300" />
              <span className="truncate">View public profile</span>
            </Link>
          </div>
        </nav>

        {/* Bottom section divider: 1 px */}
        <div className="w-[260px] h-px bg-white/[0.08] my-2 shrink-0 mx-auto" />

        <div className="w-[260px] mx-auto shrink-0">
          <CommunityCard />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/5 glass-strong">
          <div className="flex items-center justify-between gap-3 px-6 pt-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden">
                <Logo size="text-base" />
              </div>
              <motion.h1
                key={activeGroup?.id || pathname}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="truncate font-display text-2xl font-black tracking-tight text-zinc-50"
              >
                {isInsideAdmin ? "Admin" : (activeGroup?.label || activeTab?.label || "Dashboard")}
              </motion.h1>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {/* The bell stays visible on mobile: a notification nobody sees on a
                  phone may as well not exist. */}
              <NotificationBell />
              {user.tier !== "free" && (
                <span className="hidden items-center gap-1 rounded-full bg-brand-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-brand-300 sm:inline-flex">
                  <Crown className="h-3 w-3" /> {user.tier}
                </span>
              )}
              <AccountMenu user={user} />
            </div>
          </div>

          {/* Section tabs — the pages of the category you are inside. */}
          {strip.length > 0 && (
            <nav className="-mb-px flex gap-2 overflow-x-auto px-6 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {strip.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  // Prefixed so a strip tab is never confused with the sidebar item
                  // that shares its testid (tab-overview exists in both places).
                  data-testid={t.testid ? `strip-${t.testid}` : undefined}
                  className={({ isActive }) =>
                    `relative shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 outline-none ${
                      isActive
                        ? "bg-brand-500/20 text-brand-200 border border-brand-500/40 shadow-[0_0_15px_rgba(164,141,244,0.15)]"
                        : "bg-white/[0.03] text-zinc-400 hover:text-zinc-200 border border-white/5 hover:bg-white/[0.06]"
                    }`
                  }
                >
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
        <AnnouncementBanner className="border-b border-white/5 bg-white/[0.01] px-6 py-3" />

        {/* Mobile tabs: every destination, since the sidebar is hidden. */}
        <div className="flex snap-x gap-2 overflow-x-auto border-b border-white/5 px-5 py-4 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
          {[...NAV_GROUPS.flatMap((g) => g.tabs), ...(isAdmin ? [ADMIN_ITEM] : [])].map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium outline-none transition-colors duration-200 ${
                  isActive
                    ? "bg-brand-500/20 text-brand-100 ring-1 ring-brand-400/30"
                    : "bg-white/[0.04] text-zinc-400 hover:text-zinc-100"
                }`
              }
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </NavLink>
          ))}
        </div>

        <main id="dashboard-main" className="mx-auto w-full flex-1 min-w-0 p-5 sm:p-8">
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
