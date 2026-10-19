import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Eye, Award, Link2, BarChart3 } from "lucide-react";

const RANGES = [["24h", "24 hours"], ["3d", "3 days"], ["7d", "7 days"], ["30d", "30 days"], ["all", "All time"]];

export default function Stats() {
  const { user } = useAuth();
  const [range, setRange] = useState("7d");
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setActivity(null);
    setError("");
    api.get("/me/activity", { params: { range } })
      .then(({ data }) => { if (alive) setActivity(data); })
      .catch(() => { if (alive) setError("Analytics are temporarily unavailable."); });
    return () => { alive = false; };
  }, [range, user.username, user.views]);

  const stats = [
    { icon: Eye, label: "Lifetime views", value: Number(user.views || 0).toLocaleString() },
    { icon: Award, label: "Badges", value: (user.badges || []).length },
    { icon: Link2, label: "Links", value: (user.profile?.links || []).filter((link) => link?.enabled !== false).length },
    { icon: BarChart3, label: "Widgets", value: (user.profile?.widgets || []).filter((widget) => widget?.enabled !== false).length },
  ];

  return (
    <div className="space-y-6" data-testid="stats-page">
      <div className="flex items-center gap-2.5"><BarChart3 className="h-6 w-6 text-brand-400" /><h1 className="font-display text-2xl font-black text-zinc-50">Analytics</h1></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => <div key={stat.label} className="glass rounded-2xl p-5"><stat.icon className="mb-4 h-5 w-5 text-brand-400" /><div className="font-display text-3xl font-extrabold tabular-nums text-zinc-50">{stat.value}</div><div className="mt-1 text-xs text-zinc-500">{stat.label}</div></div>)}
      </div>
      <section className="glass rounded-3xl p-5 sm:p-7" aria-labelledby="analytics-views-title">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="analytics-views-title" className="text-base font-semibold text-zinc-200">Profile views</h2><p className="mt-1 text-xs text-zinc-500">{activity ? `${Number(activity.total || 0).toLocaleString()} validated views · ${range === "all" ? "all time" : range}` : "Validated visits to your profile"}</p></div><Link to="/!/dashboard" className="text-xs font-semibold text-brand-300 hover:text-brand-200">Dashboard overview →</Link></div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Analytics time range">{RANGES.map(([value, label]) => <button key={value} type="button" aria-pressed={range === value} onClick={() => setRange(value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${range === value ? "border-brand-400/40 bg-brand-500/15 text-brand-100" : "border-white/10 text-zinc-400 hover:text-white"}`}>{label}</button>)}</div>
        {error ? <p role="alert" className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">{error}</p> : !activity ? <div className="mt-5 h-64 animate-pulse rounded-2xl bg-white/[0.03]" aria-label="Loading analytics" /> : activity.days?.length ? <div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activity.days}><defs><linearGradient id="statsViews" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ec4899" stopOpacity={0.36} /><stop offset="100%" stopColor="#ec4899" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="day" stroke="#71717a" fontSize={11} /><Tooltip contentStyle={{ background: "#18141a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} /><Area type="monotone" dataKey="views" stroke="#ec4899" strokeWidth={2} fill="url(#statsViews)" /></AreaChart></ResponsiveContainer></div> : <div className="mt-5 flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 px-5 text-center text-sm text-zinc-500">No validated profile views for this period yet. Share your profile to start collecting analytics.</div>}
        <div className="mt-4 flex flex-wrap gap-2" data-testid="stats-device-breakdown">{activity?.devices?.length ? activity.devices.map((device) => <span key={device.device} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">{device.device}: {device.views}</span>) : activity && <span className="text-xs text-zinc-600">Device breakdown appears when views are recorded.</span>}</div>
        {activity?.week_change && <p className="mt-4 text-xs text-zinc-500">This week: {activity.week_change.current} views ({activity.week_change.delta >= 0 ? "+" : ""}{activity.week_change.delta} vs previous week{activity.week_change.percent === null ? "" : `, ${activity.week_change.percent}%`}).</p>}
      </section>
    </div>
  );
}
