import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, setToken, fileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import { FaDiscord } from "react-icons/fa6";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Award, Check, ChevronRight, Crown, Eye, Gift, Loader2, Pencil, Settings,
  ShieldCheck, Sparkles, Monitor, Smartphone, Tablet, Link2, FileText,
  ArrowUpRight, TrendingUp, TrendingDown, Clock,
} from "lucide-react";
import AutoMarqueeText from "@/components/AutoMarqueeText";
import { StatCard } from "@/components/ui-shared/DashPrimitives";

const RANGES = [
  { id: "24h", label: "24h" },
  { id: "3d", label: "3d" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "all", label: "All" },
];

// Shared card surface for every Overview panel.
const CARD = "dash-card dash-card-lift rounded-2xl p-5";
const SECTION_TITLE = "text-[15px] font-semibold text-zinc-100";
const MUTED = "text-xs text-zinc-400";

export default function Overview() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [range, setRange] = useState("7d");
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [rewards, setRewards] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

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

  useEffect(() => {
    let alive = true;
    Promise.allSettled([api.get("/me/rewards")]).then(([r]) => {
      if (!alive) return;
      if (r.status === "fulfilled") setRewards(r.value.data);
    });
    return () => { alive = false; };
  }, [user.username, user.views]);

  const handleClaim = async (m) => {
    if (!m) return;
    setClaiming(true);
    try {
      const { data } = await api.post("/me/rewards/claim", { views: m.views });
      toast.success(data.message || `Claimed ${m.premium_days} days of Premium`);
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
      toast.success(data.detail || "Code redeemed successfully");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not redeem that code");
    } finally {
      setRedeeming(false);
    }
  };

  const p = user.profile || {};
  const ownedBadges = user.badges || [];
  const tierLabel = user.tier === "admin" ? "Admin" : user.tier === "premium" ? "Premium" : "Free";
  const views = Number(user.views || 0);

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
      { id: "views", title: "Reach first profile view", completed: views >= 1, link: "/!/dashboard" },
    ],
  };

  const diffViews = analytics?.diff_views ?? 0;
  const changePct = analytics?.change_pct ?? 0;
  const isPositiveChange = diffViews >= 0;
  const series = analytics?.series || [];
  const hasViews = series.length > 0 && series.some((s) => s.views > 0);
  const totalInRange = series.reduce((acc, s) => acc + s.views, 0);

  const claimable = (rewards?.milestones || []).filter((m) => views >= m.views && !m.claimed);
  const nextMilestone = (rewards?.milestones || []).find((m) => views < m.views);
  const milestoneViews = Number(rewards?.views || views);

  return (
    <div className="dash-stagger space-y-5 pb-20" data-testid="overview-page">
      {/* Identity + headline stats */}
      <section className={`${CARD} relative overflow-hidden`}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#a48df4]/10 blur-[90px]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10">
              {p.avatar_url ? (
                <img src={fileUrl(p.avatar_url)} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-[#c4b5fd]">
                  {(user.display_name || user.username || "?")[0]?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <AutoMarqueeText
                  text={user.display_name || user.username}
                  className="font-display text-xl font-bold text-white sm:text-2xl"
                />
                <Link
                  to="/!/pricing"
                  data-testid="stat-tier"
                  className="shrink-0 rounded-full border border-[#a48df4]/30 bg-[#a48df4]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#c4b5fd] transition-colors hover:bg-[#a48df4]/20"
                >
                  {tierLabel}
                </Link>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                <span data-testid="stat-username" className="font-mono2">@{user.username}</span>
                <span className="text-zinc-700">/</span>
                <span className="font-mono2">UID #{user.uid_number || analytics?.join_rank || 1}</span>
                <span className="text-zinc-700">/</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {analytics?.alias_status || "Active and verified"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-[560px]">
            <StatCard
              to="/!/dashboard/stats"
              testId="stat-views"
              label="Profile views"
              icon={Eye}
              value={views.toLocaleString()}
              footer={
                <span className={`inline-flex items-center gap-1 ${isPositiveChange ? "text-emerald-400" : "text-rose-400"}`}>
                  {isPositiveChange ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPositiveChange ? "+" : ""}{diffViews} vs last week{changePct ? ` (${changePct > 0 ? "+" : ""}${changePct}%)` : ""}
                </span>
              }
            />
            <StatCard
              to="/!/dashboard/leaderboard"
              testId="stat-rank"
              label="Join rank"
              icon={ShieldCheck}
              value={`#${analytics?.join_rank || user.uid_number || 1}`}
              footer="Early adopter"
            />
            <StatCard
              to="/!/dashboard/badges"
              testId="stat-badges"
              label="Badges"
              icon={Award}
              value={ownedBadges.length}
              footer={`${user.equipped_badges?.length || ownedBadges.length} equipped`}
            />
          </div>
        </div>
      </section>

      {/* Setup checklist */}
      <section data-testid="completion-card" className={CARD}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#a48df4]" />
              <h2 className={SECTION_TITLE}>Profile setup</h2>
            </div>
            <p className={`mt-1 ${MUTED}`}>Finish these to make your bio page complete.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono2 text-sm font-semibold text-[#c4b5fd] tabular-nums">
              {completion.percentage}%
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
              <div
                className="dash-progress-fill h-full rounded-full bg-[#a48df4] transition-[width] duration-700 ease-out"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {completion.tasks.map((task) => (
            <Link
              key={task.id}
              to={task.link}
              className={`group flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-200 ${
                task.completed
                  ? "border-emerald-500/20 bg-emerald-500/[0.04] text-zinc-400"
                  : "border-white/[0.08] bg-white/[0.02] text-zinc-200 hover:border-[#a48df4]/35 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    task.completed
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/[0.05] text-zinc-500 group-hover:bg-[#a48df4]/15 group-hover:text-[#c4b5fd]"
                  }`}
                >
                  {task.completed ? <Check className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
                </span>
                <span className={`truncate text-xs font-medium ${task.completed ? "text-zinc-500 line-through" : ""}`}>
                  {task.title}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#c4b5fd]" />
            </Link>
          ))}
        </div>
      </section>

      {/* Analytics */}
      <section className={CARD} data-testid="overview-activity">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#a48df4]" />
              <h2 className={SECTION_TITLE}>Profile statistics</h2>
            </div>
            <p className={`mt-1 ${MUTED}`}>Validated visitor impressions over time.</p>
          </div>

          <div className="dash-segment self-start sm:self-auto" role="tablist" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={range === r.id}
                onClick={() => setRange(r.id)}
                className="dash-segment-btn dash-press"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col justify-between">
            <div className="h-64 w-full min-w-0">
              {loadingAnalytics ? (
                <div className="dash-skeleton h-full w-full" />
              ) : !hasViews ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center">
                  <Eye className="mb-2 h-7 w-7 text-zinc-600" />
                  <p className="text-xs font-medium text-zinc-300">No views recorded in this period</p>
                  <p className="mt-1 max-w-xs text-[11px] text-zinc-500">
                    Share your link (swats.bio/{user.username}) to start gaining analytics.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                  <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a48df4" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#a48df4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ stroke: "rgba(164,141,244,0.3)", strokeWidth: 1 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-white/10 bg-black/90 px-3 py-2 text-left shadow-xl backdrop-blur-md">
                              <div className="font-mono2 text-[10px] text-zinc-400">{d.date}</div>
                              <div className="mt-0.5 text-xs font-semibold text-white">
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
                      stroke="#a48df4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#viewsGradient)"
                      isAnimationActive
                      animationDuration={700}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
              <span className="font-mono2 text-xs text-zinc-400">
                Total in range: <strong className="text-zinc-100">{totalInRange} views</strong>
              </span>
              <a
                href={`/${user.username}`}
                target="_blank"
                rel="noreferrer"
                data-testid="analytics-view-more"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#c4b5fd] transition-colors hover:text-white"
              >
                View profile
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-white/[0.06] bg-black/30 p-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Visitor devices</h3>
              <p className="mt-1 text-[11px] text-zinc-500">Where people view your profile from.</p>

              <div className="mt-4 space-y-3.5">
                {(analytics?.devices || []).map((dev) => {
                  const Icon = dev.device === "mobile" ? Smartphone : dev.device === "tablet" ? Tablet : Monitor;
                  return (
                    <div key={dev.device} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 capitalize text-zinc-300">
                          <Icon className="h-3.5 w-3.5 text-[#a48df4]" />
                          {dev.device}
                        </span>
                        <span className="font-mono2 text-zinc-400 tabular-nums">
                          {dev.count} ({dev.percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="dash-progress-fill h-full rounded-full bg-[#a48df4] transition-[width] duration-700 ease-out"
                          style={{ width: `${dev.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-4 border-t border-white/[0.06] pt-3 text-center font-mono2 text-[10px] text-zinc-500">
              Data is anonymized and GDPR compliant
            </p>
          </div>
        </div>
      </section>

      {/* Discord */}
      <section
        data-testid="connect-card"
        className="dash-card dash-card-lift flex flex-col items-center justify-between gap-4 rounded-2xl border-[#5865F2]/20 bg-[#5865F2]/[0.05] p-5 sm:flex-row"
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/25">
            <FaDiscord className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">
              {user.discord?.linked ? "Discord connected" : "Connect your Discord"}
            </div>
            <div className="text-xs text-zinc-400">
              {user.discord?.linked
                ? `Linked to ${user.discord.username || user.discord.tag || "Discord account"}`
                : "Show your Discord status, bot details and role badges on your bio"}
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
                .catch(() => toast.error("Could not start the Discord connection"));
            }
          }}
          className="dash-press inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-xs font-semibold text-white transition-[filter,transform] duration-200 hover:brightness-110"
        >
          <FaDiscord className="h-4 w-4" />
          <span>{user.discord?.linked ? "Manage connection" : "Connect Discord"}</span>
        </button>
      </section>

      {/* Quick actions */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { to: "/!/dashboard/editor", testId: "qa-layout", title: "Edit card and layout", sub: "Appearance, styling and theme", icon: Pencil, tone: "text-[#c4b5fd] bg-[#a48df4]/12" },
          { to: "/!/dashboard/links", testId: "qa-username", title: "Manage links", sub: "Socials, wallets and URLs", icon: Link2, tone: "text-sky-300 bg-sky-500/12" },
          { to: "/!/dashboard/badges", title: "Equip badges", sub: "Glow settings and showcase", icon: Award, tone: "text-amber-300 bg-amber-500/12" },
          { to: "/!/dashboard/settings", testId: "qa-settings", title: "Account settings", sub: "Security, 2FA and aliases", icon: Settings, tone: "text-zinc-300 bg-white/[0.06]" },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            data-testid={a.testId}
            className="dash-card dash-card-lift group flex min-w-0 items-center gap-3.5 rounded-2xl p-4"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${a.tone}`}>
              <a.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-100">{a.title}</div>
              <div className="truncate text-[11px] text-zinc-500">{a.sub}</div>
            </div>
          </Link>
        ))}
      </section>

      {/* Rewards and redeem */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className={`${CARD} flex flex-col justify-between`} data-testid="overview-rewards">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-[#a48df4]" />
                <h3 className={SECTION_TITLE}>Milestone rewards</h3>
              </div>
              <Link to="/!/dashboard/rewards" className="text-[11px] font-medium text-[#c4b5fd] hover:text-white">
                View all
              </Link>
            </div>
            <p className={`mt-1 ${MUTED}`}>Reach view milestones to unlock free Premium days.</p>

            {rewards && claimable.length > 0 && (
              <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Reward ready: {claimable[0].views.toLocaleString()} views
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                  You unlocked <strong>{claimable[0].premium_days} days of Premium</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => handleClaim(claimable[0])}
                  disabled={claiming}
                  className="dash-press mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-white transition-[filter,opacity] duration-200 hover:brightness-110 disabled:opacity-50"
                >
                  {claiming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gift className="h-3.5 w-3.5" />}
                  Claim {claimable[0].premium_days} days of Premium
                </button>
              </div>
            )}

            {rewards && claimable.length === 0 && (
              <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/40 p-4">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-200">
                  <span>Next milestone: {nextMilestone ? `${nextMilestone.views.toLocaleString()} views` : "All milestones unlocked"}</span>
                  {nextMilestone && <span className="font-mono2 text-[#c4b5fd]">+{nextMilestone.premium_days}d Premium</span>}
                </div>
                {nextMilestone && (
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="dash-progress-fill h-full rounded-full bg-[#a48df4] transition-[width] duration-700 ease-out"
                        style={{ width: `${Math.min(100, Math.round((milestoneViews / nextMilestone.views) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between font-mono2 text-[10px] text-zinc-500">
                      <span>{views.toLocaleString()} views</span>
                      <span>{Math.max(0, nextMilestone.views - views).toLocaleString()} to go</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-white/[0.06] pt-3">
            <Link to="/!/docs" className="inline-flex items-center gap-2 text-xs text-zinc-400 transition-colors hover:text-zinc-200">
              <FileText className="h-3.5 w-3.5 text-[#a48df4]" />
              <span>Documentation and custom domain setup</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div data-testid="redeem-premium-card" className={`${CARD} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-[#a48df4]" />
              <h3 className={SECTION_TITLE}>Redeem invite or gift code</h3>
            </div>
            <p className={`mt-1 ${MUTED}`}>Enter a promo or invite code to unlock Premium and exclusive badges.</p>

            <form onSubmit={redeemPremium} className="mt-4 space-y-3">
              <input
                data-testid="redeem-premium-input"
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="PROMO-XXXX-XXXX"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-mono2 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a48df4]/50 focus:ring-2 focus:ring-[#a48df4]/20"
              />
              <button
                type="submit"
                disabled={redeeming || !redeemCode.trim()}
                className="dash-press flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.08] py-2.5 text-xs font-semibold text-zinc-100 transition-colors duration-200 hover:bg-[#a48df4] hover:text-white disabled:opacity-40"
              >
                {redeeming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Redeem
              </button>
            </form>
          </div>

          <div className="mt-4 border-t border-white/[0.06] pt-3">
            <span className="text-[11px] text-zinc-500">Need help? Ask in our Discord community.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
