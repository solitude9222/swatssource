import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api, setToken, fileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import { FaDiscord } from "react-icons/fa6";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import {
  AtSign, Award, Check, ChevronRight, Crown, Eye, Gift, Image as ImageIcon,
  LayoutTemplate, Loader2, Pencil, Settings, ShieldCheck, Sparkles, UserRound,
  ExternalLink, TrendingUp, TrendingDown, ArrowUpRight, Monitor, Smartphone,
  Tablet, Link2, LayoutGrid, HelpCircle, FileText, CheckCircle2, Clock
} from "lucide-react";
import { actionLabel } from "@/constants/audit";
import AutoMarqueeText from "@/components/AutoMarqueeText";

const EASE = [0.16, 1, 0.3, 1];
const RANGES = [
  { id: "24h", label: "24 Hours" },
  { id: "3d", label: "3 Days" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "all", label: "All Time" },
];

export default function Overview() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [range, setRange] = useState("7d");
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [rewards, setRewards] = useState(null);
  const [activity, setActivity] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  // Fetch real analytics based on range
  useEffect(() => {
    let alive = true;
    setLoadingAnalytics(true);
    api.get(`/me/analytics?range=${range}`)
      .then(({ data }) => {
        if (alive) {
          setAnalytics(data);
          setLoadingAnalytics(false);
        }
      })
      .catch(() => {
        if (alive) setLoadingAnalytics(false);
      });
    return () => { alive = false; };
  }, [range, user.username, user.views]);

  // Fetch rewards and recent activity
  useEffect(() => {
    let alive = true;
    Promise.allSettled([api.get("/me/rewards"), api.get("/me/activity")]).then(([r, a]) => {
      if (!alive) return;
      if (r.status === "fulfilled") setRewards(r.value.data);
      if (a.status === "fulfilled") setActivity(a.value.data);
    });
    return () => { alive = false; };
  }, [user.username, user.views]);

  const handleClaim = async (m) => {
    if (!m) return;
    setClaiming(true);
    try {
      const { data } = await api.post("/me/rewards/claim", { views: m.views });
      toast.success(data.message || `🎉 Claimed ${m.premium_days} days of Premium!`);
      if (data.user) setUser(data.user);
      const res = await api.get("/me/rewards");
      setRewards(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not claim reward");
    } finally {
      setClaiming(false);
    }
  };

  const redeemPremium = async (e) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const { data } = await api.post("/me/redeem-invite", { code: redeemCode.trim() });
      if (data.token) setToken(data.token);
      if (data.user) setUser(data.user);
      setRedeemCode("");
      toast.success(data.detail || "Code redeemed successfully! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not redeem that code");
    } finally {
      setRedeeming(false);
    }
  };

  const p = user.profile || {};
  const ownedBadges = user.badges || [];
  const tierLabel = user.tier === "admin" ? "Admin" : user.tier === "premium" ? "Premium" : "Free";

  // Dynamic Profile Setup tasks calculation
  const completion = analytics?.completion || {
    percentage: 0,
    completed_count: 0,
    total_count: 6,
    tasks: [
      { id: "avatar", title: "Upload an avatar", completed: !!p.avatar_url, link: "/!/dashboard/editor" },
      { id: "bio", title: "Add a description / bio", completed: !!p.bio, link: "/!/dashboard/editor" },
      { id: "background", title: "Choose a background", completed: !!(p.background_url || p.background_effect), link: "/!/dashboard/effects" },
      { id: "discord", title: "Connect Discord account", completed: !!user.discord?.linked, link: "/!/dashboard" },
      { id: "links", title: "Add social links", completed: Array.isArray(p.links) && p.links.length > 0, link: "/!/dashboard/links" },
      { id: "views", title: "Reach first profile view", completed: Number(user.views || 0) >= 1, link: "/!/dashboard" },
    ],
  };

  const diffViews = analytics?.diff_views ?? 0;
  const changePct = analytics?.change_pct ?? 0;
  const isPositiveChange = diffViews >= 0;

  return (
    <div className="space-y-6 pb-20" data-testid="overview-page">
      {/* 1. ACCOUNT OVERVIEW BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] via-[#121118]/80 to-[#08080c] p-6 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/10 blur-[100px]" />
        
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 ring-2 ring-brand-400/20 shadow-lg">
              {p.avatar_url ? (
                <img src={fileUrl(p.avatar_url)} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xl font-black text-brand-300">
                  {(user.display_name || user.username || "?")[0]?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <AutoMarqueeText text={user.display_name || user.username} className="font-display text-xl sm:text-2xl font-black text-white" />
                <Link
                  to="/!/pricing"
                  data-testid="stat-tier"
                  className="inline-flex items-center rounded-full border border-brand-400/30 bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-bold text-brand-200 hover:bg-brand-500/25 transition"
                >
                  {tierLabel}
                </Link>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 font-mono2">
                <span data-testid="stat-username">@{user.username}</span>
                <span className="text-zinc-600">·</span>
                <span>UID #{user.uid_number || analytics?.join_rank || 1}</span>
                <span className="text-zinc-600">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {analytics?.alias_status || "Active · Verified"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/!/dashboard/stats"
              data-testid="stat-views"
              className="flex-1 min-w-[130px] rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left hover:border-brand-400/20 transition"
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                <span>Profile Views</span>
                <Eye className="h-3.5 w-3.5 text-brand-300" />
              </div>
              <div className="mt-1 text-xl font-black text-zinc-50 font-display">
                {Number(user.views || 0).toLocaleString()}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-mono2">
                {isPositiveChange ? (
                  <span className="flex items-center text-emerald-400">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    +{diffViews} vs last week ({changePct > 0 ? `+${changePct}%` : "steady"})
                  </span>
                ) : (
                  <span className="flex items-center text-rose-400">
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                    {diffViews} vs last week
                  </span>
                )}
              </div>
            </Link>

            <Link
              to="/!/dashboard/leaderboard"
              data-testid="stat-rank"
              className="flex-1 min-w-[110px] rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left hover:border-brand-400/20 transition"
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                <span>Join Rank</span>
                <ShieldCheck className="h-3.5 w-3.5 text-brand-300" />
              </div>
              <div className="mt-1 text-xl font-black text-zinc-50 font-display">
                #{analytics?.join_rank || user.uid_number || 1}
              </div>
              <div className="mt-0.5 text-[10px] font-mono2 text-zinc-500">
                Early adopter
              </div>
            </Link>

            <Link
              to="/!/dashboard/badges"
              data-testid="stat-badges"
              className="flex-1 min-w-[110px] rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left hover:border-brand-400/20 transition"
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                <span>Badges</span>
                <Award className="h-3.5 w-3.5 text-brand-300" />
              </div>
              <div className="mt-1 text-xl font-black text-zinc-50 font-display">
                {ownedBadges.length}
              </div>
              <div className="mt-0.5 text-[10px] font-mono2 text-zinc-500">
                {user.equipped_badges?.length || ownedBadges.length} equipped
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. PROFILE QUICKSTART & COMPLETION SECTION */}
      <div data-testid="completion-card" className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <h2 className="font-display text-base font-bold text-zinc-100">
                Profile Setup & Quickstart
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Complete these essential setup tasks to maximize the reach and beauty of your bio page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono2 text-sm font-bold text-brand-300">
              {completion.percentage}% complete
            </span>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300 transition-all duration-500"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {completion.tasks.map((task) => (
            <Link
              key={task.id}
              to={task.link}
              className={`group flex items-center justify-between rounded-2xl border p-3.5 transition ${
                task.completed
                  ? "border-emerald-500/20 bg-emerald-500/[0.03] text-zinc-300"
                  : "border-white/[0.07] bg-white/[0.02] text-zinc-200 hover:border-brand-400/30 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition ${
                    task.completed
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/[0.05] text-zinc-500 group-hover:bg-brand-500/20 group-hover:text-brand-300"
                  }`}
                >
                  {task.completed ? <Check className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
                </span>
                <span className={`text-xs font-semibold truncate ${task.completed ? "line-through text-zinc-400" : ""}`}>
                  {task.title}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-300" />
            </Link>
          ))}
        </div>
      </div>

      {/* 3. PROFILE STATISTICS & CHART SECTION */}
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-brand-300" />
              <h2 className="font-display text-base font-bold text-zinc-100">Profile Statistics</h2>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Real validated visitor impressions over time with device distribution.
            </p>
          </div>

          {/* Time range picker */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.08] bg-black/40 p-1">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  range === r.id
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart + Device Breakdown */}
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Views Area Chart */}
          <div className="flex flex-col justify-between" data-testid="overview-activity">
            <div className="h-60 w-full">
              {loadingAnalytics ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
                </div>
              ) : !analytics?.series || analytics.series.length === 0 || analytics.series.every((s) => s.views === 0) ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-4 rounded-2xl border border-dashed border-white/10">
                  <Eye className="h-8 w-8 text-zinc-600 mb-2" />
                  <p className="text-xs font-semibold text-zinc-400">No views recorded in this period</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5 max-w-xs">
                    Share your link (swats.bio/{user.username}) on Discord, TikTok, or Twitter to start gaining analytics!
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A48DF4" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#A48DF4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      stroke="#52525b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#52525b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-white/15 bg-black/90 p-2.5 shadow-xl backdrop-blur-md text-left">
                              <div className="text-[10px] font-mono2 text-zinc-400">{d.date}</div>
                              <div className="text-xs font-bold text-white mt-0.5">
                                {d.views} view{d.views === 1 ? "" : "s"}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#A48DF4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#viewsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-xs text-zinc-400 font-mono2">
                Total in range: <strong className="text-zinc-100">{analytics?.series?.reduce((acc, s) => acc + s.views, 0) || 0} views</strong>
              </span>
              <a
                href={`/${user.username}`}
                target="_blank"
                rel="noreferrer"
                data-testid="analytics-view-more"
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-brand-200 transition"
              >
                View Analytics & Profile <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Visitor Device Breakdown */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-black/30 p-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Visitor Devices
              </h3>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Breakdown of operating environments visiting your profile.
              </p>

              <div className="mt-4 space-y-3">
                {(analytics?.devices || []).map((dev) => {
                  const Icon = dev.device === "mobile" ? Smartphone : dev.device === "tablet" ? Tablet : Monitor;
                  return (
                    <div key={dev.device} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 capitalize text-zinc-300 font-medium">
                          <Icon className="h-3.5 w-3.5 text-brand-300" />
                          {dev.device}
                        </span>
                        <span className="font-mono2 text-zinc-400">
                          {dev.count} ({dev.percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
                          style={{ width: `${dev.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 border-t border-white/5 pt-3 text-center">
              <span className="text-[10px] font-mono2 text-zinc-500">
                Data strictly anonymized and GDPR compliant
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connect & Discord Integration Card */}
      <div data-testid="connect-card" className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-[#5865F2]/20 bg-[#5865F2]/[0.06] p-5">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30">
            <FaDiscord className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-bold text-white">
              {user.discord?.linked ? "Discord Connected" : "Connect your Discord"}
            </div>
            <div className="text-xs text-zinc-300">
              {user.discord?.linked
                ? `Linked to ${user.discord.username || user.discord.tag || "Discord account"}`
                : "Display Discord status, bot details, and role badges on your public bio"}
            </div>
          </div>
        </div>
        <button
          type="button"
          data-testid="connect-discord-btn"
          onClick={() => {
            if (user.discord?.linked) {
              navigate("/!/dashboard/settings");
            } else {
              api.get("/auth/discord/login", { params: { mode: "link" } })
                .then(({ data }) => { if (data.url) window.location.href = data.url; })
                .catch(() => toast.error("Could not initiate Discord connection"));
            }
          }}
          className="flex items-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-xs font-bold text-white hover:brightness-110 active:scale-95 transition shrink-0"
        >
          <FaDiscord className="h-4 w-4" />
          <span>{user.discord?.linked ? "Manage Discord Connection" : "Connect Discord"}</span>
        </button>
      </div>

      {/* 4. QUICK ACTIONS & SHORTCUTS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/!/dashboard/editor"
          data-testid="qa-layout"
          className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition hover:border-brand-400/30 hover:bg-white/[0.05]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 group-hover:scale-105 transition">
            <Pencil className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-100">Edit Card & Layout</div>
            <div className="text-[11px] text-zinc-400 truncate">Appearance, styling & theme</div>
          </div>
        </Link>

        <Link
          to="/!/dashboard/links"
          data-testid="qa-username"
          className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition hover:border-brand-400/30 hover:bg-white/[0.05]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300 group-hover:scale-105 transition">
            <Link2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-100">Manage Links</div>
            <div className="text-[11px] text-zinc-400 truncate">Socials, crypto wallets & URLs</div>
          </div>
        </Link>

        <Link
          to="/!/dashboard/badges"
          className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition hover:border-brand-400/30 hover:bg-white/[0.05]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 group-hover:scale-105 transition">
            <Award className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-100">Equip Badges</div>
            <div className="text-[11px] text-zinc-400 truncate">Glow settings & showcase</div>
          </div>
        </Link>

        <Link
          to="/!/dashboard/settings"
          data-testid="qa-settings"
          className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition hover:border-brand-400/30 hover:bg-white/[0.05]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-700/30 text-zinc-300 group-hover:scale-105 transition">
            <Settings className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-100">Account Settings</div>
            <div className="text-[11px] text-zinc-400 truncate">Security, 2FA & aliases</div>
          </div>
        </Link>
      </div>

      {/* 5. REWARDS & REDEEM SECTION */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Next Milestone Reward */}
        <div className="flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-xl" data-testid="overview-rewards">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-brand-300" />
                <h3 className="font-display text-base font-bold text-zinc-100">Milestone Rewards</h3>
              </div>
              <Link to="/!/dashboard/rewards" className="text-[10px] font-mono2 text-brand-300 hover:underline">
                View all
              </Link>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Reach organic view milestones to unlock free Premium days automatically.
            </p>

            {rewards && (() => {
              const claimable = (rewards.milestones || []).filter(
                (m) => Number(rewards.views || user.views || 0) >= m.views && !m.claimed
              );
              if (claimable.length > 0) {
                const cur = claimable[0];
                return (
                  <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span>Reward Ready to Claim! ({cur.views.toLocaleString()} views)</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                      You achieved this milestone and unlocked <strong>{cur.premium_days} days of Premium</strong>!
                    </p>
                    <button
                      type="button"
                      onClick={() => handleClaim(cur)}
                      disabled={claiming}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition"
                    >
                      {claiming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gift className="h-3.5 w-3.5" />}
                      Claim {cur.premium_days} Days Premium
                    </button>
                  </div>
                );
              }
              const next = (rewards.milestones || []).find((m) => (Number(rewards.views || user.views || 0) < m.views));
              return (
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/40 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                    <span>Next milestone: {next ? `${next.views.toLocaleString()} views` : "All milestones unlocked!"}</span>
                    {next && <span className="font-mono2 text-brand-300">+{next.premium_days}d Premium</span>}
                  </div>
                  {next && (
                    <div className="mt-2.5 space-y-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-brand-400"
                          style={{
                            width: `${Math.min(100, Math.round(((Number(user.views || 0)) / next.views) * 100))}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono2 text-zinc-500">
                        <span>{Number(user.views || 0).toLocaleString()} views</span>
                        <span>{Math.max(0, next.views - Number(user.views || 0)).toLocaleString()} to go</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="mt-4 border-t border-white/5 pt-3">
            <Link to="/!/docs" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition">
              <FileText className="h-3.5 w-3.5 text-brand-300" />
              <span>Read documentation & custom domain setup guide →</span>
            </Link>
          </div>
        </div>

        {/* Redeem Code Card */}
        <div data-testid="redeem-premium-card" className="flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-brand-300" />
              <h3 className="font-display text-base font-bold text-zinc-100">Redeem Invite or Gift Code</h3>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Enter a promotional or invite code to unlock Premium tiers and exclusive badges.
            </p>

            <form onSubmit={redeemPremium} className="mt-4 space-y-3">
              <input
                data-testid="redeem-premium-input"
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="PROMO-XXXX-XXXX"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-mono2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-brand-400/50"
              />
              <button
                type="submit"
                disabled={redeeming || !redeemCode.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.08] py-2.5 text-xs font-semibold text-zinc-100 hover:bg-brand-500 hover:text-white disabled:opacity-40 transition"
              >
                {redeeming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Redeem
              </button>
            </form>
          </div>

          <div className="mt-4 border-t border-white/5 pt-3 text-center">
            <span className="text-[11px] text-zinc-500">
              Need help? Join our community on Discord for instant support.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
