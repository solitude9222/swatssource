import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BADGE_CATALOG, badgeMeta } from "@/constants/badges";
import { BadgeChip } from "@/components/BadgeChip";
import {
  Paintbrush, Check, Lock, Plus, X, Shield, Upload, Eye, EyeOff,
  Loader2, Search, Info, HelpCircle, ArrowLeft, ArrowRight, GripVertical, Sparkles,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/lib/notify";
import { useEditGate } from "@/hooks/useEditGate";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ColorPicker";
import { SmartSelect } from "@/components/ui-shared/SmartSelect";
import { EmptyState } from "@/components/ui-shared/PageUI";
import { PremiumGate } from "@/components/ui-shared/PremiumGate";

function BadgePreviewRow({ ids, glowColor = "", glowIntensity = 60, glow = true, overlay = false, overlayColor = "", overlayStrength = 60 }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {ids.map((id) => (
        <BadgeChip
          key={id}
          id={id}
          glowColor={glowColor}
          glowIntensity={glowIntensity}
          glow={glow}
          overlay={overlay}
          overlayColor={overlayColor}
          overlayStrength={overlayStrength}
        />
      ))}
    </div>
  );
}

export default function Badges() {
  const { user, setUser } = useAuth();
  const gate = useEditGate();
  const [catalog, setCatalog] = useState(BADGE_CATALOG);
  const [showPaintModal, setShowPaintModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState(null);
  const [iconUploading, setIconUploading] = useState(false);

  const [customBadge, setCustomBadge] = useState({
    name: "",
    desc: "",
    icon_url: "",
    color: "#74578c",
    glow: "hsla(272, 24%, 46%, 0.4)",
  });

  const [paintSettings, setPaintSettings] = useState({
    glow: user?.profile?.badge_glow !== false,
    glow_color: user?.profile?.badge_glow_color || user?.profile?.accent_color || "#A48DF4",
    glow_intensity: user?.profile?.badge_glow_intensity ?? 60,
    overlay: user?.profile?.badge_overlay === true,
    overlay_color: user?.profile?.badge_overlay_color || user?.profile?.accent_color || "#A48DF4",
    overlay_strength: user?.profile?.badge_overlay_strength ?? 60,
    badge_placement: user?.profile?.badge_placement || "next_to_name",
  });

  const [showBadges, setShowBadges] = useState(user?.profile?.show_badges !== false);

  const [equippedList, setEquippedList] = useState(
    user?.equipped_badges?.length ? user.equipped_badges : (user?.badges || [])
  );
  const [dragIndex, setDragIndex] = useState(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("owned");
  const [filterBy, setFilterBy] = useState("all");

  useEffect(() => {
    api.get("/badges/catalog").then(({ data }) => { if (Array.isArray(data)) setCatalog(data); }).catch(() => {});
  }, []);

  const nameOf = (id) => catalog.find((c) => c.id === id)?.name || badgeMeta(id)?.label || id.replace(/_/g, " ");

  const owned = new Set(user?.badges || []);
  const equippedSet = new Set(equippedList);
  const isPremium = user?.tier === "premium" || user?.tier === "admin" || user?.is_owner;

  const globalChip = {
    glow: paintSettings.glow,
    glowColor: paintSettings.glow_color,
    glowIntensity: paintSettings.glow_intensity,
    overlay: paintSettings.overlay,
    overlayColor: paintSettings.overlay_color,
    overlayStrength: paintSettings.overlay_strength,
  };

  const gridCatalog = useMemo(() => {
    const known = new Set(catalog.map((c) => c.id));
    const extra = [...new Set([...(user?.badges || []), ...equippedList])]
      .filter((id) => id && !known.has(id) && badgeMeta(id))
      .map((id) => ({
        id,
        name: badgeMeta(id).label || id.replace(/_/g, " "),
        desc: badgeMeta(id).art?.desc || "Granted badge",
        type: "mod",
        group: badgeMeta(id).art?.group,
      }));
    return extra.length ? [...catalog, ...extra] : catalog;
  }, [catalog, user?.badges, equippedList]);

  const visibleBadges = useMemo(() => {
    const ownedSet = new Set(user?.badges || []);
    const eqSet = new Set(equippedList);
    const q = query.trim().toLowerCase();

    let list = gridCatalog.filter((b) => {
      const name = String(b.name || badgeMeta(b.id)?.label || b.id).toLowerCase();
      return !q || name.includes(q) || String(b.id).toLowerCase().includes(q);
    });

    if (filterBy === "owned") list = list.filter((b) => ownedSet.has(b.id));
    else if (filterBy === "equipped") list = list.filter((b) => eqSet.has(b.id));
    else if (filterBy === "locked") list = list.filter((b) => !ownedSet.has(b.id));

    const rank = (b) => (eqSet.has(b.id) ? 0 : ownedSet.has(b.id) ? 1 : 2);
    if (sortBy === "owned") list = [...list].sort((a, b) => rank(a) - rank(b));
    else if (sortBy === "az")
      list = [...list].sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
    return list;
  }, [gridCatalog, query, sortBy, filterBy, equippedList, user?.badges]);

  const toggleEquip = async (badgeId) => {
    if (gate.guard("equipping badges")) return;
    let nextList;
    if (equippedSet.has(badgeId)) {
      nextList = equippedList.filter((b) => b !== badgeId);
    } else {
      nextList = [...equippedList, badgeId];
    }
    setEquippedList(nextList);

    try {
      const { data } = await api.put("/me/profile", { equipped_badges: nextList });
      setUser(data);
      toast.success(equippedSet.has(badgeId) ? "Badge unequipped" : "Badge equipped to profile card!");
    } catch {
      toast.error("Failed to update equipped badges");
    }
  };

  const reorderEquipped = async (from, to) => {
    if (gate.guard("reordering badges")) return;
    if (from == null || from === to || to < 0 || to >= equippedList.length) return;
    const next = [...equippedList];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setEquippedList(next);
    try {
      const { data } = await api.put("/me/profile", { equipped_badges: next });
      setUser(data);
      toast.success("Badge order updated");
    } catch {
      toast.error("Failed to reorder badges");
    }
  };

  const handlePlacementChange = async (placement) => {
    if (gate.guard("changing badge placement")) return;
    setPaintSettings((prev) => ({ ...prev, badge_placement: placement }));
    try {
      const updatedProfile = {
        ...user.profile,
        badge_placement: placement,
      };
      const { data } = await api.put("/me/profile", updatedProfile);
      setUser(data);
      toast.success("Badge placement updated!");
    } catch {
      toast.error("Failed to update badge placement");
    }
  };

  const savePaintSettings = async () => {
    if (gate.guard("saving badge styling")) return;
    try {
      const updatedProfile = {
        ...user.profile,
        badge_glow: paintSettings.glow,
        badge_glow_color: paintSettings.glow_color,
        badge_glow_intensity: paintSettings.glow_intensity,
        badge_overlay: paintSettings.overlay,
        badge_overlay_color: paintSettings.overlay_color,
        badge_overlay_strength: paintSettings.overlay_strength,
        badge_placement: paintSettings.badge_placement || "next_to_name",
        show_badges: showBadges,
        badge_style: "default",
        badge_size: "lg",
        badge_icon_weight: "normal",
        badge_overlay_tint: "",
        badge_recolor_enabled: false,
        badge_overrides: {},
      };
      const { data } = await api.put("/me/profile", updatedProfile);
      setUser(data);
      toast.success("Badge styling updated!");
      setShowPaintModal(false);
    } catch {
      toast.error("Failed to save badge styling");
    }
  };

  const handleIconUpload = async (file) => {
    if (!file) return;
    setIconUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "asset");
      const { data } = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCustomBadge((prev) => ({ ...prev, icon_url: data.url }));
      toast.success("Badge icon uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setIconUploading(false);
    }
  };

  const handleCreateCustomBadge = async (e) => {
    e.preventDefault();
    if (gate.guard("creating custom badge")) return;
    if (!customBadge.name || !customBadge.icon_url) {
      toast.error("Badge title and icon are required");
      return;
    }
    try {
      const nextBadges = [
        ...(user.custom_badges || []),
        {
          id: `custom_${Date.now()}`,
          name: customBadge.name,
          desc: customBadge.desc,
          icon: customBadge.icon_url,
          color: customBadge.color,
          glow: customBadge.glow,
          created_at: new Date().toISOString(),
        },
      ];
      const { data } = await api.put("/me/profile", { custom_badges: nextBadges });
      setUser(data);
      toast.success("Custom badge created!");
      setShowCreateModal(false);
      setCustomBadge({
        name: "",
        desc: "",
        icon_url: "",
        color: "#74578c",
        glow: "hsla(272, 24%, 46%, 0.4)",
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create badge");
    }
  };

  const unlockedCount = owned.size;
  const totalCount = gridCatalog.length;

  return (
    <div data-testid="badges-page" className="space-y-6 pb-24 text-left">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#1a1a2e] text-[#7c8cf8]">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Badges</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Equip, organize, and inspect achievements displayed on your profile.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPaintModal(true)}
            data-testid="badge-style-open"
            className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            title="Badge Style"
          >
            <Paintbrush className="w-3.5 h-3.5 text-zinc-300" />
            <span>Badge Style</span>
          </button>
          <button
            type="button"
            onClick={() => (isPremium ? setShowCreateModal(true) : setPremiumFeature("Custom badges"))}
            className="px-4 py-2 rounded-xl bg-[#a48df4] hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
          >
            {!isPremium && <Lock className="w-3 h-3 text-amber-300" />}
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Badge</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Unlocked", value: `${unlockedCount} / ${totalCount}`, icon: Check },
          { label: "Equipped", value: equippedList.length, icon: Eye },
          { label: "Placement", value: (paintSettings.badge_placement || "next_to_name").replace(/_/g, " "), icon: GripVertical },
          { label: "Glow", value: paintSettings.glow ? "On" : "Off", icon: Paintbrush },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#111111] p-4">
            <div className="min-w-0">
              <div className="text-xs text-zinc-400">{s.label}</div>
              <div className="mt-1 truncate text-xl font-bold capitalize text-white">{s.value}</div>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7c8cf8]/30 bg-[#1a1a2e] text-[#7c8cf8]">
              <s.icon className="h-4 w-4" />
            </span>
          </div>
        ))}
      </div>

      {/* TOP SECTION: UNLOCKED BADGES (Section inside a Section with Organizing) */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#111111] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Unlocked Badges</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#a48df4]/20 border border-[#a48df4]/35 text-[10px] font-bold text-white font-mono">
                {unlockedCount} / {totalCount}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Organize and prioritize your unlocked achievements on your profile card.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Position:</span>
            <span className="text-white font-semibold capitalize">
              {(paintSettings.badge_placement || "next_to_name").replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Section inside a Section with Organizing */}
        <div className="rounded-xl border border-white/[0.06] bg-[#09090b] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">Equipped Badge Preview & Order</span>
            <span className="text-[11px] text-zinc-500">Drag or use arrow buttons to reorder</span>
          </div>

          {/* Live Preview Strip */}
          <div className="min-h-[58px] rounded-xl border border-white/5 bg-[#111111] p-3 flex items-center justify-center">
            {equippedList.length > 0 ? (
              <BadgePreviewRow
                ids={equippedList}
                glow={paintSettings.glow}
                glowColor={paintSettings.glow_color}
                glowIntensity={paintSettings.glow_intensity}
                overlay={paintSettings.overlay}
                overlayColor={paintSettings.overlay_color}
                overlayStrength={paintSettings.overlay_strength}
              />
            ) : (
              <p className="text-xs text-zinc-500">No badges equipped yet. Choose from your unlocked badges below.</p>
            )}
          </div>

          {/* Organizing Strip of Unlocked & Equipped Badges */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-zinc-300">Active Badges Organizer:</div>
            {equippedList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {equippedList.map((id, i) => (
                  <div
                    key={`${id}-${i}`}
                    draggable
                    data-testid={`equipped-badge-${i}`}
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { reorderEquipped(dragIndex, i); setDragIndex(null); }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold text-zinc-200 transition ${
                      dragIndex === i ? "border-[#a48df4] bg-[#a48df4]/20" : "border-white/10 bg-[#111111] hover:border-white/20"
                    }`}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-zinc-500 cursor-grab" />
                    <BadgeChip id={id} {...globalChip} size="sm" />
                    <span className="truncate max-w-[120px]">{nameOf(id)}</span>

                    {/* Move Controls */}
                    <div className="flex items-center gap-0.5 ml-1 border-l border-white/10 pl-1.5">
                      <button
                        type="button"
                        onClick={() => reorderEquipped(i, i - 1)}
                        disabled={i === 0}
                        title="Move left"
                        className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => reorderEquipped(i, i + 1)}
                        disabled={i === equippedList.length - 1}
                        title="Move right"
                        className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleEquip(id)}
                        title="Unequip badge"
                        className="p-1 rounded text-red-400 hover:text-red-300 ml-0.5 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">No badges currently equipped.</p>
            )}
          </div>

          {/* Quick Placement Selector */}
          <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-zinc-300">Badge Placement on Card:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "next_to_name", label: "Next to Name" },
                { id: "below_name", label: "Below Name" },
                { id: "above_name", label: "Above Name" },
                { id: "card_top_right", label: "Top Right" },
                { id: "card_bottom", label: "Bottom" },
              ].map(({ id, label }) => {
                const active = (paintSettings.badge_placement || "next_to_name") === id;
                return (
                  <button
                    key={id}
                    type="button"
                    data-testid={`badge-pos-${id}`}
                    onClick={() => handlePlacementChange(id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition border cursor-pointer ${
                      active
                        ? "bg-[#a48df4]/25 text-white border-[#a48df4]/60 shadow-sm"
                        : "bg-[#111111] text-zinc-400 border-white/10 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* BELOW SECTION: ALL ACTUAL BADGES (With Unlocked/Locked & Big Tooltip on Hover) */}
      <section className="space-y-4">
        {/* Search, Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl border border-white/[0.08] bg-[#111111] shadow-lg">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="badges-search"
              placeholder="Search badges…"
              className="w-full rounded-xl border border-white/10 bg-[#09090b] py-2 pl-10 pr-3 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[#a48df4]/60"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#09090b] p-1">
            {[["all", "All"], ["owned", "Unlocked"], ["locked", "Locked"], ["equipped", "Equipped"]].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilterBy(id)}
                data-testid={`badges-filter-${id}`}
                aria-pressed={filterBy === id}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                  filterBy === id ? "bg-[#a48df4]/25 text-white border border-[#a48df4]/50" : "text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <SmartSelect
            testid="badges-sort"
            ariaLabel="Sort badges"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: "owned", label: "Owned first" },
              { value: "az", label: "A–Z" },
              { value: "id", label: "Default order" },
            ]}
          />
        </div>

        {/* Badges Counter Line */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
          <span>Showing {visibleBadges.length} of {gridCatalog.length} badges</span>
          <span>{owned.size} unlocked · {equippedList.length} equipped</span>
        </div>

        {/* Badges Grid */}
        {visibleBadges.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-8">
            <EmptyState icon={Search} title="No badges match" hint="Try a different search or filter." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {visibleBadges.map((b) => {
              const M = badgeMeta(b.id) || {};
              const isOwned = owned.has(b.id);
              const isEquipped = equippedSet.has(b.id);

              return (
                <div
                  key={b.id}
                  className={`group relative p-3.5 rounded-2xl border transition duration-200 flex items-center justify-between gap-3 ${
                    isOwned
                      ? "border-white/[0.10] bg-[#111111] hover:border-[#a48df4]/50 shadow-md"
                      : "border-white/[0.05] bg-[#09090b]/60 opacity-80 hover:opacity-100 hover:border-white/10"
                  }`}
                >
                  {/* Left: Badge Icon + Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${
                      isOwned
                        ? "border-[#a48df4]/30 bg-[#a48df4]/15 shadow-sm"
                        : "border-white/10 bg-white/[0.02]"
                    }`}>
                      <BadgeChip
                        id={b.id}
                        meta={M}
                        {...globalChip}
                        size="md"
                        className="shrink-0"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{b.name || M.label || b.id}</span>
                      </div>

                      {/* Status row: Unlocked / Locked + Info indicator */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {isOwned ? (
                          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                            <Check className="h-2.5 w-2.5" /> Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#3f3f46]/30 border border-[#3f3f46]/50 text-zinc-400">
                            <Lock className="h-2.5 w-2.5" /> Locked
                          </span>
                        )}

                        {/* Indicator icon that triggers BIG TOOLTIP on hover */}
                        <div className="relative group/info cursor-help inline-flex items-center justify-center text-zinc-500 hover:text-white transition">
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />

                          {/* BIG TOOLTIP SECTION ABOVE IT WHEN HOVERED */}
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover/info:flex flex-col items-center z-50 w-64 sm:w-72 animate-in fade-in zoom-in-95 duration-150">
                            <div className="w-full p-4 rounded-2xl bg-[#111111] backdrop-blur-2xl border border-white/20 text-white shadow-[0_15px_50px_rgba(0,0,0,0.9)] text-left space-y-2.5">
                              {/* Tooltip Header */}
                              <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                                <BadgeChip id={b.id} meta={M} {...globalChip} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-white truncate">{b.name || M.label}</div>
                                  <div className="text-[10px] text-zinc-400 truncate">{b.type || M.group || "Badge"}</div>
                                </div>
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  isOwned ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-zinc-400"
                                }`}>
                                  {isOwned ? "Unlocked" : "Locked"}
                                </span>
                              </div>

                              {/* Description */}
                              <p className="text-[11px] leading-relaxed text-zinc-300">
                                {b.description || M.desc || "Achievement badge displayed on public profile cards."}
                              </p>

                              {/* Statistics & Attributes Section */}
                              <div className="pt-2 border-t border-white/10 space-y-1.5 text-[10px]">
                                <div className="flex items-center justify-between text-zinc-400">
                                  <span>Statistics & Rarity:</span>
                                  <span className="font-semibold text-white">{M.rarity || "Standard"}</span>
                                </div>
                                <div className="flex items-center justify-between text-zinc-400">
                                  <span>Category:</span>
                                  <span className="font-semibold text-white capitalize">{b.group || M.group || "Platform"}</span>
                                </div>
                                <div className="flex items-center justify-between text-zinc-400">
                                  <span>Card Status:</span>
                                  <span className="font-semibold text-white">{isEquipped ? "Equipped on Card" : isOwned ? "Unlocked in Vault" : "Not Earned Yet"}</span>
                                </div>
                              </div>
                            </div>
                            {/* Downward triangle pointer */}
                            <div className="w-2.5 h-2.5 bg-[#111111] rotate-45 -mt-1.5 border-r border-b border-white/20 shadow-lg" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Action: Equip / Equipped button */}
                  {isOwned ? (
                    <button
                      type="button"
                      onClick={() => toggleEquip(b.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-xl text-xs font-bold transition cursor-pointer px-3 py-1.5 ${
                        isEquipped
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-sm"
                          : "bg-white/[0.04] text-zinc-200 border border-white/10 hover:text-white hover:bg-white/[0.08]"
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Equipped</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Equip</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                      <Lock className="h-3 w-3" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Global Paint Styling Modal */}
      <PremiumGate
        open={!!premiumFeature}
        feature={premiumFeature}
        onClose={() => setPremiumFeature(null)}
      />

      {showPaintModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPaintModal(false); }}
        >
          <div className="bg-[#111111] rounded-2xl p-6 sm:p-7 max-w-lg w-full relative border border-white/15 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#a48df4]/15 border border-[#a48df4]/30 flex items-center justify-center">
                  <Paintbrush className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight uppercase">Badge Style</h3>
                  <p className="text-xs text-zinc-400">Configure global badge glow and overlay effects</p>
                </div>
              </div>
              <button onClick={() => setShowPaintModal(false)} className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-[#09090b] px-3.5 py-3">
                <div>
                  <span className="text-xs font-bold text-white block">Glow</span>
                  <span className="text-[11px] text-zinc-400">Enable glowing aura around badges</span>
                </div>
                <Switch
                  data-testid="badge-glow-toggle"
                  checked={paintSettings.glow}
                  onCheckedChange={(v) => setPaintSettings({ ...paintSettings, glow: v })}
                />
              </label>

              <ColorPicker label="Glow Color" value={paintSettings.glow_color} onChange={(v) => setPaintSettings({ ...paintSettings, glow_color: v })} />
              
              <div className="rounded-xl border border-white/10 bg-[#09090b] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span>Glow Intensity</span>
                  <span className="font-mono text-white text-xs font-bold">{paintSettings.glow_intensity}%</span>
                </div>
                <Slider
                  data-testid="glow-intensity-slider"
                  min={0}
                  max={100}
                  step={1}
                  value={[paintSettings.glow_intensity]}
                  onValueChange={([v]) => setPaintSettings({ ...paintSettings, glow_intensity: v })}
                  aria-label="Badge glow intensity"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-[#09090b] px-3.5 py-3">
                <div>
                  <span className="text-xs font-bold text-white block">Overlay</span>
                  <span className="text-[11px] text-zinc-400">Tint badge artwork with custom hue</span>
                </div>
                <Switch
                  data-testid="badge-overlay-toggle"
                  checked={paintSettings.overlay}
                  onCheckedChange={(v) => setPaintSettings({ ...paintSettings, overlay: v })}
                />
              </label>

              <ColorPicker label="Overlay Color" value={paintSettings.overlay_color} onChange={(v) => setPaintSettings({ ...paintSettings, overlay_color: v })} />

              <div className="rounded-xl border border-white/10 bg-[#09090b] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span>Overlay Strength</span>
                  <span className="font-mono text-white text-xs font-bold">{paintSettings.overlay_strength}%</span>
                </div>
                <Slider
                  data-testid="badge-overlay-slider"
                  min={0}
                  max={100}
                  step={1}
                  value={[paintSettings.overlay_strength]}
                  onValueChange={([v]) => setPaintSettings({ ...paintSettings, overlay_strength: v })}
                  aria-label="Badge overlay strength"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPaintModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={savePaintSettings}
                  className="px-5 py-2 rounded-xl bg-[#a48df4] hover:brightness-110 text-white text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Save Badge Styling
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Badge Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div className="bg-[#111111] rounded-2xl p-6 sm:p-7 max-w-lg w-full relative border border-white/15 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#a48df4]/15 border border-[#a48df4]/30 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight uppercase">Create Custom Badge</h3>
                  <p className="text-xs text-zinc-400">Design an exclusive badge for your profile</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomBadge} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Badge Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Creator, Top Supporter"
                  value={customBadge.name}
                  onChange={(e) => setCustomBadge({ ...customBadge, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0d0d] border border-white/10 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#a48df4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description of this badge achievement…"
                  value={customBadge.desc}
                  onChange={(e) => setCustomBadge({ ...customBadge, desc: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0d0d] border border-white/10 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#a48df4] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Badge Icon Image</label>
                <div className="flex items-center gap-3">
                  {customBadge.icon_url ? (
                    <div className="w-12 h-12 rounded-xl bg-[#0d0d0d] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={fileUrl(customBadge.icon_url)} alt="Badge preview" className="w-8 h-8 object-contain" />
                    </div>
                  ) : null}
                  <input
                    type="file"
                    accept="image/*"
                    id="custom-badge-icon"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleIconUpload(file);
                    }}
                  />
                  <label
                    htmlFor="custom-badge-icon"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold text-zinc-300 cursor-pointer transition"
                  >
                    {iconUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-zinc-400" />}
                    <span>{customBadge.icon_url ? "Replace Icon Image" : "Upload Badge PNG/SVG"}</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={iconUploading}
                  className="px-5 py-2 rounded-xl bg-[#a48df4] hover:brightness-110 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  Create Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
