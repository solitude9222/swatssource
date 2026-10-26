import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  Check, Crown, ExternalLink, Heart, Loader2, Minus, Sparkles, Zap,
  ShieldCheck, Eye, BadgeCheck, Video, Layers,
  Palette, Code2, FolderLock, Infinity as InfinityIcon
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import { FREE_PERKS as FREE, PREMIUM_PERKS as PREMIUM, PREMIUM_PRICE } from "@/constants/plans";
import { loadLeaderboardRows } from "@/lib/publicProfiles";

const fmt = (n) => {
  const num = Number(n) || 0;
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : String(num);
};

/* Real Premium User Preview Card for Infinite Ticker */
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
  ["All Widgets (Spotify, SoundCloud, Discord, Steam)", "Standard", "Full Access + Custom"],
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
    "Yes. You pay once ($9.99) and receive lifetime access forever. There are no recurring monthly bills, hidden renewal charges, or surprise fees."
  ],
  [
    "What happens when new features are released?",
    "Every future update, new widget, card animation, and premium feature released on tourn.lol is automatically included with your Lifetime Pass at zero extra charge."
  ],
  [
    "Can I use custom video backgrounds and audio?",
    "Yes! Lifetime Premium lets you upload MP4 video backgrounds, animated avatars, custom audio players, and custom cursor crosshairs."
  ],
  [
    "How does payment processing work?",
    "All checkouts are processed securely through Stripe with 256-bit encryption. We accept credit/debit cards, Apple Pay, Google Pay, and Cash App."
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
  const [premiumUsers, setPremiumUsers] = useState([]);

  const alreadyPremium = !!user && user !== false && (user.tier === "premium" || isStaffLike(user));

  useEffect(() => {
    if (params.get("upgrade") === "success") {
      toast.success("Lifetime Premium activated — everything is unlocked permanently. Welcome!");
    } else if (params.get("upgrade") === "cancelled") {
      toast.info("Checkout was closed. You were not charged.");
    }
  }, [params]);

  // Load strictly real premium creators from backend API
  useEffect(() => {
    loadLeaderboardRows(100)
      .then((rows) => {
        const proRows = (rows || []).filter((r) => r && r.username && (r.tier === "premium" || r.verified));
        setPremiumUsers(proRows);
      })
      .catch(() => {
        setPremiumUsers([]);
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

      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-32 pb-24">
        {/* Clean Hero Section */}
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
              ? "All premium features, custom widgets, video backgrounds, and card styles are permanently unlocked on your account."
              : "Pay once. Keep it forever. No subscriptions, no monthly charges, and zero hidden renewal fees."}
          </p>
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
              <h3 className="text-sm font-bold text-zinc-100">Card Effects & Aesthetics</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Unlock custom card themes, floating card layouts, background blur gradients, and sleek obsidian designs.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-brand-400/40 transition">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/15 border border-brand-400/30 flex items-center justify-center text-brand-300 mb-4">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100">All Custom Media Widgets</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Embed custom Spotify tracks, SoundCloud creator profiles, Discord rich status, Steam, and Roblox.
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

        {/* Infinitely Scrolling Preview of All Premium Users (Only real accounts) */}
        {premiumUsers.length > 0 && (
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
                Join verified creators, streamers, and developers who upgraded to Lifetime.
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
        )}

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
