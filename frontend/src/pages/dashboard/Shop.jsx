import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Sparkles, Crown, ArrowRight, Clock } from "lucide-react";
import PremiumPlansModal from "@/components/PremiumPlansModal";

export default function Shop() {
  const [plansModal, setPlansModal] = useState(false);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden border border-white/10 glass bg-gradient-to-r from-brand-600/15 via-purple-600/10 to-transparent">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-xs font-semibold text-brand-300 mb-3">
            <Clock className="w-3.5 h-3.5" /> In Development
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-white mb-3">
            Shop &amp; <span className="text-brand-400">Marketplace</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
            Exclusive perk bundles, custom badge packs, and marketplace assets are coming soon.
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
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition flex items-center gap-1.5"
            >
              <span>Public Marketplace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Placeholder Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { title: "Badge Bundles", desc: "Handcrafted metallic and holographic profile badges with custom tooltips." },
          { title: "Cursor Packs", desc: "Custom 60fps hardware-accelerated cursor pointers with motion trails." },
          { title: "Soundboard Packs", desc: "Curated entrance music tracks and ambient background loopers." },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[190px]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-200">{item.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono2 font-semibold uppercase tracking-wider bg-white/10 text-zinc-400 border border-white/5">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-600 font-mono2">
              <span>Slot #{i + 1}</span>
              <span>Available soon</span>
            </div>
          </div>
        ))}
      </div>

      {plansModal && <PremiumPlansModal onClose={() => setPlansModal(false)} />}
    </div>
  );
}
