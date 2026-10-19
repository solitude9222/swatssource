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
import { toast } from "@/lib/notify";
import {
  LayoutDashboard, Link2, Award, LayoutGrid, Settings, LayoutTemplate, Trophy,
  BarChart3, Users, Ticket, SlidersHorizontal, LineChart, LogOut, ExternalLink,
  Crown, ChevronDown, Sparkles, BellRing, Newspaper, ShieldCheck, Plus, ScrollText,
  Loader2, Gift, Store, Layers3, Film,
} from "lucide-react";
import PremiumPlansModal from "@/components/PremiumPlansModal";
import DevlogFeedModal from "@/components/DevlogFeedModal";

const DISCORD_INVITE = "https://discord.gg/a9uwptuepD";
const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 };

const NAV_GROUPS = [
  { id: "main", label: "Main", tabs: [
    { to: "/!/dashboard", end: true, label: "Overview", icon: LayoutDashboard, testid: "tab-overview" },
  ] },
  { id: "customization", label: "Customization", icon: Layers3, collapsible: true, tabs: [
    { to: "/!/dashboard/badges", label: "Badges", icon: Award, testid: "tab-badges" },
    { to: "/!/dashboard/editor?section=card", label: "Card / Layout", icon: LayoutTemplate, testid: "tab-card-layout", match: "/!/dashboard/editor" },
    { to: "/!/dashboard/links", label: "Links", icon: Link2, testid: "tab-links" },
    { to: "/!/dashboard/widgets", label: "Widgets", icon: LayoutGrid, testid: "tab-widgets" },
    { to: "/!/dashboard/editor?section=effects", label: "Effects / Media", icon: Film, testid: "tab-effects-media", match: "/!/dashboard/editor" },
    { to: "/!/dashboard/editor?section=entry", label: "Entry Screen", icon: LayoutGrid, testid: "tab-entry-screen", match: "/!/dashboard/editor" },
  ] },
  { id: "other", label: "Other", tabs: [
    { to: "/!/dashboard/shop", label: "Marketplace", icon: Store, testid: "tab-shop" },
    { to: "/!/dashboard/leaderboard", label: "Leaderboard", icon: Trophy, testid: "tab-leaderboard" },
    { to: "/!/dashboard/templates", label: "Templates", icon: LayoutTemplate, testid: "tab-templates" },
    { to: "/!/dashboard/settings", label: "Settings", icon: Settings, testid: "tab-settings" },
  ] },
];

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
const ADMIN_LINK = { to: "/!/dashboard/admin", end: false, label: "Admin", icon: ShieldCheck, testid: "tab-admin" };
const EXTRA_TABS = [
  { to: "/!/dashboard/stats", label: "Analytics", icon: BarChart3, testid: "tab-stats" },
  { to: "/!/dashboard/rewards", label: "Rewards", icon: Gift, testid: "tab-rewards" },
];
const ALL_TABS = [...NAV_GROUPS.flatMap((group) => group.tabs), ...EXTRA_TABS, ADMIN_LINK, ...ADMIN_SECTIONS];
const isAdminPath = (path) => path.startsWith("/!/dashboard/admin");
const groupFor = (path) => isAdminPath(path) ? NAV_GROUPS[2] : NAV_GROUPS.find((g) => g.tabs.some((t) => path === (t.match || t.to.split("?")[0]) || (t.match && path.startsWith(t.match)))) || null;
const tabFor = (path, search) => {
  if (path === "/!/dashboard/editor") return search.includes("section=effects") ? NAV_GROUPS[1].tabs[4] : search.includes("section=entry") ? NAV_GROUPS[1].tabs[5] : NAV_GROUPS[1].tabs[1];
  return ALL_TABS.find((t) => path === t.to || (t.to !== "/!/dashboard" && path.startsWith(t.to))) || null;
};

function TabLink({ t }) {
  const location = useLocation();
  const isEditorTab = t.to.startsWith("/!/dashboard/editor?");
  const isCurrent = isEditorTab
    ? location.pathname === "/!/dashboard/editor" && location.search.includes(t.to.split("?")[1])
    : undefined;
  return <NavLink to={t.to} end={t.end} data-testid={t.testid} className={({ isActive }) => {
    const active = isCurrent ?? isActive;
    return `group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/60 ${active ? "text-brand-100" : "text-zinc-400 hover:text-zinc-100"}`;
  }}>
    {({ isActive }) => {
      const active = isCurrent ?? isActive;
      return <>
        <span className={`absolute inset-0 rounded-lg transition-colors ${active ? "border border-brand-400/25 bg-brand-500/15" : "group-hover:bg-white/[0.04]"}`} />
        <t.icon className={`relative z-10 h-3.5 w-3.5 shrink-0 ${active ? "text-brand-300" : ""}`} />
        <span className="relative z-10 truncate">{t.label}</span>
        {active && <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-brand-300" />}
      </>;
    }}
  </NavLink>;
}

function NavGroup({ group, open, onToggle, containsActive }) {
  if (!group.collapsible && group.id === "main") return <div className="mb-1"><div className="mb-1 px-3 pt-2 font-mono2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{group.label}</div><div className="space-y-0.5">{group.tabs.map((t) => <TabLink key={t.testid} t={t} />)}</div></div>;
  return <div className="mb-1">    {group.collapsible ? <>
      <div className="mb-1 px-3 pt-2 font-mono2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{group.label}</div>
      <button type="button" onClick={onToggle} aria-expanded={open} data-testid={`navgroup-${group.id}`} className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/50 ${containsActive ? "bg-brand-500/10 text-brand-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"}`}>
        <group.icon className="h-4 w-4 shrink-0 text-brand-300" /><span className="text-xs font-semibold">{group.label}</span>
        {containsActive && !open && <span className="h-1 w-1 rounded-full bg-brand-400" />}
        <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="ml-3 mt-1 overflow-hidden border-l border-white/10 pl-2"><div className="space-y-0.5">{group.tabs.map((t) => <TabLink key={t.testid} t={t} />)}</div></motion.div>}</AnimatePresence>
    </> : <><div className="mb-1 px-3 pt-2 font-mono2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{group.label}</div><div className="space-y-0.5">{group.tabs.map((t) => <TabLink key={t.testid} t={t} />)}</div></>}
  </div>;
}

function CommunityCard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { let alive = true; api.get("/stats").then(({ data }) => { if (alive) setStats(data); }).catch(() => {}); return () => { alive = false; }; }, []);
  return <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" data-testid="discord-card" className="group block rounded-xl border border-white/[0.06] bg-gradient-to-br from-brand-500/[0.12] to-white/[0.02] p-2.5 transition-colors hover:border-brand-400/30">
    <div className="flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08]"><FaDiscord className="h-3.5 w-3.5 text-white" /></span><div className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-100">Join our Discord</div><ExternalLink className="h-3 w-3 text-zinc-500" /></div>
    {stats && Number.isFinite(stats.bio_links) && <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{stats.bio_links.toLocaleString()} bios · {Number(stats.total_views || 0).toLocaleString()} views</div>}
  </a>;
}

function UserCard({ user, onLogout }) {
  const initial = (user.display_name || user.username || "?")[0]?.toUpperCase();
  return <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2">
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-800 text-xs ring-1 ring-white/10">{user.profile?.avatar_url ? <img src={fileUrl(user.profile.avatar_url)} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center font-bold text-zinc-400">{initial}</span>}</div>
    <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-zinc-100">{user.display_name || user.username}</div><div className="truncate font-mono2 text-[10px] text-zinc-500">@{user.username}{Number.isFinite(user.uid_number) && <span className="text-zinc-600"> · #{user.uid_number} <span className="sr-only">UID {user.uid_number}</span></span>}</div></div>
    <button type="button" onClick={onLogout} data-testid="logout-btn" title="Log out" aria-label="Log out" className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-500/40"><LogOut className="h-3.5 w-3.5" /></button>
  </div>;
}

function AccountMenu({ user }) {
  const { switchable, loadSwitchable, switchAccount, linkAccount, startPair, logout } = useAuth();
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [adding, setAdding] = useState(false); const [addMode, setAddMode] = useState("credentials");
  const [ident, setIdent] = useState(""); const [password, setPassword] = useState(""); const [code, setCode] = useState(""); const [needsCode, setNeedsCode] = useState(false); const [error, setError] = useState("");
  const menuRef = useRef(null); const buttonRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => { if (!menuRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) setOpen(false); };
    const escape = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", outside); document.addEventListener("touchstart", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("touchstart", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  useEffect(() => { if (open) loadSwitchable(); }, [open, loadSwitchable]);
  const doSwitch = async (id) => { setBusy(true); const res = await switchAccount(id); setBusy(false); if (!res.ok) { setError(res.error); return; } setOpen(false); window.location.reload(); };
  const doLink = async (e) => { e.preventDefault(); if (!ident.trim() || !password) { setError("Enter username/email and password"); return; } setBusy(true); setError(""); const res = await linkAccount(ident.trim(), password, needsCode ? code.trim() : undefined); setBusy(false); if (!res.ok) { if (res.code === "totp_required") setNeedsCode(true); setError(res.error || "Enter the required two-factor code"); return; } toast.success("Account paired! You can switch between them anytime."); setAdding(false); setIdent(""); setPassword(""); setCode(""); setNeedsCode(false); };
  const initial = (name) => (name || "?")[0]?.toUpperCase();
  return <div className="relative">
    <button ref={buttonRef} type="button" data-testid="account-menu-button" onClick={() => setOpen((v) => !v)} aria-expanded={open} title={`${user.display_name || user.username} — account menu`} className="hidden h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm ring-1 ring-white/10 sm:flex">{user.profile?.avatar_url ? <img src={fileUrl(user.profile.avatar_url)} alt="" className="h-full w-full object-cover" /> : initial(user.display_name || user.username)}</button>
    {open && <><div className="fixed inset-0 z-40" onClick={() => setOpen(false)} /><div ref={menuRef} data-testid="account-menu" className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#101014] shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
      <div data-testid="account-switcher" className="max-h-72 overflow-y-auto p-2">{switchable.map((acc) => <div key={acc.id} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"><div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/10">{acc.avatar_url ? <img src={fileUrl(acc.avatar_url)} alt="" className="h-full w-full object-cover" /> : initial(acc.display_name)}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-zinc-100">{acc.display_name}</div><div className="truncate font-mono2 text-[10px] text-zinc-500">@{acc.username}</div></div>{acc.id === user.id ? <span className="text-[9px] font-bold uppercase text-brand-300">current</span> : <button type="button" data-testid={`switch-account-${acc.username}`} disabled={busy} onClick={() => doSwitch(acc.id)} className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-zinc-300 disabled:opacity-50">Switch</button>}</div>)}
      {!adding ? <button type="button" data-testid="add-account" onClick={() => { setAdding(true); setError(""); }} className="mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.04]"><Plus className="h-3.5 w-3.5 text-brand-400" /> Add another account</button> : <div data-testid="link-account-form" className="mt-1 space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex rounded-lg border border-white/10 p-0.5 text-[11px] font-semibold"><button type="button" onClick={() => setAddMode("credentials")} className="flex-1 rounded-md py-1">Password</button><button type="button" onClick={() => setAddMode("discord")} className="flex-1 rounded-md py-1">Discord</button></div>{error && <p className="text-[10px] text-red-400">{error}</p>}
        {addMode === "credentials" ? <form onSubmit={doLink} className="space-y-2"><input aria-label="Username or email" value={ident} onChange={(e) => setIdent(e.target.value)} placeholder="Username or email" className="w-full rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs" /><input aria-label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs" />{needsCode && <input aria-label="Two-factor code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit 2FA code" className="w-full rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs" />}<button type="submit" disabled={busy} className="w-full rounded-lg bg-brand-500 px-3 py-2 text-xs font-bold disabled:opacity-50">{busy ? "Linking…" : "Link account"}</button></form> : <button type="button" data-testid="pair-discord" disabled={busy} onClick={async () => { setBusy(true); const res = await startPair(); setBusy(false); if (!res.ok) setError(res.error || "Could not start Discord sign-in"); }} className="w-full rounded-lg bg-[#5865F2] px-3 py-2 text-xs font-bold disabled:opacity-50"><FaDiscord className="mr-2 inline" />Continue with Discord</button>}
        <Link to="/!/register" onClick={() => setOpen(false)} className="block text-center text-[10px] text-zinc-500">Need to create a new profile? Register here →</Link>
      </div>}</div>
      <div className="border-t border-white/10 p-2"><a href={`/${user.username}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-zinc-300"><ExternalLink className="h-3.5 w-3.5 text-brand-400" /> View public profile</a><button type="button" data-testid="account-menu-logout" onClick={async () => { await logout(); window.location.href = "/"; }} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-red-300"><LogOut className="h-3.5 w-3.5" /> Log out</button></div>
    </div></>}
  </div>;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth(); const navigate = useNavigate(); const { pathname, search } = useLocation();
  const [collapsed, setCollapsed] = useState({}); const [popup, setPopup] = useState(null);
  if (!user || user === false) return null;
  const isAdmin = user.role === "admin" || user.is_owner; const isOwner = user.is_owner || user.role === "owner";
  const adminTabs = isOwner ? ADMIN_SECTIONS.filter((section) => section.testid !== "tab-admin-ranked") : ADMIN_SECTIONS.filter((section) => section.testid !== "tab-admin-ranked" && (section.to.includes("users") || section.to.includes("analytics") || section.to === "/!/dashboard/admin"));
  const groups = NAV_GROUPS.map((group) => group.id === "other" ? { ...group, admin: isAdmin, tabs: [...group.tabs, ...EXTRA_TABS, ...(isAdmin ? [ADMIN_LINK] : [])] } : group);
  const activeGroup = groupFor(pathname); const activeTab = tabFor(pathname, search);
  const strip = isAdminPath(pathname) ? adminTabs : (activeGroup?.tabs || []);
  const handleLogout = () => { logout(); navigate("/"); };
  const beginDiscordLink = async () => {
    try {
      const token = localStorage.getItem("swats_token");
      const { data } = await api.get("/auth/discord/login", { params: { mode: "link", token } });
      window.location.href = data.url;
    } catch {
      toast.error("Could not start Discord link");
    }
  };
  const pageTitle = isAdminPath(pathname) ? (pathname === "/!/dashboard/admin" ? "Admin" : "Other") : activeGroup?.label || activeTab?.label || "Dashboard";
  return <div className="dash-font flex min-h-screen sw-page-bg text-zinc-100">
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-gradient-to-b from-white/[0.05] via-white/[0.012] to-black/40 p-3 sm:p-3.5 lg:flex">
      <div className="px-1.5 py-1"><Logo size="text-base" /></div><UserCard user={user} onLogout={handleLogout} />
      <button type="button" onClick={beginDiscordLink} data-testid="connect-discord-btn" className="mt-2 flex items-center gap-2 rounded-xl border border-brand-400/20 bg-brand-500/[0.07] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-brand-500/15"><FaDiscord className="h-4 w-4 text-brand-300" />{user.discord?.linked ? `Connected · ${user.discord.username || "Discord"}` : "Connect Discord"}</button>
      <nav className="mt-2.5 flex-1 space-y-0.5 overflow-y-auto pr-0.5 scrollbar-none">{groups.map((group) => <NavGroup key={group.id} group={group} open={!collapsed[group.id]} containsActive={activeGroup?.id === group.id} onToggle={() => setCollapsed((c) => ({ ...c, [group.id]: !c[group.id] }))} />)}

        <div className="mt-2 border-t border-white/5 pt-2"><button type="button" onClick={() => setPopup("premium")} data-testid="premium-link" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-zinc-400 hover:bg-white/[0.04]"><Sparkles className="h-3.5 w-3.5 text-brand-400" /> Premium <Crown className="ml-auto h-3 w-3 text-brand-300" /></button><button type="button" onClick={() => setPopup("devlog")} data-testid="devlog-link" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-zinc-400 hover:bg-white/[0.04]"><Newspaper className="h-3.5 w-3.5" /> Devlog</button><Link to={`/${user.username}`} target="_blank" data-testid="view-public-btn" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-zinc-400 hover:bg-white/[0.04]"><ExternalLink className="h-3.5 w-3.5" /> View profile</Link></div>
      </nav><div className="mt-2 border-t border-white/5 pt-2"><CommunityCard /></div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-30 border-b border-white/5 glass-strong"><div className="flex items-center justify-between gap-3 px-5 pt-4 sm:px-6 sm:pt-5"><div className="flex min-w-0 items-center gap-3"><div className="lg:hidden"><Logo size="text-base" /></div><motion.h1 key={activeGroup?.id || pathname} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="truncate font-display text-2xl font-black tracking-tight text-zinc-50">{pageTitle}</motion.h1></div><div className="flex shrink-0 items-center gap-3"><NotificationBell />{user.tier !== "free" && <span className="hidden items-center gap-1 rounded-full bg-brand-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-brand-300 sm:inline-flex"><Crown className="h-3 w-3" />{user.tier}</span>}<AccountMenu user={user} /></div></div>
</header>
      <AuthGateNotice /><AnnouncementBanner className="border-b border-white/5 bg-white/[0.01] px-6 py-3" />
      {strip.length > 1 && <nav aria-label="Dashboard pages" className="hidden gap-1.5 overflow-x-auto border-b border-white/5 px-5 pt-3 [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden">{strip.map((t) => <NavLink key={t.testid} to={t.to} end={t.end} data-testid={`strip-${t.testid}`} className={({ isActive }) => `relative shrink-0 px-3.5 pb-3 pt-3 text-sm font-medium transition-colors ${isActive ? "text-brand-200" : "text-zinc-500 hover:text-zinc-200"}`}>{t.label === "Overview" && isAdminPath(pathname) ? "Admin" : t.label}</NavLink>)}</nav>}
      <nav aria-label="Dashboard pages" className="flex snap-x gap-2 overflow-x-auto border-b border-white/5 px-5 py-4 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">{[...groups.flatMap((group) => group.tabs), ...(isAdmin ? adminTabs.slice(1) : [])].map((t) => <NavLink key={t.testid} to={t.to} end={t.end} data-testid={`mobile-${t.testid}`} className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${isActive ? "bg-brand-500/20 text-brand-100 ring-1 ring-brand-400/30" : "bg-white/[0.04] text-zinc-400 hover:text-zinc-100"}`}><t.icon className="h-3.5 w-3.5" />{t.label}</NavLink>)}</nav>
      <main id="dashboard-main" className="mx-auto w-full flex-1 p-5 sm:p-8"><Outlet /></main></div>
    <PremiumPlansModal open={popup === "premium"} onClose={() => setPopup(null)} /><DevlogFeedModal open={popup === "devlog"} onClose={() => setPopup(null)} />
  </div>;
}
