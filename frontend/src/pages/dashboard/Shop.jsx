import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Store, ShieldCheck, Lock, MessageSquare, Zap, Crown, ArrowRight,
  Sparkles, CheckCircle2, UserCheck, AlertCircle, Search, Filter,
  ExternalLink, Tag, RefreshCw, Plus, Clock, ShieldAlert, BadgeCheck,
  ChevronRight, X, Layers,
} from "lucide-react";
import { toast } from "sonner";
import PremiumPlansModal from "@/components/PremiumPlansModal";

const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "usernames", label: "Usernames & Handles" },
  { id: "boosts", label: "Boosts & Perks" },
  { id: "accounts", label: "Accounts & Ranks" },
  { id: "services", label: "Badges & Collectibles" },
];

const INITIAL_LISTINGS = [
  {
    id: "lst-1",
    category: "usernames",
    title: "@ghost",
    subtitle: "Clean 5-letter OG handle · Clean history",
    price: 180,
    type: "Rare Handle",
    badge: "Staff Verified Stock",
    seller: "swats",
    sellerRole: "Owner",
    sellerVerified: true,
    views: "42.5k",
    escrow: true,
    e2ee: true,
    instantTransfer: true,
    description: "Premium single-word dictionary handle on swats.bio. Clean record, instant transfer into your account through platform staff escrow.",
  },
  {
    id: "lst-2",
    category: "boosts",
    title: "14x Discord Server Boosts (3 Months)",
    subtitle: "Direct guild boost pack · Zero drop guarantee",
    price: 35,
    type: "Boost Pack",
    badge: "Guaranteed Delivery",
    seller: "vortex_staff",
    sellerRole: "Trusted Staff",
    sellerVerified: true,
    views: "—",
    escrow: true,
    e2ee: true,
    instantTransfer: false,
    description: "Upgrade any Discord server to Level 3 immediately. 14 boosts delivered within 15 minutes by verified staff escrow.",
  },
  {
    id: "lst-3",
    category: "accounts",
    title: "Legend Tier Creator Account",
    subtitle: "115,000+ Views · Legend Apex Badge · Custom Assets",
    price: 260,
    type: "Apex Account",
    badge: "Platform Verified",
    seller: "solitude",
    sellerRole: "Staff",
    sellerVerified: true,
    views: "115k",
    escrow: true,
    e2ee: true,
    instantTransfer: true,
    description: "Top-ranked creator profile holding the Legend Apex badge, custom theme layout, full badge catalog access, and high natural reach.",
  },
  {
    id: "lst-4",
    category: "usernames",
    title: "@blade",
    subtitle: "Iconic gaming / cyber alias · OG 2026 registered",
    price: 120,
    type: "Rare Handle",
    badge: "Staff Verified Stock",
    seller: "core_mod",
    sellerRole: "Staff",
    sellerVerified: true,
    views: "18.2k",
    escrow: true,
    e2ee: true,
    instantTransfer: true,
    description: "Short high-demand gamer handle. Clean ban record, verified custody held in staff vault ready for immediate escrow transfer.",
  },
  {
    id: "lst-5",
    category: "services",
    title: "Custom 3D Cyber Animated Cursor",
    subtitle: "Handcrafted 60fps cursor pack with particle trail",
    price: 25,
    type: "Asset Pack",
    badge: "Staff Checked",
    seller: "pixelcraft",
    sellerRole: "Creator",
    sellerVerified: false,
    views: "8.9k",
    escrow: true,
    e2ee: true,
    instantTransfer: true,
    description: "Exclusive hardware-accelerated SVG & CSS cursor animation tailored for your swats.bio profile card.",
  },
  {
    id: "lst-6",
    category: "accounts",
    title: "Grandmaster Account (@apex)",
    subtitle: "78,000 Views · 4 Rare Seasonal Badges · Pro Status",
    price: 195,
    type: "Apex Account",
    badge: "Staff Verified Stock",
    seller: "swats",
    sellerRole: "Owner",
    sellerVerified: true,
    views: "78k",
    escrow: true,
    e2ee: true,
    instantTransfer: true,
    description: "Grandmaster rank standing with Halloween 2026, New Year 2027, and booster badges. Pre-equipped with custom glass theme.",
  },
];

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);
  const [plansModal, setPlansModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [chatModal, setChatModal] = useState(null);
  const [escrowModal, setEscrowModal] = useState(false);

  // New Listing Form State
  const [listingForm, setListingForm] = useState({
    title: "",
    category: "usernames",
    price: "",
    description: "",
    contact: "",
  });

  const filteredListings = useMemo(() => {
    return INITIAL_LISTINGS.filter((item) => {
      const matchCat = activeCategory === "all" || item.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.seller.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  const handleCreateListing = (e) => {
    e.preventDefault();
    if (!listingForm.title.trim() || !listingForm.price) {
      toast.error("Please enter a title and price for your listing");
      return;
    }
    toast.success("Listing submitted for Staff Review! We will verify custody and notify you once approved.");
    setCreateModal(false);
    setListingForm({ title: "", category: "usernames", price: "", description: "", contact: "" });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Hero / Announcement Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden border border-white/10 glass bg-gradient-to-br from-brand-600/20 via-purple-900/10 to-[#07070a] shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300 mb-4 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Staff Verified Escrow &amp; E2EE Active</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display text-white">
            Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-purple-400">Marketplace</span>
          </h1>

          {/* Owner Vision Statement Quote */}
          <div className="mt-4 p-4 rounded-2xl border border-brand-500/20 bg-brand-500/[0.06] backdrop-blur-sm">
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans italic">
              &ldquo;Y&apos;all down for a marketplace area where you can sell and buy users? It&apos;ll take a bit but defo worth it — you&apos;ll also be able to sell boosts, accounts, and much more! <strong className="text-brand-300 not-italic">ALL WILL BE CHECKED BY ME OR TRUSTED STAFF</strong>, so if you sell there <strong className="text-white not-italic">WILL be real stock and reciprocated to the other user</strong> as well as with E2EE chats.&rdquo;
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400 font-mono2">
              <span className="flex items-center gap-1.5 text-brand-300 font-semibold">
                <BadgeCheck className="w-3.5 h-3.5" /> swats (Platform Founder)
              </span>
              <span className="text-zinc-500">100% Escrow Protection</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:brightness-110 text-white font-semibold text-xs transition shadow-lg shadow-brand-500/25 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>List an Item / Handle</span>
            </button>
            <button
              type="button"
              onClick={() => setEscrowModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How Staff Escrow Works</span>
            </button>
            <Link
              to="/!/marketplace"
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs border border-white/5 transition flex items-center gap-1.5"
            >
              <span>Public Directory</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Trust & Escrow Guarantee Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-white/10 glass p-4 space-y-2">
          <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <UserCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-zinc-100 font-display">Staff-Checked Real Stock</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Every listed handle, boost, or account is inspected and held by the owner or trusted staff before going live.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 glass p-4 space-y-2">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-zinc-100 font-display">Reciprocated Escrow</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Payment and credentials remain locked in escrow until both parties confirm receipt. Zero exit scams.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 glass p-4 space-y-2">
          <div className="h-8 w-8 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-300">
            <Lock className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-zinc-100 font-display">End-to-End Encrypted Chats</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Private, zero-knowledge encrypted channels between buyer and seller with optional staff arbitration.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 glass p-4 space-y-2">
          <div className="h-8 w-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-zinc-100 font-display">Direct Handle Swap</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Clean handle transfer without cooldowns, release delay, or snipe bots. Swapped straight to your profile.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                  : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/5"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search handles, boosts, accounts..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500/50"
          />
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredListings.map((item) => (
          <div
            key={item.id}
            className="group rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-0.5 shadow-lg"
          >
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono2 font-bold uppercase tracking-wider bg-brand-500/15 text-brand-300 border border-brand-500/25">
                  {item.type}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {item.badge}
                </span>
              </div>

              <h3 className="mt-3 text-lg font-black font-display text-white group-hover:text-brand-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{item.subtitle}</p>

              <p className="mt-3 text-xs text-zinc-400 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </div>

            {/* Bottom details & action */}
            <div className="mt-5 pt-3 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-mono2 text-zinc-500">Asking Price</div>
                  <div className="text-lg font-black font-display text-white">
                    ${item.price} <span className="text-xs text-zinc-500 font-normal">USD</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono2 text-zinc-500">Verified Seller</div>
                  <div className="text-xs font-semibold text-zinc-300 flex items-center justify-end gap-1">
                    <span>@{item.seller}</span>
                    {item.sellerVerified && <BadgeCheck className="w-3.5 h-3.5 text-brand-400" />}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChatModal(item)}
                  className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-zinc-200 border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                  <span>Chat (E2EE)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedListing(item)}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:brightness-110 text-xs font-semibold text-white transition shadow-md shadow-brand-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>Buy via Escrow</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredListings.length === 0 && (
        <div className="text-center py-16 rounded-3xl border border-white/5 glass">
          <Store className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-300 font-display">No matching items found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or category filter. New staff-verified listings are added regularly.
          </p>
        </div>
      )}

      {/* Escrow Purchase Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#0b0b0f] p-6 shadow-2xl text-zinc-100 space-y-4">
            <button
              type="button"
              onClick={() => setSelectedListing(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-white">Staff-Protected Purchase</h3>
                <p className="text-[11px] text-zinc-400">Escrow Contract #{selectedListing.id.toUpperCase()}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Item</span>
                <span className="font-bold text-white">{selectedListing.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Escrow Hold Price</span>
                <span className="font-bold text-emerald-400">${selectedListing.price} USD</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Seller</span>
                <span className="text-zinc-200">@{selectedListing.seller} ({selectedListing.sellerRole})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Custody Status</span>
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Staff Held Stock
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-brand-500/20 bg-brand-500/[0.05] p-3 text-[11px] text-zinc-300 leading-relaxed">
              Your funds will be locked securely in platform escrow. The seller only receives payout once staff confirms the handle or boost has been safely transferred to you.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedListing(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success(`Escrow order created for ${selectedListing.title}! Staff mediator @swats has been assigned to your ticket.`);
                  setSelectedListing(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:brightness-110 text-xs font-semibold text-white transition shadow-lg"
              >
                Deposit &amp; Lock in Escrow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E2EE Chat Modal */}
      {chatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0b0b0f] p-6 shadow-2xl text-zinc-100 space-y-4">
            <button
              type="button"
              onClick={() => setChatModal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Chat with @{chatModal.seller}</span>
                    <BadgeCheck className="w-3.5 h-3.5 text-brand-400" />
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono2">E2EE Channel #{chatModal.id} · Regarding {chatModal.title}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Encrypted
              </span>
            </div>

            {/* Simulated Chat Feed */}
            <div className="h-56 overflow-y-auto space-y-3 p-3 rounded-2xl border border-white/5 bg-black/40 text-xs">
              <div className="text-center text-[10px] text-zinc-500 font-mono2 my-2">
                🔒 Messages are end-to-end encrypted with Curve25519. No third parties can read them.
              </div>

              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-[10px] font-bold">
                  S
                </div>
                <div className="rounded-xl rounded-tl-none bg-white/[0.06] p-2.5 max-w-[80%] text-zinc-300">
                  Hey! I have <span className="font-semibold text-white">{chatModal.title}</span> held in staff escrow ready for transfer. Let me know if you have any questions!
                </div>
              </div>

              <div className="flex items-start gap-2 justify-end">
                <div className="rounded-xl rounded-tr-none bg-brand-500/30 border border-brand-500/40 p-2.5 max-w-[80%] text-white">
                  Hey, is the custody verified directly by staff?
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-[10px] font-bold">
                  S
                </div>
                <div className="rounded-xl rounded-tl-none bg-white/[0.06] p-2.5 max-w-[80%] text-zinc-300">
                  Yes, verified and held by @swats. Whenever you lock escrow, staff executes the transfer instantly.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type encrypted message..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500/50"
              />
              <button
                type="button"
                onClick={() => toast.success("Encrypted message sent!")}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white transition cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How Escrow Works Explainer Modal */}
      {escrowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0b0b0f] p-6 shadow-2xl text-zinc-100 space-y-5">
            <button
              type="button"
              onClick={() => setEscrowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-white">Staff-Checked Escrow Guarantee</h3>
                <p className="text-xs text-zinc-400">100% Reciprocated Stock &amp; Payment Protection</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <span className="h-6 w-6 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center shrink-0 font-bold font-mono2 text-[11px]">1</span>
                <div>
                  <h5 className="font-bold text-white">Manual Staff Inspection</h5>
                  <p className="text-zinc-400 mt-0.5">Before any handle or account appears on the marketplace, @swats or trusted staff inspects ownership and securely vaults it.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <span className="h-6 w-6 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center shrink-0 font-bold font-mono2 text-[11px]">2</span>
                <div>
                  <h5 className="font-bold text-white">Buyer Escrow Deposit</h5>
                  <p className="text-zinc-400 mt-0.5">When you purchase, your deposit is held in custody. The seller does not receive any funds until you have full possession.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <span className="h-6 w-6 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center shrink-0 font-bold font-mono2 text-[11px]">3</span>
                <div>
                  <h5 className="font-bold text-white">Reciprocated Delivery &amp; E2EE Release</h5>
                  <p className="text-zinc-400 mt-0.5">Handle reassignment is triggered directly in the database without delay or sniper risk. Both parties sign off and funds are released.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEscrowModal(false)}
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white transition cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Create Listing Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#0b0b0f] p-6 shadow-2xl text-zinc-100 space-y-4">
            <button
              type="button"
              onClick={() => setCreateModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" /> List Handle, Boosts, or Account
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                All submissions undergo manual review by trusted staff before appearing live.
              </p>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Item Title / Handle</label>
                <input
                  type="text"
                  required
                  value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                  placeholder="e.g. @cyber, 14x Discord Boosts, Gold Account"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Category</label>
                  <select
                    value={listingForm.category}
                    onChange={(e) => setListingForm({ ...listingForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#14141a] border border-white/10 text-white focus:outline-none focus:border-brand-500/50"
                  >
                    <option value="usernames">Username / Handle</option>
                    <option value="boosts">Boosts &amp; Perks</option>
                    <option value="accounts">Account &amp; Rank</option>
                    <option value="services">Badge / Asset</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Asking Price (USD)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={listingForm.price}
                    onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Description &amp; Custody Details</label>
                <textarea
                  rows={3}
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  placeholder="Provide proof of ownership, account history, or boost term length..."
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500/50"
                />
              </div>

              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] text-[11px] text-amber-200/90 leading-relaxed">
                ⚠️ Notice: You must be able to transfer custody to staff escrow. Fake or illegitimate listings result in permanent platform suspension.
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:brightness-110 text-xs font-semibold text-white transition shadow-lg"
                >
                  Submit for Staff Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {plansModal && <PremiumPlansModal onClose={() => setPlansModal(false)} />}
    </div>
  );
}
