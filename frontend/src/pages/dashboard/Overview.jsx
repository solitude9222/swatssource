import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, setToken, fileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import { FaDiscord } from "react-icons/fa6";
import {
  Award, Check, ChevronRight, Copy, Crown, Eye, Loader2,
  Pencil, Sparkles, Link2, ArrowUpRight, Clock, User,
  Zap, RefreshCw, Ticket, BarChart3, Calendar, Globe,
  ShoppingBag, Store, Layers,
} from "lucide-react";

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const maskEmail = (email) => {
  if (!email) return "â€”";
  const [local, domain] = String(email).split("@");
  if (!domain) return email;
  const masked = local[0] + "â€¢â€¢â€¢" + (local.length > 4 ? local.slice(-1) : "");
  return `${masked}@${domain}`;
};

const daysSince = (dateStr) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
};

const fmt = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000)    return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
};

const joinedLabel = (dateStr) => {
  if (!dateStr) return "â€”";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "â€”";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

function copy(text, label) {
  const cb = navigator.clipboard;
  if (cb) { cb.writeText(text).then(() => toast.success(`${label} copied`)).catch(() => {}); return; }
  try {
    const el = document.createElement("input");
    el.value = text; document.body.appendChild(el); el.select();
    document.execCommand("copy"); document.body.removeChild(el);
    toast.success(`${label} copied`);
  } catch { /* ignore */ }
}

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatTile({ label, value, icon: Icon, trend, to, testId }) {
  const inner = (
    <div
      data-testid={testId}
      className="group rounded-[20px] border border-white/[0.07] bg-[#111113] p-4 transition-all hover:border-white/[0.14] hover:bg-[#141416]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400">
          <Icon className="h-4 w-4" />
        </div>
        {trend !== undefined && (
          <span className={`text-[11px] font-semibold ${Number(trend) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {Number(trend) >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tabular-nums text-white">{value}</div>
        <div className="mt-0.5 text-xs text-zinc-500 font-medium">{label}</div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function Suggestion({ title, desc, done, to }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 ${
        done
          ? "border-emerald-500/20 bg-emerald-500/[0.05] opacity-60"
          : "border-white/[0.07] bg-white/[0.02] hover:border-[#b4bffa]/40 hover:bg-[#b4bffa]/[0.06]"
      }`}
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
        done
          ? "border-emerald-500/40 bg-emerald-500/20"
          : "border-white/[0.07] bg-white/[0.03] group-hover:border-[#b4bffa]/40"
      }`}>
        {done
          ? <Check className="h-3.5 w-3.5 text-emerald-400" />
          : <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-[#b4bffa]" />}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-white truncate">{title}</div>
        <div className="text-[11px] text-zinc-500 truncate">{desc}</div>
      </div>
    </Link>
  );
}

function AccountRow({ label, value, copyText }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.05] py-2.5 last:border-0">
      <span className="w-24 shrink-0 text-[11px] text-zinc-500">{label}</span>
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-200">{value}</span>
      {copyText && (
        <button
          type="button"
          onClick={() => copy(copyText, label)}
          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.06] hover:text-zinc-300"
          title={`Copy ${label}`}
          aria-label={`Copy ${label}`}
        >
          <Copy className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, to, onClick, accent }) {
  const cls = "group flex cursor-pointer flex-col gap-3 rounded-[20px] border border-white/[0.07] bg-[#111113] p-4 text-left transition-all hover:border-white/[0.14] hover:bg-[#141416]";
  const inner = (
    <>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
        accent
          ? "bg-[#b4bffa]/15 text-[#b4bffa] group-hover:bg-[#b4bffa]/25"
          : "bg-white/[0.04] text-zinc-400 group-hover:text-zinc-200"
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs font-bold text-white">{label}</div>
        <div className="mt-0.5 text-[11px] text-zinc-500">{desc}</div>
      </div>
    </>
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const RANGES = [
  { id: "7d",  label: "7d" },
  { id: "30d", label: "30d" },
  { id: "all", label: "All" },
];

export default function Overview() {
  const { user, setUser } = useAuth();

  const [analytics, setAnalytics]         = useState(null);
  const [range, setRange]                  = useState("7d");
  const [loadingAnalytics, setLoading]     = useState(true);
  const [redeemCode, setRedeemCode]        = useState("");
  const [redeeming, setRedeeming]          = useState(false);
  const [syncing, setSyncing]              = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/me/analytics?range=${range}`)
      .then(({ data }) => { if (alive) { setAnalytics(data); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [range, user.username, user.views]);

  const redeemPremium = async (e) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const { data } = await api.post("/me/redeem-invite", { code: redeemCode.trim() });
      if (data.token) setToken(data.token);
      if (data.user) setUser(data.user);
      setRedeemCode("");
      toast.success(data.detail || "Code redeemed!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired code");
    } finally {
      setRedeeming(false);
    }
  };

  const syncDiscord = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post("/auth/discord/sync");
      if (data.user) setUser(data.user);
      toast.success("Discord synced");
    } catch {
      toast.error("Sync failed â€” try reconnecting in Settings");
    } finally {
      setSyncing(false);
    }
  };

  const p           = user.profile || {};
  const views       = Number(user?.views || analytics?.views || 0);
  const linkClicks  = Number(analytics?.link_clicks || 0);
  const badges      = (user.badges || []).length;
  const days        = daysSince(user.created_at);
  const tier        = user.tier || "free";
  const isPremium   = tier === "premium" || tier === "admin" || user.is_owner;
  const changePct   = analytics?.change_pct ?? 0;
  const profileUrl  = `${window.location.origin}/${user.username}`;

  // Completion suggestions â€” ranked by importance, capped at 4 pending ones shown
  const suggestions = [
    { id: "avatar",     title: "Upload an avatar",       desc: "First thing visitors see",           done: !!p.avatar_url,                                            to: "/!/dashboard/editor?tab=about"      },
    { id: "bio",        title: "Write a bio",            desc: "Tell people about yourself",          done: !!p.bio,                                                   to: "/!/dashboard/editor?tab=about"      },
    { id: "links",      title: "Add social links",       desc: "Connect your social accounts",        done: Array.isArray(p.links) && p.links.length > 0,              to: "/!/dashboard/links"                 },
    { id: "background", title: "Set a background",       desc: "Image, colour or animated effect",    done: !!(p.background_url || p.background_effect),               to: "/!/dashboard/editor?tab=appearance" },
    { id: "discord",    title: "Connect Discord",        desc: "Sync roles and earn badges",          done: !!user.discord?.linked,                                    to: "/!/dashboard/settings"              },
    { id: "audio",      title: "Add background audio",   desc: "Give your profile a vibe",            done: Array.isArray(p.tracks) && p.tracks.length > 0,            to: "/!/dashboard/editor?tab=appearance" },
    { id: "badges",     title: "Equip a badge",          desc: "Show off your achievements",          done: Array.isArray(user.equipped_badges) && user.equipped_badges.length > 0, to: "/!/dashboard/badges" },
  ];
  const completedCount  = suggestions.filter((s) => s.done).length;
  const completionPct   = Math.round((completedCount / suggestions.length) * 100);
  const pending         = suggestions.filter((s) => !s.done).slice(0, 4);
  const series          = analytics?.series || [];

  return (
    <div className="space-y-5 pb-20" data-testid="overview-page">

      {/* â”€â”€ Greeting header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#111113] p-5">
        {/* ambient glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#b4bffa]/[0.08] blur-[70px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-zinc-900 ring-2 ring-white/[0.07]">
              {p.avatar_url ? (
                <img src={fileUrl(p.avatar_url)} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xl font-bold text-zinc-400">
                  {(user.display_name || user.username || "?")[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold text-white truncate max-w-[200px]">
                  {user.display_name || user.username}
                </span>
                <Link
                  to="/!/pricing"
                  data-testid="stat-tier"
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide hover:border-white/20 transition ${
                    isPremium
                      ? "border-amber-400/25 bg-amber-400/[0.08] text-amber-300"
                      : "border-white/[0.07] bg-white/[0.03] text-zinc-500"
                  }`}
                >
                  {isPremium && <Crown className="h-2.5 w-2.5" />}
                  {tier}
                </Link>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                <span data-testid="stat-username" className="font-mono2">@{user.username}</span>
                <span>Â·</span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {analytics?.alias_status || "Active"}
                </span>
              </div>
            </div>
          </div>
          {/* CTAs */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => copy(profileUrl, "Profile URL")}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-white/[0.14] hover:bg-white/[0.06]"
            >
              <Copy className="h-3.5 w-3.5" /> Copy URL
            </button>
            <Link
              to={`/${user.username}`}
              target="_blank"
              data-testid="view-public-btn"
              className="flex items-center gap-1.5 rounded-xl bg-[#b4bffa] px-3 py-2 text-xs font-bold text-white shadow-md shadow-[#b4bffa]/20 transition hover:bg-[#424669]"
            >
              <Eye className="h-3.5 w-3.5" /> View Profile
            </Link>
          </div>
        </div>
      </section>

      {/* Your domains */}
      <div className="rounded-[20px] border border-white/[0.07] bg-[#111113] p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#b4bffa]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Your domains:</h2>
          </div>
          <span className="text-[11px] font-mono2 text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            2 Active Domains
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { domain: "tourn.lol", url: `https://tourn.lol/${user.username}`, label: `tourn.lol/${user.username}` },
            { domain: "swats.bio", url: `https://swats.bio/${user.username}`, label: `swats.bio/${user.username}` },
          ].map((item) => (
            <div
              key={item.domain}
              className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-black/40 hover:border-white/15 transition-all group"
            >
              <div className="min-w-0 pr-2">
                <div className="text-xs font-bold text-white group-hover:text-[#b4bffa] transition-colors truncate">
                  {item.label}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono2 mt-0.5">Canonical · Verified Active</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => copy(item.url, `${item.domain} link`)}
                  title={`Copy ${item.domain} link`}
                  className="p-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`Visit ${item.domain}`}
                  className="p-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ 4 Stat tiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          testId="stat-views"
          label="Profile views"
          value={loadingAnalytics ? "â€¦" : fmt(views)}
          icon={Eye}
          trend={changePct || undefined}
          to="/!/dashboard/stats"
        />
        <StatTile
          label="Link clicks"
          value={loadingAnalytics ? "â€¦" : fmt(linkClicks)}
          icon={Link2}
          to="/!/dashboard/stats"
        />
        <StatTile
          testId="stat-badges"
          label="Badges owned"
          value={badges}
          icon={Award}
          to="/!/dashboard/badges"
        />
        <StatTile
          label="Days active"
          value={fmt(days)}
          icon={Calendar}
        />
      </div>

      {/* â”€â”€ Completion + Account info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">

        {/* Completion meter */}
        <section
          data-testid="completion-card"
          className="rounded-[20px] border border-white/[0.07] bg-[#111113] p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#b4bffa]" />
                <h2 className="text-sm font-bold text-white">Profile setup</h2>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {completedCount}/{suggestions.length} complete â€” finish these to stand out
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-bold tabular-nums text-white">{completionPct}%</span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-[#b4bffa] transition-[width] duration-700 ease-out"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {pending.map((s) => <Suggestion key={s.id} {...s} />)}
            {pending.length === 0 && (
              <div className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-xs font-semibold text-emerald-300">Your profile is fully set up ðŸŽ‰</p>
              </div>
            )}
          </div>

          {/* Redeem code inline */}
          <form data-testid="redeem-premium-card" onSubmit={redeemPremium} className="flex gap-2 pt-1 border-t border-white/[0.05]">
            <input
              data-testid="redeem-premium-input"
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder="Redeem invite / premium codeâ€¦"
              className="flex-1 min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition focus:border-[#b4bffa]/50 focus:bg-[#b4bffa]/[0.04]"
            />
            <button
              type="submit"
              disabled={redeeming || !redeemCode.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#b4bffa] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#424669] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {redeeming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ticket className="h-3.5 w-3.5" />}
              Redeem
            </button>
          </form>
        </section>

        {/* Account info */}
        <section className="rounded-[20px] border border-white/[0.07] bg-[#111113] p-5">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-[#b4bffa]" />
            <h2 className="text-sm font-bold text-white">Account info</h2>
          </div>
          <div className="space-y-0">
            <AccountRow label="User ID"  value={`#${user.uid_number || "â€”"}`}     copyText={String(user.uid_number || "")} />
            <AccountRow label="Username" value={`@${user.username}`}              copyText={user.username} />
            <AccountRow label="Email"    value={maskEmail(user.email)}            copyText={user.email} />
            <AccountRow label="Tier"     value={<span className="capitalize">{tier}</span>} />
            <AccountRow label="Joined"   value={joinedLabel(user.created_at)} />
            <AccountRow
              label="Discord"
              value={
                user.discord?.linked
                  ? <span className="flex items-center gap-1.5 text-indigo-400"><FaDiscord className="h-3 w-3" />{user.discord.username || "Connected"}</span>
                  : <span className="text-zinc-600">Not linked</span>
              }
            />
          </div>
          {!user.discord?.linked && (
            <Link
              to="/!/auth/discord"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
            >
              <FaDiscord className="h-3.5 w-3.5" /> Connect Discord
            </Link>
          )}
        </section>
      </div>

      {/* â”€â”€ Quick actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="rounded-[20px] border border-white/[0.07] bg-[#111113] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#b4bffa]" />
          <h2 className="text-sm font-bold text-white">Quick actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <QuickAction icon={Eye}     label="View profile"   desc="Open your public page"         to={`/${user.username}`}                   accent />
          <QuickAction icon={Copy}    label="Copy URL"        desc={`tourn.lol/${user.username}`}  onClick={() => copy(profileUrl, "Profile URL")} />
          <QuickAction icon={Pencil}  label="Edit profile"   desc="Update About me & appearance"  to="/!/dashboard/editor?tab=about" />
          <QuickAction icon={BarChart3} label="Statistics"   desc="Views, clicks, referrers"      to="/!/dashboard/stats" />
          {!isPremium
            ? <QuickAction icon={Crown} label="Upgrade"   desc="Unlock exclusive features"   to="/!/pricing" accent />
            : <QuickAction icon={Award} label="Badges"    desc="Manage your equipped badges"  to="/!/dashboard/badges" />
          }
          {user.discord?.linked
            ? <QuickAction icon={syncing ? Loader2 : RefreshCw} label="Sync Discord" desc="Refresh roles and badges"  onClick={syncDiscord} />
            : <QuickAction icon={FaDiscord}                     label="Link Discord"  desc="Sync roles and earn badges" to="/!/auth/discord" />
          }
        </div>
      </section>

      {/* â”€â”€ Announcements + Recent activity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* Community Templates */}
      <section className="rounded-[20px] border border-white/[0.07] bg-[#111113] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white">Community Templates</h2>
          </div>
          <Link
            to="/!/dashboard/templates"
            className="text-[11px] font-semibold text-violet-400 transition hover:text-white flex items-center gap-1"
          >
            Browse all templates →
          </Link>
        </div>
        
        <Link
          to="/!/dashboard/templates"
          className="group flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-all hover:border-violet-500/40 hover:bg-violet-500/[0.04]"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors">Profile Templates</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Publish your look or clone curated community biolink designs with 1 click</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-violet-400 transition-colors shrink-0" />
        </Link>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">

        {/* Announcements */}
        <section className="rounded-[20px] border border-white/[0.07] bg-[#111113] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-[#b4bffa]" />
              <h2 className="text-sm font-bold text-white">What's new</h2>
            </div>
            <Link to="/!/devlogs" className="text-[11px] text-zinc-500 transition hover:text-zinc-300">
              All devlogs â†’
            </Link>
          </div>
          <div className="space-y-2">
            {[
              { title: "Dashboard overhaul",      desc: "New nav structure, home page and design system", live: true  },
              { title: "Card style presets fixed", desc: "Frosted, Aurora and Outlined now preview correctly", live: false },
              { title: "Links page redesigned",   desc: "Quick add strip and full platform modal",         live: false },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${item.live ? "bg-[#b4bffa]" : "bg-zinc-600"}`} />
                <div>
                  <p className="text-xs font-semibold text-white">{item.title}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent activity â€” last N days from analytics series */}
        <section className="rounded-[20px] border border-white/[0.07] bg-[#111113] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#b4bffa]" />
              <h2 className="text-sm font-bold text-white">Recent activity</h2>
            </div>
            <div className="flex items-center gap-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    range === r.id
                      ? "bg-[#b4bffa]/15 text-[#b4bffa]"
                      : "text-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {loadingAnalytics ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
            </div>
          ) : series.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-xs text-zinc-600">
              No activity yet â€” share your profile to start tracking views
            </div>
          ) : (
            <div className="space-y-2">
              {series.slice(-6).reverse().map((point, i) => {
                const raw = point.date || point.day;
                const dateLabel = raw
                  ? new Date(raw).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  : `Day ${i + 1}`;
                const v = Number(point.views || 0);
                const maxViews = Math.max(...series.map((s) => Number(s.views || 0)), 1);
                const pct = Math.max(4, (v / maxViews) * 100);
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-10 shrink-0 text-[11px] text-zinc-600 font-mono2">{dateLabel}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full bg-[#b4bffa]/60 transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-7 shrink-0 text-right text-[11px] font-medium tabular-nums text-zinc-400">
                      {fmt(v)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
