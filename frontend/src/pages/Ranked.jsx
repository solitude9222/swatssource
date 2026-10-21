import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Eye, BadgeCheck, Crown, Medal, User, Loader2, ChevronLeft, ChevronRight, ChevronDown, ExternalLink, ShieldCheck, Sparkles, Layers } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { api, fileUrl } from "@/lib/api";
import { loadLeaderboardRows } from "@/lib/publicProfiles";
import { BadgeChip } from "@/components/BadgeChip";

const SWAP_MS = 5000;
const SPRING = { type: "spring", stiffness: 120, damping: 24, mass: 0.9 };

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0));
const MEDAL = { 1: "text-amber-300", 2: "text-zinc-300", 3: "text-orange-400" };

const FALLBACK_TIERS = [
  { id: "rookie", name: "Rookie", minViews: 0, color: "#a1a1aa", badge: "rank_rookie", blurb: "Just getting started", stages: [{ stage: 1, name: "Rookie", minViews: 0 }] },
  { id: "bronze", name: "Bronze", minViews: 50, color: "#cd7f32", badge: "rank_bronze", blurb: "A page taking shape", stages: [{ stage: 1, name: "Bronze I", minViews: 50 }, { stage: 2, name: "Bronze II", minViews: 120 }, { stage: 3, name: "Bronze III", minViews: 250 }] },
  { id: "silver", name: "Silver", minViews: 400, color: "#cbd5e1", badge: "rank_silver", blurb: "Filled in and visited", stages: [{ stage: 1, name: "Silver I", minViews: 400 }, { stage: 2, name: "Silver II", minViews: 650 }, { stage: 3, name: "Silver III", minViews: 950 }] },
  { id: "gold", name: "Gold", minViews: 1400, color: "#fbbf24", badge: "rank_gold", blurb: "A page people come back to", stages: [{ stage: 1, name: "Gold I", minViews: 1400 }, { stage: 2, name: "Gold II", minViews: 2000 }, { stage: 3, name: "Gold III", minViews: 2800 }] },
  { id: "platinum", name: "Platinum", minViews: 3800, color: "#22d3ee", badge: "rank_platinum", blurb: "A recognised profile", stages: [{ stage: 1, name: "Platinum I", minViews: 3800 }, { stage: 2, name: "Platinum II", minViews: 5200 }, { stage: 3, name: "Platinum III", minViews: 7000 }] },
  { id: "diamond", name: "Diamond", minViews: 9500, color: "#a855f7", badge: "rank_diamond", blurb: "One of the big pages", stages: [{ stage: 1, name: "Diamond I", minViews: 9500 }, { stage: 2, name: "Diamond II", minViews: 14000 }, { stage: 3, name: "Diamond III", minViews: 20000 }] },
  { id: "master", name: "Master", minViews: 30000, color: "#ec4899", badge: "rank_master", blurb: "Elite creator status", stages: [{ stage: 1, name: "Master I", minViews: 30000 }, { stage: 2, name: "Master II", minViews: 45000 }] },
  { id: "grandmaster", name: "Grandmaster", minViews: 65000, color: "#f43f5e", badge: "rank_grandmaster", blurb: "Apex platform tier", stages: [{ stage: 1, name: "Grandmaster", minViews: 65000 }] },
  { id: "legend", name: "Legend", minViews: 100000, color: "#A48DF4", badge: "rank_legend", blurb: "The top of the site", stages: [{ stage: 1, name: "Legend", minViews: 100000 }] },
];

const seat = (offset) => {
  if (offset === 0) return { x: "0%", scale: 1, opacity: 1, z: 30, blur: 0 };
  if (offset === -1) return { x: "-62%", scale: 0.78, opacity: 0.42, z: 20, blur: 2 };
  if (offset === 1) return { x: "62%", scale: 0.78, opacity: 0.42, z: 20, blur: 2 };
  return { x: offset < 0 ? "-96%" : "96%", scale: 0.62, opacity: 0, z: 0, blur: 4 };
};

const SpotlightCard = ({ user: u, offset, onFocus, onOpen }) => {
  const t = seat(offset);
  const center = offset === 0;
  const stageName = u.stage?.stageName || u.rank_tier?.name || "";
  const stageColor = u.stage?.color || u.rank_tier?.color || "#A48DF4";

  return (
    <motion.div
      initial={false}
      animate={{ x: t.x, scale: t.scale, opacity: t.opacity, filter: `blur(${t.blur}px)` }}
      transition={SPRING}
      style={{ zIndex: t.z, pointerEvents: t.opacity === 0 ? "none" : "auto" }}
      onClick={() => (center ? onOpen(u) : onFocus())}
      data-testid={center ? "ranked-spotlight-center" : `ranked-spotlight-${offset}`}
      data-menu-id="profile"
      data-menu-name={u.username}
      data-menu-href={`/${u.username}`}
      className="absolute left-1/2 top-0 w-[240px] -ml-[120px] cursor-pointer sm:w-[300px] sm:-ml-[150px]"
    >
      <div
        className={`relative h-[310px] overflow-hidden rounded-3xl border bg-[#0b0b0f] transition-shadow duration-300 sm:h-[360px] ${
          center
            ? "border-brand-400/50 shadow-[0_30px_80px_-30px_rgba(164,141,244,0.55)]"
            : "border-white/10 shadow-[0_18px_44px_-24px_rgba(0,0,0,0.95)]"
        }`}
      >
        {u.banner ? (
          <img src={fileUrl(u.banner)} alt="" className="absolute inset-x-0 top-0 h-24 w-full object-cover opacity-70" />
        ) : (
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-brand-600/40 to-brand-950/10" />
        )}
        <span className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent to-[#0b0b0f]" />
        <span className="absolute left-3 top-3 z-10 rounded-lg border border-white/10 bg-black/70 px-2 py-0.5 font-display text-xs font-black text-amber-300 backdrop-blur-sm">
          #{u.rank}
        </span>

        {u.rank_badge && (
          <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-white/10 bg-black/75 px-2 py-0.5 backdrop-blur-sm">
            <BadgeChip id={u.rank_badge} size="sm" glow glowColor={stageColor} />
            {stageName && (
              <span className="text-[10px] font-bold" style={{ color: stageColor }}>
                {stageName}
              </span>
            )}
          </span>
        )}

        <div className="absolute inset-x-0 top-14 flex flex-col items-center px-5 text-center">
          <span className="h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] sm:h-20 sm:w-20">
            {u.avatar ? (
              <img src={fileUrl(u.avatar)} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-zinc-500"><User className="h-7 w-7" /></span>
            )}
          </span>
          <div className="mt-3 flex max-w-full items-center gap-1.5">
            <span className="truncate font-display text-base font-black text-zinc-50 sm:text-lg">{u.display_name || u.username}</span>
            {u.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-400" />}
          </div>
          <span className="truncate font-mono2 text-[11px] text-zinc-500">tourn.lol/{u.username}</span>
          {u.bio && <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">{u.bio}</p>}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-white/5 bg-black/40 px-4 py-3">
          <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-zinc-100">
            <Eye className="h-3.5 w-3.5 text-brand-400" /> {fmt(u.views)}
          </span>
          {center ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Open <ExternalLink className="h-3 w-3" />
            </span>
          ) : (
            <span className="font-mono2 text-[10px] uppercase tracking-wider text-zinc-500">{u.tier === "premium" ? "Pro" : "Free"}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Spotlight = ({ items, onOpen }) => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;

  useEffect(() => { if (active >= n) setActive(0); }, [n, active]);

  useEffect(() => {
    if (paused || n < 2) return undefined;
    const t = setInterval(() => setActive((a) => (a + 1) % n), SWAP_MS);
    return () => clearInterval(t);
  }, [paused, n]);

  const offsetOf = (i) => {
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  if (!n) return null;

  return (
    <div className="relative">
      <div
        className="relative mx-auto h-[330px] max-w-3xl sm:h-[380px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        data-testid="ranked-spotlight"
      >
        {items.map((u, i) => (
          <SpotlightCard key={u.id} user={u} offset={offsetOf(i)} onFocus={() => setActive(i)} onOpen={onOpen} />
        ))}
      </div>
      {n > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setActive((a) => (a - 1 + n) % n)}
            aria-label="Previous profile"
            data-testid="ranked-prev"
            className="rounded-full border border-white/10 glass p-2 text-zinc-300 transition hover:border-brand-500/50 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {items.map((u, i) => (
              <button
                key={u.id}
                onClick={() => setActive(i)}
                aria-label={`Show ${u.username}`}
                data-testid={`ranked-dot-${i}`}
                className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-brand-500" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
              />
            ))}
          </div>
          <button
            onClick={() => setActive((a) => (a + 1) % n)}
            aria-label="Next profile"
            data-testid="ranked-next"
            className="rounded-full border border-white/10 glass p-2 text-zinc-300 transition hover:border-brand-500/50 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const Row = ({ u, onOpen }) => {
  const stageName = u.stage?.stageName || u.rank_tier?.name || "";
  const stageColor = u.stage?.color || u.rank_tier?.color || "#A48DF4";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`ranked-row-${u.username}`}
      data-menu-id="profile"
      data-menu-name={u.username}
      data-menu-href={`/${u.username}`}
      onClick={() => onOpen(u)}
      className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 sm:px-5 ${
        u.rank <= 3 ? "border-brand-500/30 bg-brand-500/[0.04]" : "border-white/5 glass hover:border-brand-500/30"
      }`}
    >
      <div className={`w-9 shrink-0 text-center font-display text-lg font-black ${MEDAL[u.rank] || "text-zinc-500"}`}>
        {u.rank <= 3 ? <Medal className={`mx-auto h-5 w-5 ${MEDAL[u.rank]}`} /> : u.rank}
      </div>
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 glass-strong text-zinc-400">
        {u.avatar ? <img src={fileUrl(u.avatar)} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="truncate font-semibold text-zinc-100 transition group-hover:text-brand-300">{u.display_name}</span>
          {u.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-400" />}
          {u.rank_badge && (
            <BadgeChip id={u.rank_badge} size="sm" glow glowColor={stageColor} />
          )}
          {stageName && (
            <span
              className="rounded-full px-2 py-0.5 font-mono2 text-[10px] font-bold border"
              style={{
                borderColor: `${stageColor}35`,
                backgroundColor: `${stageColor}15`,
                color: stageColor,
              }}
            >
              {stageName}
            </span>
          )}
          {u.tier === "premium" && <span className="rounded bg-brand-500/15 px-1.5 py-0.5 font-mono2 text-[10px] text-brand-300">PRO</span>}
        </div>
        <div className="truncate font-mono2 text-xs text-zinc-500">tourn.lol/{u.username}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="inline-flex items-center gap-1.5 font-display font-bold text-zinc-100">
          <Eye className="h-4 w-4 text-brand-400" /> {fmt(u.views)}
        </div>
        <div className="text-[11px] text-zinc-500">views</div>
      </div>
    </motion.button>
  );
};

export default function Ranked() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState(FALLBACK_TIERS);
  const [showLadder, setShowLadder] = useState(false);

  useEffect(() => {
    let alive = true;
    const finish = (list) => {
      if (!alive) return;
      setItems(list);
      setLoading(false);
    };

    api.get("/ranked", { params: { limit: 100 } })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        return list.length ? list : loadLeaderboardRows(100);
      })
      .catch(() => loadLeaderboardRows(100).catch(() => []))
      .then(finish)
      .catch(() => finish([]));

    // Fetch ranked tier ladder configuration
    api.get("/ranked/tiers")
      .then(({ data }) => {
        if (alive && data?.tiers && Array.isArray(data.tiers)) {
          setTiers(data.tiers);
        }
      })
      .catch(() => {});

    return () => { alive = false; };
  }, []);

  const spotlit = useMemo(() => items.slice(0, 7), [items]);
  const open = (u) => navigate(`/${encodeURIComponent(u.username)}`);

  return (
    <div className="min-h-screen sw-page-bg text-zinc-100 grain" data-testid="ranked-page">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-20 pt-32">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 font-mono2 text-xs text-amber-300">
            <Trophy className="h-3.5 w-3.5" /> Global ranking
          </div>
          <h1 className="mt-4 font-display text-4xl font-black text-zinc-50 sm:text-5xl">Leaderboard</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-500">
            Every page ranked by real, validated profile views. Climb the stages from Rookie to Legend and unlock prestigious ranked badges.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowLadder((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 glass px-3.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-brand-500/40 hover:text-white"
            >
              <Layers className="h-3.5 w-3.5 text-brand-400" />
              {showLadder ? "Hide Ranked Ladder" : "View Ranked Stages & Badges"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showLadder ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Expandable Ranked Tier Ladder */}
        <AnimatePresence>
          {showLadder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-10"
            >
              <div className="rounded-3xl border border-white/10 glass-strong p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <h3 className="font-display text-base font-bold text-zinc-100">Ranked Progression Ladder</h3>
                  </div>
                  <span className="font-mono2 text-[11px] text-zinc-500">Measured by verified profile views</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {tiers.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 transition hover:border-white/15"
                      style={{ borderLeft: `3px solid ${t.color}` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {t.badge && <BadgeChip id={t.badge} size="sm" glow glowColor={t.color} />}
                          <span className="font-display text-sm font-bold" style={{ color: t.color }}>
                            {t.name}
                          </span>
                        </div>
                        <span className="font-mono2 text-[10px] text-zinc-400 font-semibold">
                          {Number(t.minViews || 0).toLocaleString()} views
                        </span>
                      </div>
                      {t.blurb && <p className="mt-1 text-[11px] text-zinc-500 line-clamp-1">{t.blurb}</p>}

                      {Array.isArray(t.stages) && t.stages.length > 1 && (
                        <div className="mt-2.5 flex flex-wrap gap-1 border-t border-white/5 pt-2">
                          {t.stages.map((st) => (
                            <span
                              key={st.stage}
                              className="rounded px-1.5 py-0.5 font-mono2 text-[9px] text-zinc-300 border border-white/5 bg-black/30"
                              title={`${Number(st.minViews || 0).toLocaleString()} views needed`}
                            >
                              {st.name} <span className="text-zinc-500">({fmt(st.minViews)})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand-400" /></div>
        ) : items.length === 0 ? (
          <div data-testid="ranked-empty" className="py-20 text-center text-zinc-500">
            <Crown className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">No ranked pages yet â€” claim a handle and start climbing.</p>
          </div>
        ) : (
          <>
            <Spotlight items={spotlit} onOpen={open} />

            <div className="mt-12 mb-3 flex items-end justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-zinc-100">
                <span className="h-5 w-1 rounded-full bg-gradient-to-b from-brand-400 to-brand-600" />
                Full ranking
              </h2>
              <span className="font-mono2 text-[10px] uppercase tracking-wider text-zinc-600">{items.length} pages</span>
            </div>

            <div data-testid="ranked-list" className="space-y-2">
              {items.map((u) => <Row key={u.id} u={u} onOpen={open} />)}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
