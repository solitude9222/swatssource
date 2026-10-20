import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy, Eye, Award, Check, RefreshCw, SlidersHorizontal, Search,
  User, Save, Sparkles, Layers, ArrowRight, ShieldAlert, CheckCircle2,
} from "lucide-react";
import { api, fileUrl } from "@/lib/api";
import { toast } from "sonner";
import { BadgeChip } from "@/components/BadgeChip";

export default function RankedManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [settings, setSettings] = useState(null);
  const [overview, setOverview] = useState(null);

  // Override tool state
  const [targetUsername, setTargetUsername] = useState("");
  const [bonusViews, setBonusViews] = useState("");
  const [exactViews, setExactViews] = useState("");
  const [overriding, setOverriding] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settRes, overRes] = await Promise.all([
        api.get("/admin/ranked/settings"),
        api.get("/admin/ranked/overview"),
      ]);
      setSettings(settRes.data);
      setOverview(overRes.data);
    } catch (err) {
      toast.error("Failed to load ranked manager data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/admin/ranked/settings", settings);
      setSettings(data);
      toast.success("Ranked system settings saved successfully!");
      // Reload overview to reflect stage changes
      const overRes = await api.get("/admin/ranked/overview");
      setOverview(overRes.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    if (!window.confirm("Recalculate ranks and sync badges for ALL users in database?")) return;
    setRecalculating(true);
    try {
      const { data } = await api.post("/admin/ranked/recalculate");
      toast.success(`Successfully recalculated ranks and synced badges for ${data.count} users!`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to recalculate ranks");
    } finally {
      setRecalculating(false);
    }
  };

  const handleUserOverride = async (e) => {
    e.preventDefault();
    if (!targetUsername.trim()) {
      toast.error("Please enter a username");
      return;
    }
    setOverriding(true);
    try {
      // Find user ID from overview or lookup
      const found = overview?.topUsers?.find(
        (u) => u.username.toLowerCase() === targetUsername.trim().toLowerCase()
      );

      let targetUserId = found?.id;
      if (!targetUserId) {
        // Fetch via public alias
        const uRes = await api.get(`/u/${encodeURIComponent(targetUsername.trim())}`);
        targetUserId = uRes.data?.user?.id;
      }

      if (!targetUserId) {
        toast.error("User not found");
        return;
      }

      const payload = { user_id: targetUserId };
      if (exactViews !== "") {
        payload.set_views = parseInt(exactViews, 10);
      } else if (bonusViews !== "") {
        payload.bonus_views = parseInt(bonusViews, 10);
      } else {
        toast.error("Provide bonus views or exact views to set");
        return;
      }

      const { data } = await api.post("/admin/ranked/override", payload);
      toast.success(`Updated ${targetUsername}: now ${data.views.toLocaleString()} views (${data.stage.stageName})`);
      setBonusViews("");
      setExactViews("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update user");
    } finally {
      setOverriding(false);
    }
  };

  const updateStageViews = (tierIndex, stageIndex, newMinViews) => {
    const updated = { ...settings };
    const newViews = parseInt(newMinViews, 10) || 0;
    updated.tiers[tierIndex].stages[stageIndex].minViews = newViews;
    if (stageIndex === 0) {
      updated.tiers[tierIndex].minViews = newViews;
    }
    setSettings(updated);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-white/10 glass bg-gradient-to-r from-amber-600/15 via-brand-600/15 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200 mb-3 backdrop-blur">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Competitive Rank System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
            Ranked Tiers &amp; Stages Manager
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Configure view milestones, stage divisions, and automatic rank badge awards. Track user ranking distribution across the platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={recalculating}
            onClick={handleRecalculate}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white border border-white/10 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin text-amber-400" : ""}`} />
            <span>{recalculating ? "Recalculating..." : "Sync All Badges"}</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveSettings}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:brightness-110 text-xs font-semibold text-white transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* Global Controls & Breakdown Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="text-[10px] uppercase font-mono2 text-zinc-500 tracking-wider">Total Ranked Accounts</div>
          <div className="text-2xl font-black font-display text-zinc-50 mt-1">
            {overview?.totalUsers?.toLocaleString() || 0}
          </div>
        </div>

        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="text-[10px] uppercase font-mono2 text-zinc-500 tracking-wider">System Status</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-zinc-200">Active (Views Engine)</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 border border-white/10 md:col-span-2 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-200">Auto-Grant Rank Badges</div>
            <div className="text-[11px] text-zinc-500">Automatically equip badge as views reach milestones</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={!!settings.auto_grant_badges}
              onChange={(e) => setSettings({ ...settings, auto_grant_badges: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
          </label>
        </div>
      </div>

      {/* Tier Distribution Bar */}
      {overview?.breakdown && (
        <div className="glass rounded-3xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
            <span>Tier Distribution Breakdown</span>
            <span className="text-zinc-500 font-mono2 text-[11px]">{overview.tiers?.length} Tiers Active</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2">
            {overview.tiers?.map((t) => {
              const count = overview.breakdown[t.id]?.count || 0;
              return (
                <div key={t.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
                  <div className="flex justify-center mb-1">
                    <BadgeChip id={t.badge} size={22} />
                  </div>
                  <div className="font-bold text-xs truncate" style={{ color: t.color }}>{t.name}</div>
                  <div className="font-mono2 text-[10px] text-zinc-400 mt-0.5">{count} users</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranked Tiers & Stages Configuration Ladder */}
      <div className="glass rounded-3xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Rank Stages &amp; Required Views</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Adjust minimum view thresholds for each stage. Higher rank tiers grant the corresponding rank badge.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {settings.tiers?.map((tier, tIdx) => (
            <div
              key={tier.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-white/20"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <BadgeChip id={tier.badge} size={28} />
                  <div>
                    <span className="font-display font-black text-sm sm:text-base" style={{ color: tier.color }}>
                      {tier.name}
                    </span>
                    <span className="ml-2 font-mono2 text-xs text-zinc-500">
                      (Badge: <code className="text-zinc-300 font-bold">{tier.badge}</code>)
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 font-mono2">
                  Min Tier Views: <span className="text-white font-bold">{tier.minViews?.toLocaleString() || 0}</span>
                </div>
              </div>

              {/* Stages List */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tier.stages?.map((stage, sIdx) => (
                  <div key={sIdx} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-zinc-200">{stage.name}</div>
                      <div className="text-[10px] text-zinc-500">Stage #{stage.stage}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={stage.minViews}
                        onChange={(e) => updateStageViews(tIdx, sIdx, e.target.value)}
                        className="w-24 rounded-lg bg-black/60 border border-white/10 px-2 py-1 text-xs text-right font-mono2 text-amber-300 outline-none focus:border-brand-400"
                      />
                      <span className="text-[10px] text-zinc-500">views</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Rank Override Utility */}
      <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-400" />
          <span>User Rank &amp; Views Override</span>
        </h2>
        <p className="text-xs text-zinc-400">
          Directly modify views or grant bonus views to instantly update any creator's rank stage and badge.
        </p>

        <form onSubmit={handleUserOverride} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-[10px] uppercase font-mono2 text-zinc-500 mb-1">Username</label>
            <input
              type="text"
              placeholder="e.g. solitude"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-brand-400"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono2 text-zinc-500 mb-1">Add Bonus Views</label>
            <input
              type="number"
              placeholder="+500"
              value={bonusViews}
              onChange={(e) => {
                setBonusViews(e.target.value);
                setExactViews("");
              }}
              className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-brand-400"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono2 text-zinc-500 mb-1">Or Set Exact Views</label>
            <input
              type="number"
              placeholder="e.g. 10000"
              value={exactViews}
              onChange={(e) => {
                setExactViews(e.target.value);
                setBonusViews("");
              }}
              className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-brand-400"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={overriding}
              className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
            >
              {overriding ? "Updating..." : "Apply Override"}
            </button>
          </div>
        </form>
      </div>

      {/* Top Ranked Overview Table */}
      {overview?.topUsers?.length > 0 && (
        <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Top Platform Creators &amp; Stages</span>
            </div>
            <Link
              to="/!/ranked"
              className="text-xs font-semibold text-brand-300 hover:text-brand-200 flex items-center gap-1"
            >
              <span>Public Ranked Ladder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </h2>

          <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden bg-black/20">
            {overview.topUsers.slice(0, 15).map((u) => (
              <div key={u.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02]">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 text-center font-display font-black text-xs text-zinc-500">#{u.rank}</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                    {u.avatar ? (
                      <img src={fileUrl(u.avatar)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-600">
                        {u.username[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="text-xs font-bold text-zinc-200 truncate">{u.display_name}</div>
                    <div className="text-[10px] font-mono2 text-zinc-500 truncate">@{u.username}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <BadgeChip id={u.rank_badge} size={22} />
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full border border-white/10 bg-white/5"
                      style={{ color: u.rank_tier?.color }}
                    >
                      {u.stage?.stageName || u.rank_tier?.name}
                    </span>
                  </div>
                  <div className="text-right w-24">
                    <div className="text-xs font-mono2 font-bold text-zinc-200">{u.views.toLocaleString()}</div>
                    <div className="text-[10px] text-zinc-500">views</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
