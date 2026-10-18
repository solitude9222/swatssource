import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  ShoppingBag, Sparkles, Crown, Check, Zap, Award, MousePointer, Music,
  ArrowRight, ShieldCheck, Flame, Star, Palette,
} from "lucide-react";
import { toast } from "sonner";
import PremiumPlansModal from "@/components/PremiumPlansModal";

const PERK_BUNDLES = [
  {
    id: "premium-lifetime",
    title: "swats.bio Premium Lifetime",
    badge: "Best Value",
    price: "$19.99",
    period: "one-time",
    icon: Crown,
    color: "#a855f7",
    desc: "Unlock everything forever: unlimited widgets, custom audio, custom domains, 60fps GIFs, and badge slots.",
    features: [
      "All custom widgets & live embeds",
      "Upload up to 50MB audio tracks",
      "Unlimited custom badges & icons",
      "Custom domains & profile URLs",
      "Zero branding watermark",
    ],
    action: "upgrade",
  },
  {
    id: "gilded-badge-pack",
    title: "Gilded Badge Pack",
    badge: "Popular",
    price: "Free with Premium",
    period: "exclusive",
    icon: Award,
    color: "#eab308",
    desc: "A collector pack of 12 handcrafted metallic and holographic profile badges.",
    features: [
      "12 animated SVG badge designs",
      "Gold, diamond & amethyst finishes",
      "Custom tooltip descriptions",
      "Priority showcase ranking",
    ],
    action: "claim",
  },
  {
    id: "pro-cursor-effects",
    title: "Pro Cursor & Motion Trails",
    badge: "Hot",
    price: "Free",
    period: "included",
    icon: MousePointer,
    color: "#06b6d4",
    desc: "Interactive cursor physics with neon trail particles that follow your visitor's mouse.",
    features: [
      "Smooth 60fps hardware accelerated canvas",
      "Adjustable scale and hotspot centering",
      "Crosshair & pointer presets",
      "Full mobile touch fallback",
    ],
    action: "activate",
  },
  {
    id: "soundboard-bundle",
    title: "Atmospheric Soundboard",
    badge: "Audio FX",
    price: "Free",
    period: "included",
    icon: Music,
    color: "#ec4899",
    desc: "Curated ambient tracks and sound effects designed for entrance screen interactions.",
    features: [
      "High bitrate stereo masters",
      "Auto-looping seamless ambient drones",
      "Lofi beats, cyberpunk synth, and rainy window",
      "Zero copyright strikes",
    ],
    action: "activate",
  },
];

export default function Shop() {
  const { user } = useAuth() || {};
  const [plansModal, setPlansModal] = useState(false);
  const [claimed, setClaimed] = useState({});

  const handleAction = (bundle) => {
    if (bundle.action === "upgrade") {
      setPlansModal(true);
      return;
    }
    setClaimed((prev) => ({ ...prev, [bundle.id]: true }));
    toast.success(`"${bundle.title}" activated on your profile!`);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden border border-white/10 glass bg-gradient-to-r from-brand-600/15 via-purple-600/10 to-transparent">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-xs font-semibold text-brand-300 mb-3">
            <ShoppingBag className="w-3.5 h-3.5" /> Dashboard Perks & Upgrades
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-white mb-3">
            Shop exclusive profile <span className="text-brand-400">upgrades & perks</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
            Equip premium badges, unlock advanced widget customizations, and supercharge your bio profile.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlansModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:brightness-110 text-white font-semibold text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Explore Premium Plans</span>
            </button>
            <Link
              to="/!/marketplace"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition"
            >
              Public Marketplace →
            </Link>
          </div>
        </div>
      </div>

      {/* Perk Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PERK_BUNDLES.map((bundle) => {
          const Icon = bundle.icon;
          const isDone = !!claimed[bundle.id];
          return (
            <div
              key={bundle.id}
              className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 flex flex-col justify-between hover:border-white/20 transition-all duration-200 group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-sm"
                      style={{ color: bundle.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-brand-300 transition">
                        {bundle.title}
                      </h3>
                      <span className="text-xs font-mono2 text-zinc-400">
                        {bundle.price} {bundle.period && `· ${bundle.period}`}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-zinc-300 border border-white/10">
                    {bundle.badge}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {bundle.desc}
                </p>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  {bundle.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="text-[11px] text-zinc-500 font-mono2">
                  Account status: {user?.tier || "Free"}
                </div>
                <button
                  type="button"
                  onClick={() => handleAction(bundle)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    isDone
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : bundle.action === "upgrade"
                        ? "bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-md hover:brightness-110"
                        : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                  }`}
                >
                  {isDone ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Active</span>
                    </>
                  ) : bundle.action === "upgrade" ? (
                    <>
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                      <span>Get Premium</span>
                    </>
                  ) : (
                    <span>Equip Perk</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {plansModal && <PremiumPlansModal onClose={() => setPlansModal(false)} />}
    </div>
  );
}
