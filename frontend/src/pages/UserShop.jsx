import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Store, Lock, ArrowLeft, ShieldCheck, CheckCircle2, ShoppingBag,
  ExternalLink, Sparkles, Tag, Heart, Info, AlertTriangle, Send, X,
  Trash2, ToggleLeft, ToggleRight, MessageSquare, Loader2,
} from "lucide-react";
import { toast } from "@/lib/notify";
import { BackgroundEffect } from "@/components/BackgroundEffect";
import { OverlayEffect } from "@/components/OverlayEffect";

export default function UserShop() {
  const { alias: rawAlias } = useParams();
  const alias = (rawAlias || "").replace(/^@/, "");
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin" || !!currentUser?.is_owner;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [inquiryModal, setInquiryModal] = useState(null);
  const [buyerName, setBuyerName] = useState(currentUser?.username || "");
  const [buyerContact, setBuyerContact] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [togglingStore, setTogglingStore] = useState(false);

  const fetchStore = () => {
    if (!alias) return;
    setLoading(true);
    api.get(`/u/${alias}`)
      .then(({ data }) => {
        setData(data);
        document.title = `${data.display_name || data.username}'s Store | tourn.lol`;
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStore();
  }, [alias]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center text-zinc-500 font-mono2 text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#b4bffa]" /> Loading creator storefront…
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
  const storeEnabled = p.store_enabled !== false;

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

  // Real items from the creator's profile (NO FAKE / PLACEHOLDER ITEMS)
  const items = Array.isArray(p.shop_items) ? p.shop_items : [];

  const categories = [
    { id: "all", label: "All Items" },
    ...Array.from(new Set(items.map((i) => i.category || "General").filter(Boolean))).map((cat) => ({
      id: cat.toLowerCase(),
      label: cat,
    })),
  ];

  const filtered = activeCategory === "all"
    ? items
    : items.filter((it) => (it.category || "General").toLowerCase() === activeCategory);

  const handleToggleStoreAdmin = async () => {
    if (!isAdmin) return;
    setTogglingStore(true);
    try {
      await api.put(`/admin/stores/${data.id}/toggle`, { enabled: !storeEnabled });
      toast.success(storeEnabled ? "Store disabled by admin" : "Store activated by admin");
      setData({
        ...data,
        profile: {
          ...p,
          store_enabled: !storeEnabled,
        },
      });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to toggle store");
    } finally {
      setTogglingStore(false);
    }
  };

  const handleDeleteProductAdmin = async (productId) => {
    if (!isAdmin) return;
    if (!window.confirm("Admin: remove this product from the creator's store?")) return;
    try {
      await api.delete(`/admin/stores/${data.id}/products/${productId}`);
      toast.success("Product removed by admin");
      setData({
        ...data,
        profile: {
          ...p,
          shop_items: items.filter((it) => it.id !== productId),
        },
      });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to remove product");
    }
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!inquiryMessage.trim() || !buyerName.trim()) {
      toast.error("Please enter your name and a message for the creator.");
      return;
    }
    setSubmittingInquiry(true);
    try {
      await api.post("/store/inquiry", {
        creator_id: data.id,
        creator_username: data.username,
        product_id: inquiryModal?.id,
        product_title: inquiryModal?.title,
        buyer_name: buyerName.trim(),
        buyer_contact: buyerContact.trim(),
        message: inquiryMessage.trim(),
      });
      toast.success("Inquiry sent to creator! Staff escrow monitors all chats.");
      setInquiryModal(null);
      setInquiryMessage("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send inquiry");
    } finally {
      setSubmittingInquiry(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white selection:bg-[#b4bffa]/30 overflow-x-hidden">
      {/* Real profile background presentation */}
      {p.bg_image && (
        <img
          src={fileUrl(p.bg_image)}
          alt=""
          className="fixed inset-0 w-full h-full object-cover pointer-events-none opacity-30 blur-md transition-opacity duration-700"
        />
      )}
      {p.background_effect && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <BackgroundEffect effect={p.background_effect} />
        </div>
      )}
      {p.overlay_effect && (
        <div className="fixed inset-0 pointer-events-none z-[1]">
          <OverlayEffect effect={p.overlay_effect} color={accent} opacity={p.overlay_opacity ?? 70} />
        </div>
      )}

      {/* Dark glassmorphic backdrop layer */}
      <div className="fixed inset-0 bg-[#070709]/85 backdrop-blur-2xl pointer-events-none z-[2]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Admin floating override toolbar */}
        {isAdmin && (
          <aside className="sticky top-0 z-[60] bg-amber-500/15 border-b border-amber-500/30 backdrop-blur-xl px-4 py-2 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>
                <strong>Admin Mode:</strong> You are viewing @{data.username}&apos;s storefront. Status:{" "}
                <strong className={storeEnabled ? "text-emerald-400" : "text-rose-400"}>
                  {storeEnabled ? "ACTIVE" : "DISABLED"}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={togglingStore}
                onClick={handleToggleStoreAdmin}
                className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {storeEnabled ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-rose-400" />}
                <span>{storeEnabled ? "Disable Store" : "Enable Store"}</span>
              </button>
              <Link
                to="/!/dashboard/admin/users"
                className="underline hover:text-white"
              >
                Open in User Manager
              </Link>
            </div>
          </aside>
        )}

        {/* Top Banner Navigation */}
        <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#070709]/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={`/${data.username}`}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.03]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Profile</span>
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
              <span>Verified Creator Store</span>
            </div>
            {currentUser?.username === data.username && (
              <Link
                to="/!/dashboard/editor"
                className="px-3.5 py-1.5 rounded-xl bg-[#b4bffa] text-black font-bold text-xs hover:brightness-110 transition"
              >
                Manage Products
              </Link>
            )}
          </div>
        </header>

        {/* Store Paused Banner if Disabled */}
        {!storeEnabled && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-3 text-center text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 inline-block mr-1.5 text-rose-400" />
            This storefront has been temporarily paused by the creator or site moderation.
          </div>
        )}

        {/* Hero Creator Header */}
        <div className="relative border-b border-white/[0.06] bg-[#0c0c0e]/70 backdrop-blur-md py-10 px-4 sm:px-8 overflow-hidden">
          <div
            className="absolute inset-0 opacity-25 pointer-events-none blur-3xl"
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
                  Verified Storefront
                </span>
              </div>

              <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                {p.bio || `Welcome to ${data.display_name || data.username}'s official store. Direct purchases and creator commissions.`}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-zinc-400 font-mono2">
                <span>Handles: <strong className="text-white">@{data.username}</strong> {data.secondary_alias && <>• <strong className="text-[#b4bffa]">@{data.secondary_alias}</strong></>}</span>
                <span>•</span>
                <span>Direct Escrow Inquiries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Storefront Catalog Section */}
        <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6 flex-1 w-full">
          {/* Category Filters */}
          {categories.length > 2 && (
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
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
          )}

          {/* Product Cards Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e]/80 backdrop-blur-xl p-5 flex flex-col justify-between hover:border-white/20 transition-all duration-200 shadow-xl group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold font-mono2 uppercase bg-white/[0.05] text-zinc-300 border border-white/10">
                          {item.tag || item.category || "Product"}
                        </span>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#b4bffa] transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      <span className="text-base font-extrabold text-white font-mono2 shrink-0">
                        {item.price ? (item.price.startsWith("$") ? item.price : `$${item.price}`) : "Inquire"}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-mono2">
                      Delivery: <strong className="text-zinc-200">{item.stock || "Direct / Digital"}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteProductAdmin(item.id)}
                          title="Admin: Delete product"
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setInquiryModal(item)}
                        className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-[#b4bffa] hover:text-black text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Inquire / Buy</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center rounded-2xl border border-white/[0.06] bg-[#0c0c0e]/60 backdrop-blur-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No Products Currently Listed</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                This creator hasn&apos;t published any items to their storefront yet. Check back soon for new releases!
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Buy / Inquire Modal */}
      {inquiryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setInquiryModal(null); }}
        >
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0e0e12] p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono2 text-zinc-500">Order Inquiry</span>
                <h3 className="text-sm font-bold text-white">{inquiryModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInquiryModal(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInquiry} className="space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                <span className="text-zinc-400">Price</span>
                <span className="font-extrabold font-mono2 text-white">
                  {inquiryModal.price ? (inquiryModal.price.startsWith("$") ? inquiryModal.price : `$${inquiryModal.price}`) : "Custom Quote"}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Your Name / Handle</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Alex or @buyer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Contact (Discord / Email)</label>
                <input
                  type="text"
                  value={buyerContact}
                  onChange={(e) => setBuyerContact(e.target.value)}
                  placeholder="e.g. discord: alex#0001 or alex@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Message / Requirements</label>
                <textarea
                  rows={3}
                  required
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="Hi! I want to purchase this item. Here are my details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInquiryModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="px-5 py-2 rounded-xl bg-[#b4bffa] text-black font-extrabold text-xs hover:brightness-110 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingInquiry ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Inquiry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
