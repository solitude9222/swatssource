import { Link } from "react-router-dom";
import {
  Sparkles, ArrowRight, Store, ShieldCheck, Lock, UserCheck, Zap,
  BadgeCheck, MessageSquare, Plus, CheckCircle2, Clock,
} from "lucide-react";
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
            "radial-gradient(120% 100% at 50% -10%, rgba(180, 191, 250, 0.35) 0%, rgba(180, 191, 250, 0.12) 35%, transparent 70%)",
        }}
      />

      <Navbar />

      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-4 py-28 sm:py-36 space-y-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 mb-6 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <Clock className="w-4 h-4 text-amber-400" />
            <span>COMING SOON — IN ACTIVE DEVELOPMENT</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black text-zinc-50 tracking-tight leading-tight">
            Account &amp; Asset <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-purple-400">Marketplace</span>
          </h1>

          {/* Owner Vision Statement Quote */}
          <div className="mt-6 p-5 rounded-3xl border border-brand-500/25 bg-brand-500/[0.06] backdrop-blur text-left sm:text-center shadow-xl">
            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed italic">
              &ldquo;Y&apos;all down for a marketplace area where you can sell and buy users? It&apos;ll take a bit but defo worth it — you&apos;ll also be able to sell boosts, accounts, and much more! <strong className="text-brand-300 not-italic">ALL WILL BE CHECKED BY ME OR TRUSTED STAFF</strong>, so if you sell there <strong className="text-white not-italic">WILL be real stock and reciprocated to the other user</strong> as well as with E2EE chats.&rdquo;
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 font-mono2 border-t border-white/5 pt-2">
              <span className="flex items-center gap-1.5 text-brand-300 font-semibold">
                <BadgeCheck className="w-4 h-4" /> @swats (Platform Founder)
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Escrow Protection
              </span>
            </div>
          </div>

          <p className="mt-6 text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Trade rare OG usernames, server boost packs, high-rank profiles, and creator assets with complete peace of mind through platform-backed custody and encrypted messaging.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/!/dashboard/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold hover:brightness-110 transition shadow-lg shadow-brand-500/25 cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Enter Dashboard Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/!/home"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 text-sm font-semibold hover:bg-white/[0.08] hover:text-white transition"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="rounded-2xl border border-white/10 glass p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <UserCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100 font-display">Staff-Held Real Stock</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every listed handle, boost, or account is checked and held in custody by @swats or trusted staff before appearing.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 glass p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100 font-display">Reciprocated Escrow</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Payment and credentials remain locked until both sides confirm receipt. Zero risk of fake stock or scams.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 glass p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-300">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100 font-display">End-to-End Encrypted</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zero-knowledge E2EE messaging channels between buyer and seller with optional staff moderator support.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 glass p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100 font-display">Instant Handle Swap</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Direct database handle transfer without cooldowns, release delay, or snipe bots. Swapped straight to your profile.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
