import { Link } from "react-router-dom";
import {
  Store, ShieldCheck, Lock, MessageSquare, Zap, Crown, ArrowRight,
  Sparkles, CheckCircle2, UserCheck, BadgeCheck, Clock, Layers,
} from "lucide-react";

export default function Shop() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              Marketplace
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono2 uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/25">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Community exchange for handles, accounts, and boosts with staff-verified escrow.
          </p>
        </div>
      </div>

      {/* Hero Announcement & Coming Soon Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden border border-white/10 glass bg-gradient-to-br from-brand-600/20 via-purple-900/10 to-[#07070a] shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-300 backdrop-blur">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>COMING SOON — IN ACTIVE DEVELOPMENT</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display text-white">
            Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-purple-400">Marketplace</span>
          </h2>

          {/* Owner Vision Statement Quote */}
          <div className="p-5 rounded-2xl border border-brand-500/20 bg-brand-500/[0.06] backdrop-blur-sm space-y-2">
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans italic">
              &ldquo;Y&apos;all down for a marketplace area where you can sell and buy users? It&apos;ll take a bit but defo worth it — you&apos;ll also be able to sell boosts, accounts, and much more! <strong className="text-brand-300 not-italic">ALL WILL BE CHECKED BY ME OR TRUSTED STAFF</strong>, so if you sell there <strong className="text-white not-italic">WILL be real stock and reciprocated to the other user</strong> as well as with E2EE chats.&rdquo;
            </p>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono2 pt-2 border-t border-white/5">
              <span className="flex items-center gap-1.5 text-brand-300 font-semibold">
                <BadgeCheck className="w-3.5 h-3.5" /> swats (Platform Founder)
              </span>
              <span className="text-emerald-400 font-semibold">Staff Escrow &amp; E2EE</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/!/dashboard/templates"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:brightness-110 text-white font-semibold text-xs transition shadow-lg shadow-brand-500/25 flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Browse Community Templates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/!/marketplace"
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs border border-white/10 transition flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Public Preview</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Planned Marketplace Pillars */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono2">
            Planned Architecture &amp; Safeguards
          </h3>
          <span className="text-[11px] text-zinc-500 font-mono2">Auditing in progress</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 glass p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <UserCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-zinc-100 font-display">Staff-Checked Real Stock</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Every listed handle, boost, or account will be inspected and held in vault custody by @swats or trusted staff before going live.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 glass p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-zinc-100 font-display">Reciprocated Escrow</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Payment and credentials remain locked in escrow until both parties confirm receipt. Zero exit scams or chargeback fraud.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 glass p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-300">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-zinc-100 font-display">End-to-End Encrypted</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Direct peer-to-peer buyer and seller negotiations with client-side cryptographic message encryption.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 glass p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-zinc-100 font-display">Instant Transfer</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Atomic profile handle swaps and badge reassignments happen directly within the database upon escrow release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
