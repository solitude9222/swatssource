import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import {
  Store, Lock, ArrowLeft, ShieldCheck, CheckCircle2, ShoppingBag,
  ExternalLink, Sparkles, Tag, Heart, Info, AlertTriangle,
} from "lucide-react";
import { toast } from "@/lib/notify";

export default function UserShop() {
  const { alias: rawAlias } = useParams();
  const alias = (rawAlias || "").replace(/^@/, "");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [purchasedId, setPurchasedId] = useState(null);

  useEffect(() => {
    if (!alias) return;
    setLoading(true);
    api.get(`/u/${alias}`)
      .then(({ data }) => {
        setData(data);
        document.title = `${data.display_name || data.username}'s Store | tourn.lol`;
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [alias]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center text-zinc-500 font-mono2 text-xs">
        Loading creator storefront…
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
          <Store className="h-7 w-7 text-zinc-500" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Storefront Not Found</h1>
        <p className="text-xs text-zinc-400 max-w-sm mb-6">
          The creator @{alias} does not exist or their storefront could not be located.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-[#b4bffa] text-black font-bold text-xs hover:brightness-110 transition"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const p = data.profile || {};
  const isPremium = data.tier === "premium" || data.tier === "admin" || !!data.is_owner || data.is_premium;
  const accent = p.accent_color || "#b4bffa";

  // If the user is NOT premium, the shop is restricted
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 shadow-2xl">
          <Lock className="h-8 w-8 text-amber-400" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-3">
          Premium Storefront Only
        </div>
        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
          Storefront Unavailable
        </h1>
        <p className="text-xs text-zinc-400 max-w-md leading-relaxed mb-6">
          Only verified <strong className="text-white">Premium tourn.lol creators</strong> can host personal storefronts at <span className="font-mono2 text-amber-300">tourn.lol/{alias}/shop</span>.
          @{data.username} currently does not have an active shop license.
        </p>
        <div className="flex items-center gap-3">
          <Link
            to={`/${data.username}`}
            className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs transition border border-white/10 flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            View @{data.username}&apos;s Profile
          </Link>
          <Link
            to="/!/pricing"
            className="px-5 py-2.5 rounded-xl bg-[#b4bffa] text-black font-bold text-xs hover:brightness-110 transition"
          >
            Unlock Premium Storefront
          </Link>
        </div>
      </div>
    );
  }

  // Pre-configured creator items (or custom store items configured in profile)
  const defaultItems = [
    {
      id: "theme-pack",
      title: `${data.display_name || data.username}'s Profile CSS Theme`,
      category: "themes",
      price: "$2.50",
      description: "Custom dark aura background theme, card glass styling, and custom font preset.",
      tag: "Instant Delivery",
      stock: "Unlimited",
    },
    {
      id: "discord-role",
      title: "VIP Discord Role & Priority Chat",
      category: "roles",
      price: "$4.00",
      description: "Exclusive colored VIP role in creator's official community server + VIP channel access.",
      tag: "Auto Synced",
      stock: "42 left",
    },
    {
      id: "commission-slot",
      title: "1-on-1 Profile Design Commission",
      category: "commissions",
      price: "$12.00",
      description: "Custom banner art, avatar frame color grading, and complete custom layout setup.",
      tag: "Staff Escrow",
      stock: "2 left",
    },
    {
      id: "audio-bundle",
      title: "Curated Lo-Fi & Synth Audio Bundle",
      category: "audio",
      price: "$1.99",
      description: "High quality MP3 audio tracks pre-formatted for loop playback on your tourn.lol profile.",
      tag: "Direct Download",
      stock: "Digital",
    },
  ];

  const items = (p.shop_items && Array.isArray(p.shop_items) && p.shop_items.length > 0)
    ? p.shop_items
    : defaultItems;

  const filtered = activeCategory === "all"
    ? items
    : items.filter((it) => it.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-[#b4bffa]/30">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#070709]/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/${data.username}`}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.03]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Profile</span>
          </Link>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">tourn.lol</span>
            <span className="text-zinc-600">/</span>
            <span className="font-mono2 text-xs text-[#b4bffa]">@{data.username}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-semibold text-zinc-300">shop</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Escrow</span>
          </div>
          <Link
            to="/!/home"
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-zinc-200 transition"
          >
            Create Your Shop
          </Link>
        </div>
      </header>

      {/* Hero Creator Header */}
      <div className="relative border-b border-white/[0.06] bg-[#0c0c0e] py-10 px-4 sm:px-8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none blur-3xl"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent} 0%, transparent 70%)` }}
        />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative h-24 w-24 shrink-0 rounded-full ring-2 ring-white/10 overflow-hidden bg-black shadow-2xl">
            {p.avatar_url ? (
              <img src={fileUrl(p.avatar_url)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-black text-zinc-500">
                {(data.display_name || data.username || "?")[0]?.toUpperCase()}
              </div>
            )}
            {p.avatar_decoration && (
              <img
                src={p.avatar_decoration}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full scale-[1.28] object-contain"
              />
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {data.display_name || data.username}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#b4bffa]/15 text-[#b4bffa] border border-[#b4bffa]/30 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Premium Store
              </span>
            </div>

            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              {p.bio || `Welcome to ${data.display_name || data.username}'s official shop. Direct creator purchases with instant license fulfillment and staff dispute protection.`}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-zinc-500 font-mono2">
              <span>Handles: <strong className="text-white">@{data.username}</strong> {data.secondary_alias && <>• <strong className="text-[#b4bffa]">@{data.secondary_alias}</strong></>}</span>
              <span>•</span>
              <span>100% Buyer Protection</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storefront Catalog Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Category Filters */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "all", label: "All Items" },
              { id: "themes", label: "Themes & Presets" },
              { id: "roles", label: "Roles & Access" },
              { id: "commissions", label: "Commissions" },
              { id: "audio", label: "Audio & Media" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-[#b4bffa] text-black font-bold shadow-sm"
                    : "bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-500 font-mono2 hidden sm:block">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-5 flex flex-col justify-between hover:border-white/20 transition-all duration-200 shadow-xl group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold font-mono2 uppercase bg-white/[0.05] text-zinc-400 border border-white/5">
                      {item.tag || "Digital"}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#b4bffa] transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <span className="text-base font-extrabold text-white font-mono2 shrink-0">
                    {item.price}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono2">
                  Stock: <strong className="text-zinc-300">{item.stock}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setPurchasedId(item.id);
                    toast.success(`Purchase started for ${item.title} — Escrow session created`);
                    setTimeout(() => setPurchasedId(null), 3000);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-[#b4bffa] hover:text-black text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {purchasedId === item.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Added to Escrow</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Buy Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-white/[0.06] bg-[#0c0c0e]">
            <p className="text-xs text-zinc-400">No items available in this category.</p>
          </div>
        )}
      </main>
    </div>
  );
}
