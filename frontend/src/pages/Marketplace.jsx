import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search, Sparkles, Tag, ArrowRight, Check, Play, Pause, ExternalLink,
  Crown, Star, ShoppingBag, Palette, Music, MousePointer, ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { toast } from "sonner";

const MARKETPLACE_ITEMS = [
  {
    id: "neon-cyberpunk",
    title: "Neon Cyberpunk 2099",
    category: "templates",
    author: "solitude",
    price: "Free",
    badge: "Trending",
    icon: Palette,
    color: "#06b6d4",
    desc: "Futuristic dark glass styling with cyan neon border glow and scanlines overlay.",
    tags: ["Neon", "Dark", "Glassmorphism"],
    installs: 1420,
    previewBg: "linear-gradient(135deg, #090d16 0%, #032b30 50%, #080a10 100%)",
  },
  {
    id: "velvet-night",
    title: "Velvet Nightfall",
    category: "templates",
    author: "swats",
    price: "Premium",
    badge: "Staff Pick",
    icon: Palette,
    color: "#a855f7",
    desc: "Sleek velvet purple aesthetic with frosted cards and luxury gold typography accents.",
    tags: ["Velvet", "Purple", "Luxury"],
    installs: 980,
    previewBg: "linear-gradient(135deg, #10061c 0%, #290940 50%, #0a0312 100%)",
  },
  {
    id: "ghost-trickle-rain",
    title: "Window Ghost Rain FX",
    category: "overlays",
    author: "core",
    price: "Free",
    badge: "New",
    icon: Sparkles,
    color: "#60a5fa",
    desc: "Authentic condensation trickle rain overlay taken directly from ghost.html.",
    tags: ["Rain", "Atmosphere", "Shader"],
    installs: 2150,
    previewBg: "linear-gradient(135deg, #0c1222 0%, #172554 50%, #030712 100%)",
  },
  {
    id: "y2k-aesthetic",
    title: "Y2K Dreamscape",
    category: "templates",
    author: "pastel",
    price: "Free",
    badge: "Popular",
    icon: Palette,
    color: "#ec4899",
    desc: "2000s chrome & pastel pink nostalgia with subtle stars overlay and bubble buttons.",
    tags: ["Y2K", "Pink", "Retro"],
    installs: 890,
    previewBg: "linear-gradient(135deg, #1f0814 0%, #3e0c26 50%, #0c0208 100%)",
  },
  {
    id: "katana-cursor",
    title: "Cyber Katana Cursor",
    category: "cursors",
    author: "blade",
    price: "Free",
    badge: "Top Cursor",
    icon: MousePointer,
    color: "#10b981",
    desc: "Ultra-sharp 60fps emerald cursor pointer with subtle particle motion trail.",
    tags: ["Cursor", "60fps", "Emerald"],
    installs: 3400,
    previewBg: "linear-gradient(135deg, #061712 0%, #043825 50%, #020b08 100%)",
  },
  {
    id: "lofi-rain-audio",
    title: "Midnight Chillhop Session",
    category: "audio",
    author: "beats",
    price: "Free",
    badge: "Top Track",
    icon: Music,
    color: "#f59e0b",
    desc: "Relaxing ambient lo-fi hip hop beat with soft vinyl crackle, perfect for profile audio.",
    tags: ["Lofi", "Chill", "Profile Music"],
    installs: 4120,
    previewBg: "linear-gradient(135deg, #1c1306 0%, #3a2203 50%, #0e0902 100%)",
  },
  {
    id: "exclusive-donor-badge",
    title: "Celestial Supporter Badge",
    category: "badges",
    author: "swats.bio",
    price: "Premium",
    badge: "Exclusive",
    icon: ShieldCheck,
    color: "#eab308",
    desc: "Gilded holographic profile badge with animated flare shimmer and hover tooltip.",
    tags: ["Badge", "Gilded", "Hologram"],
    installs: 620,
    previewBg: "linear-gradient(135deg, #1a1606 0%, #3b2c05 50%, #0b0902 100%)",
  },
  {
    id: "minimal-stealth",
    title: "Monochrome Stealth",
    category: "templates",
    author: "vesk",
    price: "Free",
    badge: "Minimal",
    icon: Palette,
    color: "#ffffff",
    desc: "Clean matte obsidian cards with zero border distraction and high readability.",
    tags: ["Minimal", "Monochrome", "Clean"],
    installs: 1650,
    previewBg: "linear-gradient(135deg, #0f0f11 0%, #1e1e24 50%, #070708 100%)",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "templates", label: "Templates & Themes" },
  { id: "overlays", label: "Effects & Overlays" },
  { id: "cursors", label: "Cursors" },
  { id: "audio", label: "Audio & Music" },
  { id: "badges", label: "Badges" },
];

export default function Marketplace() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [installed, setInstalled] = useState({});

  const filtered = useMemo(() => {
    return MARKETPLACE_ITEMS.filter((item) => {
      const matchCat = category === "all" || item.category === category;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [category, search]);

  const handleInstall = (item) => {
    setInstalled((prev) => ({ ...prev, [item.id]: true }));
    toast.success(`"${item.title}" added to your account! Available in your dashboard.`);
  };

  return (
    <div className="min-h-screen sw-page-bg text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Header Hero */}
        <div className="relative rounded-3xl p-8 sm:p-12 mb-10 overflow-hidden border border-white/10 glass bg-gradient-to-br from-brand-500/10 via-brand-600/5 to-transparent">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-xs font-semibold text-brand-300 mb-4">
              <ShoppingBag className="w-3.5 h-3.5" /> Community Marketplace
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-white mb-4">
              Explore presets, themes, & <span className="text-brand-400">visual assets</span>
            </h1>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6">
              Level up your profile with community themes, curated cursor sprites, atmospheric rain overlays, and audio presets.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/!/dashboard/templates"
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition shadow-lg flex items-center gap-2"
              >
                <span>Browse dashboard templates</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/!/dashboard/shop"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition"
              >
                Visit perk shop
              </Link>
            </div>
          </div>
          <div className="absolute right-6 -bottom-10 opacity-15 pointer-events-none hidden md:block">
            <ShoppingBag className="w-72 h-72 text-brand-400" />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  category === c.id
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                    : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search marketplace..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500/50"
            />
          </div>
        </div>

        {/* Grid of items */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/[0.02]">
            <Search className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
            <div className="text-sm font-bold text-zinc-300">No items found</div>
            <div className="text-xs text-zinc-500 mt-1">Try refining your search keyword or selected category.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item) => {
              const isInst = !!installed[item.id];
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden flex flex-col transition hover:border-white/20 hover:-translate-y-1 duration-200 group"
                >
                  {/* Preview Banner */}
                  <div
                    className="h-32 w-full relative p-4 flex flex-col justify-between"
                    style={{ background: item.previewBg }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/15">
                        {item.badge}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{
                          backgroundColor: item.price === "Free" ? "rgba(34,197,94,0.2)" : "rgba(168,85,247,0.2)",
                          color: item.price === "Free" ? "#4ade80" : "#c084fc",
                        }}
                      >
                        {item.price}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/50 border border-white/10 text-white shadow-sm"
                        style={{ color: item.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-mono2 text-zinc-300">by @{item.author}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 font-mono2">
                        {item.installs.toLocaleString()} uses
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInstall(item)}
                        disabled={isInst}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          isInst
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        }`}
                      >
                        {isInst ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Added</span>
                          </>
                        ) : (
                          <span>Get {item.price === "Free" ? "Free" : "Perk"}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
