import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  Check, Crown, ExternalLink, Heart, Loader2, Sparkles, Zap, BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import { loadLeaderboardRows } from "@/lib/publicProfiles";

const fmt = (n) => {
  const num = Number(n) || 0;
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : String(num);
};

/* Real Premium User Preview Card for Infinite Ticker */
const PremiumUserTickerCard = ({ u, onOpen }) => {
  const avatarSrc = u.avatar ? fileUrl(u.avatar) : (u.avatar_url ? fileUrl(u.avatar_url) : "");
  const tagText = u.tier === "admin" || (u.badges || []).includes("owner") ? "ADMIN" : (u.tier === "premium" ? "LIFETIME PRO" : "VERIFIED");

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
          <span className="px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-200 uppercase font-bold">{tagText}</span>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-400">{fmt(u.views)} views</span>
        </div>
      </div>
    </div>
  );
};



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

  // Load strictly real premium/creator accounts from backend APIs
  useEffect(() => {
    Promise.allSettled([
      loadLeaderboardRows(100),
      api.get("/users/showcase").then((r) => r.data || []),
    ]).then(([lbRes, scRes]) => {
      const lbRows = lbRes.status === "fulfilled" ? (lbRes.value || []) : [];
      const scRows = scRes.status === "fulfilled" ? (scRes.value || []) : [];

      const map = new Map();
      for (const u of [...lbRows, ...scRows]) {
        if (!u || !u.username) continue;
        const key = u.username.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: u.id,
            username: u.username,
            display_name: u.display_name || u.username,
            avatar: u.avatar || u.avatar_url || "",
            views: u.views || 0,
            tier: u.tier,
            verified: u.verified || (u.badges || []).includes("verified") || u.tier === "admin" || (u.badges || []).includes("owner"),
            badges: u.badges || [],
          });
        }
      }

      const allReal = Array.from(map.values());
      const premiumOrStaff = allReal.filter(
        (u) =>
          u.tier === "premium" ||
          u.tier === "admin" ||
          u.verified ||
          (u.badges || []).some((b) => ["owner", "admin", "staff", "verified", "premium", "vip", "developer"].includes(b))
      );

      const stream = premiumOrStaff.length > 0 ? premiumOrStaff : allReal;
      setPremiumUsers(stream);
    }).catch(() => {
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

  // Dual rows for the infinite scrolling ticker - repeat smoothly to fill widescreen tracks
  const tickerRow1 = useMemo(() => {
    if (!premiumUsers || premiumUsers.length === 0) return [];
    let list = [...premiumUsers];
    while (list.length < 12) {
      list = [...list, ...premiumUsers];
    }
    return [...list, ...list];
  }, [premiumUsers]);

  const tickerRow2 = useMemo(() => {
    if (!premiumUsers || premiumUsers.length === 0) return [];
    let list = [...premiumUsers].reverse();
    while (list.length < 12) {
      list = [...list, ...premiumUsers].reverse();
    }
    return [...list, ...list];
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

        {/* Single Obsidian Lifetime Pass Card */}
        <div className="max-w-md mx-auto mb-20" data-testid="plan-premium">
          <div className="relative rounded-3xl p-7 sm:p-8 bg-[#09090c] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] hover:border-brand-400/30 transition-colors">
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-mono2 uppercase tracking-widest text-brand-300 font-bold">
                <Crown className="w-4 h-4 text-brand-400" />
                <span>Lifetime PRO</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-400/30 text-[10px] font-mono2 text-brand-200 font-bold uppercase">
                Pay Once · Own Forever
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display text-5xl font-black text-white">$9.99</span>
              <span className="text-xs font-mono2 text-zinc-400 uppercase tracking-wider font-semibold">
                · One-time payment
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Permanent access to all custom widgets, video backgrounds, audio players, card themes, and fonts. Zero recurring fees.
            </p>

            {/* CTA Button */}
            <div className="mt-6">
              {alreadyPremium ? (
                <div className="space-y-3">
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
                    className="w-full text-center py-2.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 text-xs font-semibold hover:bg-white/10 transition disabled:opacity-50 cursor-pointer"
                  >
                    {portalBusy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Manage Account & Billing"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={upgrade}
                  disabled={busy}
                  data-testid="premium-cta"
                  className="w-full text-center py-3.5 rounded-xl bg-[#535978] hover:bg-[#636a8e] active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider transition shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Get Lifetime Premium · $9.99"}
                </button>
              )}
            </div>

            {/* Core Perks List */}
            <ul className="mt-7 space-y-2.5 border-t border-white/10 pt-5 text-left">
              {[
                "tourn.lol Verified PRO Checkmark",
                "Unlimited MP4 Video Backgrounds & Banners",
                "All Media Widgets (Spotify, SoundCloud, Discord, Steam)",
                "Custom Code Embeds & HTML/CSS",
                "3D Card Perspective Tilt & Glare Effects",
                "100% White-Label (Remove Watermark & Footer)",
                "All 40+ Designer Typography Fonts & Crosshairs",
                "Template Vault (Save up to 5 full designs)",
              ].map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <Check className="w-4 h-4 text-brand-300 mt-0.5 shrink-0" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>

            <div className="text-center mt-5 text-[11px] text-zinc-500">
              Free plan user? <Link to="/!/login" data-testid="free-cta" className="text-zinc-400 hover:text-white underline">Sign up here</Link>
            </div>
          </div>
        </div>

        {/* Infinitely Scrolling Preview of All Premium Users (Only real accounts) */}
        <section className="mb-20 text-center" data-testid="infinite-premium-users">
          <div className="max-w-2xl mx-auto">
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

          {premiumUsers.length > 0 ? (
            <div className="mt-8 space-y-4 overflow-hidden relative pause-on-hover [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
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
          ) : (
            <div className="mt-8 p-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] max-w-md mx-auto text-center">
              <p className="text-xs text-zinc-500">Live stream updates as creators upgrade.</p>
            </div>
          )}
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
