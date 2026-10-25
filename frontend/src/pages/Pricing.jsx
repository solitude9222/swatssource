import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  Check, Crown, ExternalLink, Heart, Loader2, Minus, Sparkles, Zap,
  ShieldCheck, Eye, BadgeCheck, Flame, Link2, User, Video, Layers,
  Palette, Code2, BarChart3, MousePointer, FolderLock, Infinity as InfinityIcon
} from "lucide-react";
import { FaDiscord, FaSpotify, FaGithub, FaSoundcloud, FaTiktok, FaSteam } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { api, fileUrl, profileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import { FREE_PERKS as FREE, PREMIUM_PERKS as PREMIUM, PREMIUM_PRICE } from "@/constants/plans";
import { loadLeaderboardRows } from "@/lib/publicProfiles";

const fmt = (n) => {
  const num = Number(n) || 0;
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : String(num);
};

/* Curated Fallback Premium Creators to guarantee a rich flow if backend is offline */
const FALLBACK_PREMIUM_CREATORS = [
  {
    username: "welovekoni",
    display_name: "ØG køni",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    bio: "Obsidian visual architect. Custom widgets, dark aesthetics & 3D card physics.",
    views: 148500,
    verified: true,
    tier: "premium",
    badges: ["verified", "og", "media"],
  },
  {
    username: "bondages",
    display_name: "goreshyt",
    avatar: "https://i1.sndcdn.com/avatars-P5eC0qmzsl2LVQtY-deRPow-t500x500.jpg",
    banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    bio: "SoundCloud soundscapes, breakcore producer, verified audio creator.",
    views: 92400,
    verified: true,
    tier: "premium",
    badges: ["verified", "media"],
  },
  {
    username: "solitude",
    display_name: "Solitude",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80",
    bio: "Full stack digital designer crafting bespoke bio pages for tourn.lol creators.",
    views: 64100,
    verified: true,
    tier: "premium",
    badges: ["verified", "og"],
  },
  {
    username: "phantom",
    display_name: "Phantom",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    bio: "Cybersecurity engineer & dark mode enthusiast. Custom video backgrounds & audio.",
    views: 48900,
    verified: true,
    tier: "premium",
    badges: ["verified"],
  },
  {
    username: "velvet",
    display_name: "Velvet",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    bio: "Digital artist & streamer. Minimalist typography and verified PRO member.",
    views: 37200,
    verified: true,
    tier: "premium",
    badges: ["verified", "media"],
  },
  {
    username: "cipher",
    display_name: "Cipher",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80",
    bio: "Creative developer building open-source themes and interactive Discord widgets.",
    views: 29800,
    verified: true,
    tier: "premium",
    badges: ["verified"],
  },
  {
    username: "aura",
    display_name: "Aura",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80",
    bio: "VFX animator. Looping MP4 backgrounds and custom cursor effects.",
    views: 22400,
    verified: true,
    tier: "premium",
    badges: ["verified", "og"],
  },
  {
    username: "vortex",
    display_name: "Vortex",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    bio: "Tourn PRO lifetime member. Infinite widget stacking & custom badge master.",
    views: 19100,
    verified: true,
    tier: "premium",
    badges: ["verified"],
  },
];

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

    const rotX = -py * 16;
    const rotY = px * 18;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;

    if (glareRef.current) {
      const gx = ((e.clientX - box.left) / box.width) * 100;
      const gy = ((e.clientY - box.top) / box.height) * 100;
      glareRef.current.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)`;
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

  const avatarSrc = u.avatar ? fileUrl(u.avatar) : (u.avatar_url ? fileUrl(u.avatar_url) : "");
  const bannerSrc = u.banner ? fileUrl(u.banner) : (u.banner_url ? fileUrl(u.banner_url) : "");

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-testid={`featured-creator-card-${u.username}`}
      onClick={() => onOpen(u)}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
      }}
      className={`group relative rounded-3xl overflow-hidden cursor-pointer select-none border border-white/10 bg-gradient-to-b from-[#141522] via-[#0c0d14] to-black shadow-[0_12px_36px_rgba(0,0,0,0.65)] hover:border-brand-400/50 hover:shadow-[0_20px_50px_rgba(180,191,250,0.16)] ${
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
          background: "radial-gradient(circle at 50% 0%, #b4bffa, transparent 70%)",
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
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-brand-500/30 to-purple-500/30 border border-brand-400/40 text-[10px] font-mono2 font-bold uppercase tracking-wider text-brand-200 shadow-[0_0_12px_rgba(180,191,250,0.3)] backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-brand-300" />
            <span>PRO</span>
          </span>
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
          {/* Avatar with Cybernetic Ring */}
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

          {/* Social Badges */}
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

        {/* Action Buttons */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex items-center gap-2">
          <button
            type="button"
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

/* High-Density Premium User Preview Card for Infinite Ticker */
const PremiumUserTickerCard = ({ u, onOpen }) => {
  const avatarSrc = u.avatar ? fileUrl(u.avatar) : (u.avatar_url ? fileUrl(u.avatar_url) : "");
  return (
    <div
      onClick={() => onOpen(u)}
      className="group flex items-center gap-3.5 px-5 py-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-brand-400/40 transition-all cursor-pointer select-none shrink-0 w-64 shadow-sm"
    >
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-zinc-900">
          {avatarSrc ? (
            <img src={avatarSrc} alt={u.display_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
              {(u.display_name || u.username || "?")[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 leading-tight">
          <span className="text-xs font-bold text-zinc-100 group-hover:text-white truncate">
            {u.display_name || u.username}
          </span>
          <BadgeCheck className="w-3.5 h-3.5 text-brand-400 shrink-0" />
        </div>
        <div className="text-[11px] text-zinc-400 font-mono2 truncate mt-0.5">
          @{u.username}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono2 text-brand-300">
          <span className="px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-200 uppercase font-bold">LIFETIME</span>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-400">{fmt(u.views)} views</span>
        </div>
      </div>
    </div>
  );
};

/* Comparison Table Data */
const COMPARISON = [
  ["tourn.lol Verified PRO Badge", false, true],
  ["One-Time Lifetime Access (No Subscriptions)", false, true],
  ["Unlimited Video Backgrounds & Banners (MP4)", false, true],
  ["Custom Code & HTML Widgets", false, true],
  ["3D Card Perspective Tilt & Glare Effects", false, true],
  ["Remove tourn.lol Branding & Watermarks", false, true],
  ["All Widgets (Spotify, SoundCloud, TikTok, Discord, Steam)", "Standard", "Full Access + Custom"],
  ["Fonts & Custom Cursors", "Basic Library", "40+ Designer Fonts + Crosshairs"],
  ["Template Vault", "1 Template", "Up to 5 Saved Templates"],
  ["Validated Views & Real-Time Radar", true, true],
  ["Direct Messaging & Group Chats", "Received only", "Unlimited + Groups"],
];

const Cell = ({ value }) => {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-emerald-400" aria-label="Included" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-zinc-700" aria-label="Not included" />;
  return <span className="text-xs text-zinc-400">{value}</span>;
};

/* Premium FAQ tailored to the ONE-TIME PURCHASE model */
const FAQ = [
  [
    "Is tourn.lol Premium really a one-time purchase?",
    "Yes, 100%. You pay once ($9.99) and receive lifetime access forever. There are no recurring monthly bills, hidden renewal charges, or surprise fees. Pay once, own it forever."
  ],
  [
    "What happens when new features are released?",
    "Every future update, new widget, card animation, and premium feature released on tourn.lol is automatically included with your Lifetime Pass at zero extra charge."
  ],
  [
    "Can I use custom video backgrounds and audio?",
    "Yes! Lifetime Premium lets you upload MP4 video backgrounds, animated avatars, custom audio players (with lyrics and vinyl modes), and custom cursor crosshairs."
  ],
  [
    "How does payment processing work?",
    "All checkouts are processed securely through Stripe with 256-bit encryption. We accept all major debit/credit cards, Apple Pay, Google Pay, and Cash App."
  ],
  [
    "Can I remove the tourn.lol footer on my page?",
    "Yes. You can toggle off the platform watermark and footer entirely, giving you a 100% white-label bio link."
  ],
];

const isStaffLike = (u) => u && (u.tier === "admin" || u.role === "admin" || u.is_owner === true);

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [premiumUsers, setPremiumUsers] = useState(FALLBACK_PREMIUM_CREATORS);

  const alreadyPremium = !!user && user !== false && (user.tier === "premium" || isStaffLike(user));

  useEffect(() => {
    if (params.get("upgrade") === "success") {
      toast.success("Lifetime Premium activated — everything is unlocked permanently. Welcome!");
    } else if (params.get("upgrade") === "cancelled") {
      toast.info("Checkout was closed. You were not charged.");
    }
  }, [params]);

  // Load real premium creators from backend or use verified creators
  useEffect(() => {
    loadLeaderboardRows(100)
      .then((rows) => {
        const proRows = rows.filter((r) => r.tier === "premium" || r.verified);
        if (proRows.length >= 4) {
          setPremiumUsers(proRows);
        } else if (rows.length > 0) {
          setPremiumUsers([...rows.slice(0, 8), ...FALLBACK_PREMIUM_CREATORS]);
        }
      })
      .catch(() => {
        setPremiumUsers(FALLBACK_PREMIUM_CREATORS);
      });
  }, []);

  const upgrade = async () => {
    if (!user || user === false) {
      navigate("/!/login");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/billing/checkout", { plan: "premium" });
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast.info("Billing isn't connected yet.");
    } catch (err) {
      toast.info(err.response?.data?.detail || "Checkout will be available once Stripe is connected on your backend.");
    }
    setBusy(false);
  };

  const portal = async () => {
    setPortalBusy(true);
    try {
      const { data } = await api.get("/billing/portal");
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast.info("The billing portal isn't connected yet.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "No billing record found");
    }
    setPortalBusy(false);
  };

  const openProfile = (u) => {
    navigate(`/${encodeURIComponent(u.username)}`);
  };

  // Flow items for 3D Angled Perspective Track
  const flowItems = useMemo(() => {
    return [...premiumUsers, ...premiumUsers];
  }, [premiumUsers]);

  // Dual rows for the infinite scrolling ticker
  const tickerRow1 = useMemo(() => {
    return [...premiumUsers, ...premiumUsers, ...premiumUsers];
  }, [premiumUsers]);

  const tickerRow2 = useMemo(() => {
    const reversed = [...premiumUsers].reverse();
    return [...reversed, ...reversed, ...reversed];
  }, [premiumUsers]);

  return (
    <div className="min-h-screen sw-page-bg text-zinc-100 grain overflow-x-hidden" data-testid="pricing-page">
      <Navbar />

      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-32 pb-24">
        {/* Hero Section with One-Time Purchase Highlight */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-400/30 bg-brand-500/10 text-xs font-mono2 font-bold uppercase tracking-wider text-brand-200 mb-6 backdrop-blur shadow-[0_0_20px_rgba(180,191,250,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            <span>ONE-TIME PURCHASE · LIFETIME ACCESS</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black text-zinc-50 tracking-tight leading-tight">
            {alreadyPremium ? "You Own Lifetime Premium." : "Own tourn.lol Forever."}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            {alreadyPremium
              ? "All premium features, 3D card physics, video backgrounds, and custom widgets are permanently unlocked on your account."
              : "Pay once. Keep it forever. No subscriptions, no monthly charges, and zero hidden renewal fees."}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono2 text-zinc-400">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <InfinityIcon className="w-3.5 h-3.5 text-brand-400" />
              <span>Lifetime License</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Activation</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>All Future Updates Included</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className={`grid md:grid-cols-2 gap-8 ${alreadyPremium ? "max-w-xl mx-auto" : "max-w-4xl mx-auto"} mb-20`}>
          {/* Free Tier Card */}
          <div
            data-testid="plan-free"
            className="rounded-3xl p-8 border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent shadow-xl relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono2 uppercase tracking-widest text-zinc-500 font-bold">
                Free Starter
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono2 text-zinc-400">
                Forever Free
              </span>
            </div>

            <div className="mt-4 font-display text-4xl font-black text-zinc-50">
              $0<span className="text-base font-normal text-zinc-500"> / forever</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Core bio link features, standard card layouts, and basic social icons.
            </p>

            <Link
              to="/!/login"
              data-testid="free-cta"
              className="mt-6 block text-center py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold uppercase tracking-wider transition"
            >
              Get Started Free
            </Link>

            <ul className="mt-8 space-y-3 border-t border-white/10 pt-6">
              {FREE.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-xs text-zinc-400">
                  <Check className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Tier Card - ONE-TIME PURCHASE */}
          <div
            data-testid="plan-premium"
            className="relative rounded-3xl p-8 bg-gradient-to-b from-[#181928] via-[#10111d] to-black border-2 border-brand-400/50 shadow-[0_0_60px_rgba(180,191,250,0.18)]"
          >
            {/* Top Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-500 to-purple-600 text-white text-[10px] font-mono2 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(180,191,250,0.5)]">
              ONE-TIME PURCHASE
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono2 uppercase tracking-widest text-brand-300 font-bold">
                <Crown className="w-4 h-4 text-brand-400" />
                <span>Lifetime PRO</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-[10px] font-mono2 text-brand-200 font-bold">
                Pay Once, Own Forever
              </span>
            </div>

            <div className="mt-4 font-display text-4xl sm:text-5xl font-black text-white flex items-baseline gap-2">
              {PREMIUM_PRICE.label}
              <span className="text-xs font-mono2 font-bold uppercase tracking-wider text-brand-300/90">
                · One-Time Payment
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-300">
              Lifetime access to every current and future feature. Zero recurring fees.
            </p>

            {alreadyPremium ? (
              <div className="mt-6 space-y-3">
                <div
                  className="flex w-full items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider"
                  data-testid="premium-active"
                >
                  <Zap className="w-4 h-4" /> Lifetime Active on This Account
                </div>
                <button
                  onClick={portal}
                  disabled={portalBusy}
                  data-testid="premium-portal"
                  className="w-full text-center py-2.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 text-xs font-semibold hover:bg-white/10 transition disabled:opacity-50"
                >
                  {portalBusy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Manage Account & Billing"}
                </button>
              </div>
            ) : (
              <button
                onClick={upgrade}
                disabled={busy}
                data-testid="premium-cta"
                className="mt-6 w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-brand-500 via-brand-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-98 transition shadow-[0_0_30px_rgba(180,191,250,0.35)] disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Get Lifetime Premium"}
              </button>
            )}

            <ul className="mt-8 space-y-3 border-t border-white/10 pt-6">
              {PREMIUM.map((f, i) => (
                <li key={f} className={`flex items-start gap-2.5 text-xs ${i === 0 ? "text-zinc-100 font-bold" : "text-zinc-300"}`}>
                  <Check className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Feature Grid Highlights */}
        <section className="mb-24" data-testid="pricing-features">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-black text-zinc-50">
              Elite Features Included in Lifetime
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400">
              Everything you need to craft the ultimate digital presence, completely unlocked with a single purchase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-brand-400/40 transition">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/15 border border-brand-400/30 flex items-center justify-center text-brand-300 mb-4">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100">tourn.lol Verified PRO Badge</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Receive the authentic verified PRO checkmark across your profile, cards, and leaderboards for instant credibility.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-brand-400/40 transition">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/15 border border-brand-400/30 flex items-center justify-center text-brand-300 mb-4">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100">Video MP4 Backgrounds & Banners</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Upload looping high-definition MP4 videos, animated banners, and moving avatars for a cinematic look.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-brand-400/40 transition">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/15 border border-brand-400/30 flex items-center justify-center text-brand-300 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100">3D Interactive Tilt & Specular Glare</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Unlock physical card perspective, dynamic cursor lighting reflections, cybernetic glow rings, and card physics.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-brand-400/40 transition">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/15 border border-brand-400/30 flex items-center justify-center text-brand-300 mb-4">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100">All Custom Media Widgets</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Embed custom Spotify tracks, SoundCloud creator profiles, TikTok feeds, Discord rich status, Steam, and Roblox.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-brand-400/40 transition">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/15 border border-brand-400/30 flex items-center justify-center text-brand-300 mb-4">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100">Custom Code & Zero Branding</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Remove the tourn.lol footer completely for a 100% white-label page, and write custom HTML/CSS embeds.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-brand-400/40 transition">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/15 border border-brand-400/30 flex items-center justify-center text-brand-300 mb-4">
                <FolderLock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100">Template Vault & Custom Cursors</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Save up to 5 full design presets in your private vault, plus access custom crosshairs and all 40+ designer fonts.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Creators Flow (Moved from Explore to Premium Page) */}
        <section className="mb-24 relative" data-testid="featured-creators-flow">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 px-2 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-widest font-mono2">
                  Featured Creators Flow
                </span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-black text-zinc-50">
                Created with tourn.lol Lifetime
              </h2>
            </div>
            <span className="text-xs font-mono2 text-zinc-400">
              Hover to tilt · 3D Specular Lighting
            </span>
          </div>

          {/* Angled 3D Perspective Track */}
          <div
            className="relative overflow-hidden py-6 -mx-4 px-4 mask-radial"
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
                  onOpen={openProfile}
                  isFlowItem
                />
              ))}
            </div>
          </div>
        </section>

        {/* Infinitely Scrolling Preview of All Premium Users ("bellow show a infitley scrolling preivwe of all teh pridmum usres") */}
        <section className="mb-24" data-testid="infinite-premium-users">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono2 text-brand-300 uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5" />
              <span>LIVE MEMBER STREAM</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-50">
              All tourn.lol Premium Members
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400">
              Join hundreds of verified creators, streamers, and developers who upgraded to Lifetime.
            </p>
          </div>

          {/* Dual Row Continuous Infinite Ticker */}
          <div className="space-y-4 overflow-hidden relative pause-on-hover [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            {/* Row 1: Leftward */}
            <div className="flex gap-4 animate-marquee-left">
              {tickerRow1.map((u, idx) => (
                <PremiumUserTickerCard
                  key={`ticker1-${u.username}-${idx}`}
                  u={u}
                  onOpen={openProfile}
                />
              ))}
            </div>

            {/* Row 2: Rightward */}
            <div className="flex gap-4 animate-marquee-right">
              {tickerRow2.map((u, idx) => (
                <PremiumUserTickerCard
                  key={`ticker2-${u.username}-${idx}`}
                  u={u}
                  onOpen={openProfile}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Compare the Plans Matrix */}
        <section className="mb-20" data-testid="pricing-comparison">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="font-display text-2xl font-black text-zinc-50">Compare Free vs. Lifetime</h2>
            <p className="mt-1 text-xs text-zinc-400">Clear breakdown of everything you unlock permanently.</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl">
            <div className="grid grid-cols-[1fr_100px_130px] sm:grid-cols-[1fr_130px_180px] gap-2 border-b border-white/10 bg-white/[0.04] px-5 py-3 font-mono2 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              <span>Perk / Feature</span>
              <span className="text-center">Free Tier</span>
              <span className="text-center text-brand-300 font-bold">Lifetime PRO</span>
            </div>
            {COMPARISON.map(([label, free, paid]) => (
              <div
                key={label}
                className="grid grid-cols-[1fr_100px_130px] sm:grid-cols-[1fr_130px_180px] items-center gap-2 border-b border-white/5 px-5 py-3.5 text-xs last:border-0 hover:bg-white/[0.02]"
              >
                <span className="text-zinc-300 font-medium">{label}</span>
                <span className="text-center"><Cell value={free} /></span>
                <span className="text-center"><Cell value={paid} /></span>
              </div>
            ))}
          </div>
        </section>

        {/* Billing FAQ */}
        <section className="mb-16" data-testid="pricing-faq">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="font-display text-2xl font-black text-zinc-50">Frequently Asked Questions</h2>
            <p className="mt-1 text-xs text-zinc-400">Everything you need to know about the One-Time Lifetime Pass.</p>
          </div>

          <div className="mx-auto max-w-3xl space-y-3">
            {FAQ.map(([q, a]) => (
              <details
                key={q}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 transition hover:border-brand-500/30"
              >
                <summary className="cursor-pointer list-none text-xs sm:text-sm font-semibold text-zinc-100 marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {q}
                    <span className="text-brand-400 transition-transform duration-200 group-open:rotate-45 text-lg leading-none">+</span>
                  </span>
                </summary>
                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-zinc-400">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Donation Card */}
        <div
          className="glass flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl p-7 border border-white/10"
          data-testid="donation-cta"
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/20">
              <Heart className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Want to support the developer?</h3>
              <p className="mt-0.5 text-xs text-zinc-400">Donations help keep the servers running and open for everyone.</p>
            </div>
          </div>
          <Link
            to="/!/donate"
            data-testid="pricing-donate"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Donations</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
