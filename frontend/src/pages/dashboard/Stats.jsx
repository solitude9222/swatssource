import { useAuth } from "@/context/AuthContext";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Eye, Award, Link2, BarChart3, TrendingUp, Clock, MousePointer, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Stats() {
  const { user } = useAuth();
  const views = user.views || 0;
  const rank = user.rank || 0;
  
  // Build a simple 7-day trend from the real total (no backend time-series yet).
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = days.map((d, i) => ({ day: d, views: Math.round((views / 7) * (0.6 + (i / 10))) }));
  
  const stats = [
    { icon: Eye, label: "Total Views", value: views.toLocaleString(), color: "text-blue-400" },
    { icon: Award, label: "Badges", value: (user.badges || []).length, color: "text-amber-400" },
    { icon: Link2, label: "Links", value: (user.profile?.links || []).length, color: "text-green-400" },
    { icon: BarChart3, label: "Widgets", value: (user.profile?.widgets || []).length, color: "text-purple-400" },
  ];

  return (
    <div data-testid="stats-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15">
          <BarChart3 className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-white">Statistics</h1>
          <p className="text-xs text-zinc-500">Your profile performance at a glance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div 
              key={s.label} 
              className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${s.color}`} />
                <TrendingUp className="w-3.5 h-3.5 text-zinc-600" />
              </div>
              <div className="font-display text-3xl font-extrabold tabular-nums text-white">
                {s.value}
              </div>
              <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm font-semibold text-white">Views This Week</div>
            <div className="text-xs text-zinc-500 mt-0.5">Estimated from your total views</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Last 7 days</span>
          </div>
        </div>
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="viewGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b4bffa" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#b4bffa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                stroke="#52525b" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: "#0a0a0c", 
                  border: "1px solid rgba(255,255,255,0.1)", 
                  borderRadius: 12, 
                  color: "#fff",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
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
      </div>

      {/* Quick Info */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 shrink-0">
            <Globe className="w-4 h-4 text-amber-400" />
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
