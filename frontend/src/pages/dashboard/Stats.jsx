import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Eye, Award, Link2, BarChart3, TrendingUp, Clock, Globe, Loader2 } from "lucide-react";

const RANGES = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All time" },
];

export default function Stats() {
  const { user } = useAuth();
  const views = user.views || 0;

  const [range, setRange] = useState("7d");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/me/analytics?range=${range}`)
      .then(({ data }) => { if (alive) { setAnalytics(data); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [range]);

  const series = analytics?.series || [];
  const chartData = series.map((point) => {
    const raw = point.date || point.day;
    const label = raw
      ? new Date(raw).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "—";
    return { day: label, views: Number(point.views || point.count || 0) };
  });

  const totalViews = Number(analytics?.views ?? views);
  const linkClicks = Number(analytics?.link_clicks || 0);
  const changePct = analytics?.change_pct ?? 0;

  const stats = [
    { icon: Eye, label: "Total Views", value: totalViews.toLocaleString(), trend: changePct, color: "text-blue-400" },
    { icon: Link2, label: "Link Clicks", value: linkClicks.toLocaleString(), color: "text-green-400" },
    { icon: Award, label: "Badges", value: (user.badges || []).length, color: "text-amber-400" },
    { icon: BarChart3, label: "Widgets", value: (user.profile?.widgets || []).length, color: "text-purple-400" },
  ];

  return (
    <div data-testid="stats-page" className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15">
          <BarChart3 className="w-4.5 h-4.5 text-brand-400" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold text-white">Statistics</h1>
          <p className="text-xs text-zinc-500">Your profile performance at a glance</p>
        </div>
      </div>

      {/* Stats Grid — compact tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-white/[0.06] bg-[#111113] p-3.5 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${s.color}`} />
                {s.trend !== undefined && s.trend !== 0 && (
                  <span className={`text-[10px] font-semibold ${Number(s.trend) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {Number(s.trend) >= 0 ? "+" : ""}{s.trend}%
                  </span>
                )}
              </div>
              <div className="font-display text-xl font-extrabold tabular-nums text-white">
                {s.value}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Chart Section — real data from API */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-sm font-semibold text-white">Profile Views</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Real visitor data from your analytics</div>
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

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 text-xs text-zinc-500">
            No view data yet — share your profile to start tracking
          </div>
        ) : (
          <div className="w-full min-w-0" style={{ height: 220, minHeight: 180 }}>
            <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="viewGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b4bffa" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#b4bffa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0c",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#fff",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: '#a1a1aa', fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#b4bffa"
                  strokeWidth={2}
                  fill="url(#viewGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 shrink-0">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">About View Counting</div>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              Views are validated after a real visitor dwells on your page. Your own visits and scripted traffic are not counted.
              The same visitor counts at most once per hour.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
