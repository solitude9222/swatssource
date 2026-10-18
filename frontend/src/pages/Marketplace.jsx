import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Store } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function Marketplace() {
  return (
    <div className="min-h-screen bg-[#050506] text-zinc-100 grain relative flex flex-col justify-between">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[40rem]"
        style={{
          background:
            "radial-gradient(120% 100% at 50% -10%, rgba(164, 141, 244, 0.35) 0%, rgba(164, 141, 244, 0.12) 35%, transparent 70%)",
        }}
      />

      <Navbar />

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-32">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-200 mb-6 backdrop-blur">
            <Store className="h-4 w-4 text-brand-400" />
            <span>Community Marketplace</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black text-zinc-50 tracking-tight leading-tight">
            Coming Soon
          </h1>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
            The community marketplace is currently in development. You will soon be able to publish, discover, and install community themes, custom widgets, cursor packs, and soundscapes.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/!/home"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold hover:brightness-110 transition shadow-lg shadow-brand-500/20"
            >
              <span>Back to Home</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/!/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 text-sm font-semibold hover:bg-white/[0.08] hover:text-white transition"
            >
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Go to Dashboard</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
