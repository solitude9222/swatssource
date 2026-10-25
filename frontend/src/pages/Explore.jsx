import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search, Eye, BadgeCheck, ExternalLink, Link2, User, Loader2,
  Sparkles, Compass, ShieldCheck, Flame, X
} from "lucide-react";
import { FaDiscord, FaSpotify, FaGithub } from "react-icons/fa6";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { api, fileUrl, profileUrl } from "@/lib/api";
import { filterProfiles, loadLeaderboardRows } from "@/lib/publicProfiles";
import { toast } from "sonner";

const TIERS = [
  { key: "", label: "All Profiles" },
  { key: "premium", label: "PRO Creators" },
  { key: "free", label: "Free Tier" },
];

const BADGES = [
  { key: "", label: "Any Badge" },
  { key: "verified", label: "Verified" },
  { key: "og", label: "OG Member" },
  { key: "media", label: "Media Creator" },
];

const fmt = (n) => {
  const num = Number(n) || 0;
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : String(num);
};

/* 3D Interactive Tilt & Spin Profile Card with Specular Glare */
const ProfileCard3D = ({ u, onOpen, isFlowItem = false }) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const reduce = useReducedMotion();

  const handlePointerMove = (e) => {
    if (reduce || !cardRef.current) return;
    const box = cardRef.current.getBoundingClientRect();
    if (!box) return;

    const px = (e.clientX - box.left) / box.width - 0.5;
    const py = (e.clientY - box.top) / box.height - 0.5;

    // Interactive 3D tilt with spin dynamics
    const rotX = -py * 16;
    const rotY = px * 18;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;

    if (glareRef.current) {
      const gx = ((e.clientX - box.left) / box.width) * 100;
      const gy = ((e.clientY - box.top) / box.height) * 100;
      glareRef.current.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)`;
      glareRef.current.style.opacity = "1";
    }
  };

  const handlePointerLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = "0";
    }
  };

  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(profileUrl(u.username));
    toast.success("Profile link copied to clipboard");
  };

  const isPro = u.tier === "premium";
  const avatarSrc = u.avatar ? fileUrl(u.avatar) : (u.avatar_url ? fileUrl(u.avatar_url) : "");
  const bannerSrc = u.banner ? fileUrl(u.banner) : (u.banner_url ? fileUrl(u.banner_url) : "");

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-testid={`explore-card-${u.username}`}
      data-menu-id="profile"
      data-menu-name={u.username}
      data-menu-href={`/${u.username}`}
      onClick={() => onOpen(u)}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
      }}
      className={`group relative rounded-3xl overflow-hidden cursor-pointer select-none border border-white/10 bg-gradient-to-b from-[#12131c] via-[#0c0d14] to-black shadow-[0_12px_36px_rgba(0,0,0,0.65)] hover:border-brand-400/40 hover:shadow-[0_20px_50px_rgba(180,191,250,0.16)] ${
        isFlowItem ? "w-[280px] sm:w-[320px] shrink-0" : "w-full"
      }`}
    >
      {/* Specular glare overlay */}
      <span
        ref={glareRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 rounded-3xl opacity-0 transition-opacity duration-300"
      />

      {/* Ambient colorful banner glow */}
      <div
        className="pointer-events-none absolute -top-12 inset-x-0 h-36 opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
        style={{
          background: isPro
            ? "radial-gradient(circle at 50% 0%, #b4bffa, transparent 70%)"
            : "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.2), transparent 70%)",
        }}
      />

      {/* Top Banner Graphic */}
      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-brand-900/40 via-zinc-900 to-black/80">
        {bannerSrc ? (
          <img
            src={bannerSrc}
            alt=""
            className="w-full h-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-108"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-brand-950/60 via-zinc-900 to-brand-900/30 flex items-center justify-center opacity-70">
            <Sparkles className="w-8 h-8 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d14] via-transparent to-black/30" />

        {/* Tier badge chip */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {isPro && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-brand-500/25 to-purple-500/25 border border-brand-400/40 text-[10px] font-mono2 font-bold uppercase tracking-wider text-brand-200 shadow-[0_0_12px_rgba(180,191,250,0.3)] backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-brand-300" />
              <span>PRO</span>
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] font-mono2 text-zinc-400 backdrop-blur-md">
            <Eye className="w-3 h-3" />
            <span>{fmt(u.views)}</span>
          </span>
        </div>
      </div>

      {/* Profile Body with 3D Depth Layering */}
      <div
        className="px-5 pb-5 -mt-10 relative z-10"
        style={{ transform: "translateZ(30px)" }}
      >
        <div className="flex items-end justify-between">
          {/* Avatar with Cybernetic Glow Ring */}
          <div className="relative">
            <div className="w-18 h-18 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-white/20 p-0.5 shadow-2xl ring-4 ring-[#0c0d14] group-hover:border-brand-400/60 transition-colors duration-300">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={u.display_name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            {/* Online / Active status pulse */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0c0d14] shadow-[0_0_8px_#34d399]" />
          </div>

          {/* Mini preview social badges */}
          <div className="flex items-center gap-1.5 pb-1">
            <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition">
              <FaDiscord className="w-3 h-3 text-[#5865F2]" />
            </span>
            <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition">
              <FaSpotify className="w-3 h-3 text-[#1DB954]" />
            </span>
          </div>
        </div>

        {/* Display name & verified badge */}
        <div className="mt-3.5">
          <div className="flex items-center gap-1.5 truncate">
            <h3 className="font-display font-black text-base text-zinc-100 group-hover:text-white truncate tracking-tight transition-colors">
              {u.display_name || u.username}
            </h3>
            {u.verified && (
              <BadgeCheck className="w-4 h-4 text-brand-400 shrink-0 drop-shadow-[0_0_6px_rgba(180,191,250,0.5)]" />
            )}
          </div>
          <p className="text-xs font-mono2 text-brand-400/80 truncate mt-0.5">
            tourn.lol/{u.username}
          </p>
        </div>

        {/* Bio summary */}
        <p className="mt-2.5 text-xs text-zinc-400/90 line-clamp-2 leading-relaxed min-h-[32px]">
          {u.bio || "Crafting digital experiences and bio identities with tourn.lol."}
        </p>

        {/* Contextual Action Buttons */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex items-center gap-2">
          <button
            type="button"
            data-testid={`explore-view-${u.username}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(u);
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:brightness-110 active:scale-95 transition shadow-sm cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Profile</span>
          </button>
          <button
            type="button"
            data-testid={`explore-copy-${u.username}`}
            onClick={copy}
            className="inline-flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 transition active:scale-95 cursor-pointer"
            title="Copy Profile URL"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Explore() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [badge, setBadge] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load profiles from backend or fallback to leaderboard rows
  const load = useCallback(async () => {
    setLoading(true);
    let list = [];
    try {
      const { data } = await api.get("/explore", {
        params: { q: q.trim(), tier, badge, limit: 60 },
      });
      list = Array.isArray(data) ? data : [];
    } catch {
      list = [];
    }

    if (!list.length) {
      try {
        list = filterProfiles(await loadLeaderboardRows(60), { q, tier, badge });
      } catch {
        list = [];
      }
    }
    setItems(list);
    setLoading(false);
  }, [q, tier, badge]);

  useEffect(() => {
    const t = setTimeout(load, 280);
    return () => clearTimeout(t);
  }, [load]);

  const open = (u) => navigate(`/${encodeURIComponent(u.username)}`);

  // Featured marquee cards for 3D continuous flowing stream
  const flowItems = useMemo(() => {
    if (!items.length) return [];
    return [...items.slice(0, 8), ...items.slice(0, 8)];
  }, [items]);

  return (
    <div className="min-h-screen sw-page-bg text-zinc-100 grain overflow-x-hidden" data-testid="explore-page">
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-24">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-200 mb-4 backdrop-blur shadow-sm">
            <Compass className="w-3.5 h-3.5 text-brand-400" />
            <span>Community Discovery Engine</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black text-zinc-50 tracking-tight leading-tight">
            Explore Creators
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Discover verified creators, custom themes, and digital identities across tourn.lol.
          </p>
        </div>

        {/* 3D Flowing Marquee Carousel ("cards flow along") */}
        {flowItems.length > 0 && (
          <section className="mb-16 relative">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono2">
                  Featured Creators Flow
                </span>
              </div>
              <span className="text-[11px] font-mono2 text-zinc-500">
                Hover to inspect · 3D Interactive
              </span>
            </div>

            {/* Angled 3D Perspective Track */}
            <div
              className="relative overflow-hidden py-4 -mx-4 px-4 mask-radial"
              style={{
                perspective: "1200px",
              }}
            >
              {/* Fade out masks on sides */}
              <div className="pointer-events-none absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-[#0c0d14] to-transparent z-20" />
              <div className="pointer-events-none absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-[#0c0d14] to-transparent z-20" />

              <div
                className="flex gap-6 animate-marquee hover:[animation-play-state:paused]"
                style={{
                  transform: "rotateX(8deg)",
                  transformStyle: "preserve-3d",
                }}
              >
                {flowItems.map((u, idx) => (
                  <ProfileCard3D
                    key={`flow-${u.username}-${idx}`}
                    u={u}
                    onOpen={open}
                    isFlowItem
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Search & Filter Controls (No sorting dropdowns/buttons) */}
        <div className="glass-strong rounded-3xl p-4 sm:p-5 border border-white/10 mb-10 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 glass rounded-2xl flex items-center px-4 py-3 border border-white/10 focus-within:border-brand-400/50 transition">
              <Search className="w-4 h-4 text-zinc-400 mr-3 shrink-0" />
              <input
                data-testid="explore-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search creators by username, display name or bio…"
                className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder-zinc-500"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tier Filters */}
            <div className="flex items-center gap-1.5 glass rounded-2xl p-1 border border-white/10 overflow-x-auto">
              {TIERS.map((t) => {
                const active = tier === t.key;
                return (
                  <button
                    key={t.key || "all"}
                    type="button"
                    data-testid={`explore-tier-${t.key || "all"}`}
                    onClick={() => setTier(t.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? "bg-brand-500 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badges Filter Row */}
          <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono2 text-[10px] uppercase tracking-widest text-zinc-500 mr-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" /> Filter:
              </span>
              {BADGES.map((b) => {
                const active = badge === b.key;
                return (
                  <button
                    key={b.key || "any"}
                    type="button"
                    data-testid={`explore-badge-${b.key || "any"}`}
                    onClick={() => setBadge(b.key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      active
                        ? "bg-brand-500/20 border-brand-400/50 text-brand-200 shadow-sm"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>

            <div className="font-mono2 text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
              <span>{items.length} {items.length === 1 ? "Creator" : "Creators"} Found</span>
            </div>
          </div>
        </div>

        {/* 3D Profile Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <span className="text-xs font-mono2 text-zinc-500 tracking-wider uppercase">Loading Creators…</span>
          </div>
        ) : items.length === 0 ? (
          <div
            data-testid="explore-empty"
            className="text-center py-24 rounded-3xl glass border border-white/10 max-w-lg mx-auto"
          >
            <User className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
            <h3 className="text-base font-bold text-zinc-200">No profiles found</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Try adjusting your search query or removing active filters.
            </p>
          </div>
        ) : (
          <div
            data-testid="explore-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {items.map((u) => (
              <ProfileCard3D
                key={u.id || u.username}
                u={u}
                onOpen={open}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
