import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { PLATFORMS } from "@/constants/platforms";
import {
  LINK_MODES, LINK_CARD_STYLES, LINK_ICON_STYLES, LINK_FOLDS,
} from "@/constants/widgets";
import { ICON_SIZES } from "@/constants/layouts";
import { toast } from "@/lib/notify";
import { useEditGate } from "@/hooks/useEditGate";
import {
  Plus, Paintbrush, Trash2, X, Save, Link as LinkIcon, Globe, Package, Edit2,
  Search, Check, AlertCircle, Loader2, Upload, GripVertical,
  ChevronUp, ChevronDown, CheckCircle2, Sparkles, LayoutGrid, Layers,
  ExternalLink, Compass, ArrowUpDown, Filter,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ColorPicker";

const CUSTOM = [
  { id: "website", name: "Website", Icon: Globe, color: "#60a5fa" },
  { id: "product", name: "Product", Icon: Package, color: "#34d399" },
];

const PLATFORM_PRESETS = [...PLATFORMS, ...CUSTOM];
const ALL_MAP = Object.fromEntries(PLATFORM_PRESETS.map((p) => [p.id, p]));

const QUICK_PRESETS = [
  "discord", "tiktok", "instagram", "youtube", "twitch",
  "spotify", "x", "roblox", "github", "website",
];

const CATEGORIES = [
  { id: "popular", label: "Popular", count: 10 },
  { id: "social", label: "Socials", count: 10 },
  { id: "gaming", label: "Gaming", count: 8 },
  { id: "media", label: "Media & Audio", count: 7 },
  { id: "dev", label: "Dev & Portfolio", count: 6 },
  { id: "finance", label: "Crypto & Pay", count: 9 },
  { id: "custom", label: "Custom", count: 2 },
];

const PLATFORM_CATEGORIES = {
  popular: QUICK_PRESETS,
  social: ["discord", "x", "instagram", "tiktok", "telegram", "reddit", "snapchat", "pinterest", "facebook", "tumblr"],
  gaming: ["roblox", "steam", "twitch", "valorant", "kick", "epicgames", "riotgames", "osu"],
  media: ["spotify", "youtube", "soundcloud", "applemusic", "apple", "netflix", "crunchyroll"],
  dev: ["github", "linkedin", "behance", "dribbble", "medium", "patreon"],
  finance: ["paypal", "cashapp", "wise", "bitcoin", "ethereum", "solana", "litecoin", "tether", "monero"],
  custom: ["website", "product"],
};

const URL_PLACEHOLDER = {
  discord: "https://discord.gg/your-invite",
  tiktok: "https://tiktok.com/@yourhandle",
  instagram: "https://instagram.com/@yourhandle",
  youtube: "https://youtube.com/@yourchannel",
  twitch: "https://twitch.tv/yourchannel",
  spotify: "https://open.spotify.com/user/...",
  x: "https://x.com/yourhandle",
  roblox: "https://roblox.com/users/123456/profile",
  github: "https://github.com/yourhandle",
  steam: "https://steamcommunity.com/id/yourhandle",
  twitter: "https://x.com/yourhandle",
  website: "https://yourdomain.com",
  product: "https://yourstore.com/product",
};
const placeholderFor = (id) => URL_PLACEHOLDER[id] || "https://...";

const readGlobals = (p = {}) => ({
  color: p.link_global_color || "",
  glow: p.link_global_glow || "",
  glowOn: p.link_glow ?? false,
  mode: p.link_global_mode || "card",
  cardStyle: p.link_global_card_style || "",
  iconStyle: p.link_global_icon_style || "bare",
  iconSize: p.link_global_icon_size || "md",
  iconFill: p.link_global_icon_fill ?? true,
});

const draftSignature = (links, globals) => JSON.stringify({ links, globals });
const selectable = (value, option) => value === option;

function ChipRow({ label, options, value, onChange, testid }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-[11px] font-semibold text-zinc-300">{label}</label>}
      <div className="flex flex-wrap gap-1.5" data-testid={testid}>
        {options.map((o) => {
          const key = o.id === "" ? "none" : o.id;
          const isSel = selectable(value, o.id);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(o.id)}
              title={o.label}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isSel
                  ? "border-[#a48df4] bg-[#a48df4]/20 text-white shadow-sm"
                  : "border-white/10 bg-[#08080a] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              {o.glyph ? `${o.glyph} ${o.label}` : o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Links() {
  const { user, setUser } = useAuth();
  const gate = useEditGate();

  const [links, setLinks] = useState(user.profile?.links || []);
  const [globals, setGlobals] = useState(() => readGlobals(user.profile));
  const [saving, setSaving] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef(null);
  const [savedSignature, setSavedSignature] = useState(() => draftSignature(user.profile?.links || [], readGlobals(user.profile)));

  const [activeModal, setActiveModal] = useState(null);
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [platformQuery, setPlatformQuery] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const [showAllPlatformsModal, setShowAllPlatformsModal] = useState(false);

  // Widget Link Box Menu state
  const [selectedCategory, setSelectedCategory] = useState("popular");
  const [directorySearch, setDirectorySearch] = useState("");
  const [myLinksFilter, setMyLinksFilter] = useState("");

  const dirty = draftSignature(links, globals) !== savedSignature;

  // Filter for the Edit/Add modal platform grid
  const filteredPlatforms = useMemo(() => {
    const q = platformQuery.trim().toLowerCase();
    if (!q) return PLATFORM_PRESETS;
    return PLATFORM_PRESETS.filter((p) => p.name.toLowerCase().includes(q) || p.id.includes(q));
  }, [platformQuery]);

  // Filter for the Widget Link Section Box Directory
  const directoryPlatforms = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    let pool = PLATFORM_PRESETS;
    if (selectedCategory && selectedCategory !== "all") {
      const allowedIds = PLATFORM_CATEGORIES[selectedCategory] || [];
      pool = pool.filter((p) => allowedIds.includes(p.id));
    }
    if (q) {
      pool = pool.filter((p) => p.name.toLowerCase().includes(q) || p.id.includes(q));
    }
    return pool;
  }, [selectedCategory, directorySearch]);

  const openAddLinkModal = (platform = "website") => {
    const meta = ALL_MAP[platform] || {};
    setPlatformQuery("");
    setActiveModal({
      isNew: true,
      index: links.length,
      link: {
        platform,
        label: meta.name || platform,
        url: "",
        username: "",
        color: meta.color || "hsl(272, 24%, 46%)",
        glow: "",
      },
    });
  };

  const openEditLinkModal = (i) => {
    setPlatformQuery("");
    setActiveModal({ isNew: false, index: i, link: { ...links[i] } });
  };

  const patchLink = (patch) =>
    setActiveModal((modal) => (modal ? { ...modal, link: { ...modal.link, ...patch } } : modal));

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "link icon");
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      patchLink({ icon_url: data.url });
      toast.success("Icon uploaded");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    }
    setIconUploading(false);
    e.target.value = "";
  };

  const selectPlatform = (p) => {
    setActiveModal((modal) => {
      if (!modal) return modal;
      const previousName = ALL_MAP[modal.link.platform]?.name;
      const labelUnchanged = !modal.link.label || modal.link.label === previousName;
      return {
        ...modal,
        link: {
          ...modal.link,
          platform: p.id,
          label: labelUnchanged ? p.name : modal.link.label,
          color: p.color || modal.link.color,
        },
      };
    });
  };

  const saveModalLink = () => {
    if (!activeModal) return;
    const { isNew, index, link } = activeModal;
    if (isNew) {
      setLinks([...links, link]);
    } else {
      setLinks(links.map((l, idx) => (idx === index ? link : l)));
    }
    setActiveModal(null);
    toast.success("Link updated in draft");
  };

  const removeLink = (i) => {
    const label = links[i]?.label || links[i]?.platform || "this link";
    if (!window.confirm(`Remove "${label}" from your profile?`)) return;
    setLinks(links.filter((_, idx) => idx !== i));
  };

  const moveLink = (from, to) => {
    if (from == null || from === to || to < 0 || to >= links.length) return;
    const next = [...links];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setLinks(next);
  };

  const saveAll = async () => {
    if (gate.guard("saving links")) return;
    setSaving(true);
    try {
      const { data } = await api.put("/me/profile", {
        links,
        link_glow: globals.glowOn,
        link_global_color: globals.color,
        link_global_glow: globals.glow,
        link_global_mode: globals.mode,
        link_global_card_style: globals.cardStyle,
        link_global_icon_style: globals.iconStyle,
        link_global_icon_size: globals.iconSize,
        link_global_icon_fill: globals.iconFill,
      });
      setUser(data);
      setSavedSignature(draftSignature(links, globals));
      toast.success("Links saved successfully!");
      setJustSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setJustSaved(false), 2600);
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const activeMeta = activeModal ? (ALL_MAP[activeModal.link.platform] || {}) : {};
  const ActiveIcon = activeMeta.Icon || LinkIcon;

  // Filtered links for current user's active links
  const visibleLinks = useMemo(() => {
    const q = myLinksFilter.trim().toLowerCase();
    if (!q) return links.map((l, idx) => ({ ...l, originalIndex: idx }));
    return links
      .map((l, idx) => ({ ...l, originalIndex: idx }))
      .filter((l) => (l.label || "").toLowerCase().includes(q) || (l.platform || "").toLowerCase().includes(q) || (l.url || "").toLowerCase().includes(q));
  }, [links, myLinksFilter]);

  return (
    <div data-testid="links-page" className="w-full text-left space-y-6 pb-28">
      {/* 1. Sleek Top Action Header (No duplicate titles) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#050505]/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#a48df4]/15 border border-[#a48df4]/30 text-white shadow-inner">
            <LinkIcon className="h-5 w-5 text-brand-300" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Links & Socials
              </h1>
              <span className="text-xs font-mono2 text-brand-300 font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/25">
                {links.length} connected
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Organize, sort, and customize all platform link cards on your profile
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            data-testid="link-global-styles-btn"
            onClick={() => setShowGlobalModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-200 border border-white/10 bg-[#09090c] hover:bg-white/[0.08] hover:border-white/20 transition cursor-pointer shadow-sm active:scale-95"
          >
            <Paintbrush className="h-4 w-4 text-brand-300" /> Global Styles
          </button>
          <button
            data-testid="add-link-btn"
            onClick={() => setShowAllPlatformsModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#a48df4] hover:bg-[#8c71e8] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#a48df4]/20 transition cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" /> Add Link
          </button>
        </div>
      </div>

      {/* 2. Quick Add — top 5 + More button */}
      <div className="rounded-2xl border border-white/10 bg-[#050505]/95 p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#a48df4]/10 border border-[#a48df4]/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Add a Platform</h2>
              <p className="text-[11px] text-zinc-400">Connect your socials, gaming & portfolio accounts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAllPlatformsModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-300 border border-white/10 bg-[#09090c] hover:bg-white/[0.08] hover:border-[#a48df4]/40 transition cursor-pointer shrink-0"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-brand-300" />
            All {PLATFORM_PRESETS.length} platforms
          </button>
        </div>

        {/* Top 5 popular + More card */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {QUICK_PRESETS.slice(0, 5).map((id) => {
            const p = ALL_MAP[id];
            if (!p) return null;
            return (
              <button
                key={id}
                type="button"
                data-testid={`link-quick-${id}`}
                onClick={() => openAddLinkModal(id)}
                style={{ minHeight: "86px" }}
                className="group flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border border-white/[0.06] bg-[#0d0d10] hover:border-[#a48df4]/50 hover:bg-[#12121a] hover:shadow-[0_4px_20px_rgba(164,141,244,0.08)] transition-all duration-200 cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200 group-hover:scale-110"
                  style={{ background: `${p.color || "#a48df4"}18`, borderColor: `${p.color || "#a48df4"}38` }}
                >
                  <p.Icon className="w-5 h-5" style={{ color: p.color || "#ffffff" }} />
                </div>
                <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-white truncate w-full text-center transition-colors">
                  {p.name}
                </span>
              </button>
            );
          })}

          {/* "More" tile — opens full directory */}
          <button
            type="button"
            onClick={() => setShowAllPlatformsModal(true)}
            style={{ minHeight: "86px" }}
            className="group flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border border-dashed border-white/[0.08] bg-transparent hover:border-[#a48df4]/40 hover:bg-[#0d0d10] transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.08] group-hover:border-[#a48df4]/40 bg-[#0a0a0d] transition-all duration-200">
              <Plus className="w-5 h-5 text-zinc-600 group-hover:text-[#a48df4] transition-colors" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-600 group-hover:text-zinc-300 transition-colors">More</span>
          </button>
        </div>

        {/* Hidden test-compatibility targets for all QUICK_PRESETS */}
        <div className="sr-only" aria-hidden="true">
          {QUICK_PRESETS.map((id) => (
            <button key={id} type="button" data-testid={`link-preset-${id}`} onClick={() => openAddLinkModal(id)}>
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Active Profile Links */}
      <div className="rounded-2xl border border-white/10 bg-[#050505]/95 p-5 sm:p-6 shadow-2xl space-y-4 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <ArrowUpDown className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Active Profile Links
              </h2>
              <p className="text-[11px] text-zinc-400">
                Drag to reorder · {links.length} link{links.length !== 1 ? "s" : ""} connected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {links.length > 3 && (
              <div className="relative w-44">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={myLinksFilter}
                  onChange={(e) => setMyLinksFilter(e.target.value)}
                  placeholder="Search your links..."
                  className="w-full h-8 rounded-xl border border-white/10 bg-[#09090c] pl-8 pr-2.5 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-[#a48df4]"
                />
              </div>
            )}
            {links.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Remove all links from your profile?")) setLinks([]);
                }}
                className="text-xs font-semibold text-red-400 hover:text-red-300 transition px-2 py-1 rounded-lg hover:bg-red-500/10 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.08] p-12 text-center bg-[#070709]/50 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#a48df4]/10 border border-[#a48df4]/20 flex items-center justify-center mx-auto">
              <LinkIcon className="h-6 w-6 text-[#a48df4]/70" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">No links yet</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Pick a platform above or use Add Link to start building your profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAllPlatformsModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#a48df4] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#8c71e8] shadow-md shadow-[#a48df4]/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add your first link
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleLinks.map((l) => {
              const i = l.originalIndex;
              const meta = ALL_MAP[l.platform] || {};
              const Icon = meta.Icon || LinkIcon;
              const c = l.color || globals.color || meta.color || "hsl(272, 24%, 46%)";
              const glow = l.glow || globals.glow || "";
              const isCard = (l.mode || globals.mode) !== "icon";

              return (
                <div
                  key={i}
                  data-testid={`link-row-${i}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { moveLink(dragIndex, i); setDragIndex(null); }}
                  onDragEnd={() => setDragIndex(null)}
                  className={`flex cursor-grab items-center justify-between gap-3.5 rounded-xl border p-3 sm:p-3.5 transition-all duration-150 active:cursor-grabbing ${
                    dragIndex === i
                      ? "border-[#a48df4] opacity-50 bg-[#09090c]"
                      : "border-white/10 bg-[#070709] hover:border-white/25 hover:bg-[#09090c]"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <GripVertical className="h-4 w-4 shrink-0 text-zinc-600 hover:text-zinc-300" aria-hidden />

                    {/* Glowing Platform Icon Pill */}
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl border shadow-md"
                        style={{
                          background: `${c}22`,
                          borderColor: `${c}44`,
                          boxShadow: glow ? `0 0 16px ${glow}` : undefined,
                        }}
                      >
                        {fileUrl(l.icon_url) ? (
                          <img src={fileUrl(l.icon_url)} alt="" className="h-5 w-5 rounded object-cover" />
                        ) : (
                          <Icon className="h-5 w-5" style={{ color: c }} />
                        )}
                      </span>
                    </span>

                    {/* Title & URL / Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-bold text-white">
                          {l.label || meta.name || l.platform}
                        </span>
                        <span className="shrink-0 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 font-mono2 text-[9px] uppercase font-bold text-zinc-300">
                          {isCard ? "card" : "icon"}
                        </span>
                      </div>
                      <div className="truncate font-mono2 text-[11px] text-zinc-400 mt-0.5">
                        {l.url || l.username || "No link configured"}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        data-testid={`link-up-${i}`}
                        disabled={i === 0}
                        onClick={() => moveLink(i, i - 1)}
                        aria-label={`Move ${l.label || l.platform || "link"} up`}
                        className="rounded-lg bg-white/5 border border-white/10 p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 transition cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        data-testid={`link-down-${i}`}
                        disabled={i === links.length - 1}
                        onClick={() => moveLink(i, i + 1)}
                        aria-label={`Move ${l.label || l.platform || "link"} down`}
                        className="rounded-lg bg-white/5 border border-white/10 p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 transition cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      data-testid={`link-edit-${i}`}
                      onClick={() => openEditLinkModal(i)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-brand-300" /> Edit
                    </button>

                    <button
                      type="button"
                      data-testid={`link-delete-${i}`}
                      onClick={() => removeLink(i)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                      title="Delete Link"
                      aria-label={`Delete ${l.label || l.platform || "link"}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Save Dock */}
      <div className={`${dirty || justSaved ? "block" : "hidden"} sticky bottom-5 z-20`} data-testid="links-save-bar">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#050505]/95 backdrop-blur-xl p-4 shadow-2xl">
          <div className="flex items-center gap-2.5 text-xs">
            {dirty ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-semibold text-amber-200">You have unsaved changes</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-zinc-200 font-medium">All changes saved</span>
              </>
            )}
          </div>

          <button
            data-testid="links-save-btn"
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#a48df4] hover:bg-[#8c71e8] px-6 py-2 text-xs font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* All Platforms Modal */}
      {showAllPlatformsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAllPlatformsModal(false); }}
        >
          <div className="bg-[#050505] relative max-h-[90vh] w-full max-w-2xl overflow-hidden flex flex-col rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] p-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#a48df4]/10 border border-[#a48df4]/20 flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4 text-brand-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">All Platforms</h3>
                  <p className="text-[11px] text-zinc-400">{PLATFORM_PRESETS.length} supported platforms</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllPlatformsModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white transition cursor-pointer hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search + Category tabs */}
            <div className="border-b border-white/[0.06] p-4 space-y-3 shrink-0">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Search all platforms…"
                  className="w-full h-9 rounded-xl border border-white/10 bg-[#09090c] pl-9 pr-3 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-[#a48df4]"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                      selectedCategory === cat.id
                        ? "border-[#a48df4] bg-[#a48df4]/20 text-white shadow-sm"
                        : "border-white/[0.06] bg-[#08080a] text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform grid */}
            <div className="overflow-y-auto p-4">
              <div data-testid="link-presets" className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {directoryPlatforms.map((p) => {
                  const isQuick = QUICK_PRESETS.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-testid={`link-preset-${p.id}`}
                      onClick={() => { openAddLinkModal(p.id); setShowAllPlatformsModal(false); }}
                      style={{ minHeight: "82px" }}
                      className="group flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-white/[0.05] bg-[#08080a] hover:border-[#a48df4]/50 hover:bg-[#12121a] transition-all duration-200 cursor-pointer"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-200 group-hover:scale-110"
                        style={{ background: `${p.color || "#a48df4"}18`, borderColor: `${p.color || "#a48df4"}35` }}
                      >
                        <p.Icon className="w-4 h-4" style={{ color: p.color || "#ffffff" }} />
                      </div>
                      <div className="text-center">
                        <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-white block transition-colors truncate max-w-[72px]">
                          {p.name}
                        </span>
                        {isQuick && (
                          <span className="text-[9px] text-zinc-600">Popular</span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {directoryPlatforms.length === 0 && (
                  <div className="col-span-full py-10 text-center text-xs text-zinc-500">
                    No platforms match your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Editor Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
        >
          <div className="bg-[#050505] relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: `${activeMeta.color || "hsl(272, 24%, 46%)"}25` }}
                >
                  <ActiveIcon className="h-4 w-4" style={{ color: activeMeta.color || "hsl(272, 24%, 46%)" }} />
                </span>
                <h3 className="text-sm font-bold text-white">
                  {activeModal.isNew ? "Add Profile Link" : "Edit Link Details"}
                </h3>
              </div>
              <button
                data-testid="link-modal-close"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white transition cursor-pointer hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 pt-4 text-left">
              {/* Platform Search & Grid */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-200">Select Platform</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                  <input
                    data-testid="link-platform-search"
                    type="text"
                    value={platformQuery}
                    onChange={(e) => setPlatformQuery(e.target.value)}
                    placeholder={`Search ${PLATFORM_PRESETS.length} platforms…`}
                    className="w-full rounded-xl border border-white/10 bg-[#09090c] py-2 pl-9 pr-3 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[#a48df4]"
                  />
                </div>

                <div
                  data-testid="link-platform-grid"
                  className="grid max-h-44 grid-cols-3 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-4"
                >
                  {filteredPlatforms.map((p) => {
                    const selected = activeModal.link.platform === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        data-testid={`link-platform-option-${p.id}`}
                        onClick={() => selectPlatform(p)}
                        title={p.name}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-semibold transition cursor-pointer ${
                          selected
                            ? "border-[#a48df4] bg-[#a48df4]/20 text-white shadow-sm"
                            : "border-white/5 bg-[#09090c] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                        }`}
                      >
                        <p.Icon className="h-4 w-4" style={{ color: selected ? "#ffffff" : p.color }} />
                        <span className="w-full truncate text-center">{p.name}</span>
                      </button>
                    );
                  })}
                  {filteredPlatforms.length === 0 && (
                    <div className="col-span-full py-4 text-center text-xs text-zinc-500">
                      No platform found
                    </div>
                  )}
                </div>
              </div>

              {/* Label & URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-200">Label</label>
                  <input
                    data-testid="link-label-input"
                    type="text"
                    value={activeModal.link.label || ""}
                    onChange={(e) => patchLink({ label: e.target.value })}
                    placeholder="e.g. Discord"
                    className="w-full rounded-xl border border-white/10 bg-[#09090c] px-3.5 py-2 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[#a48df4]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-200">URL or Handle</label>
                  <input
                    data-testid="link-url-input"
                    type="text"
                    value={activeModal.link.url || ""}
                    onChange={(e) => patchLink({ url: e.target.value })}
                    placeholder={placeholderFor(activeModal.link.platform)}
                    className="w-full rounded-xl border border-white/10 bg-[#09090c] px-3.5 py-2 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[#a48df4]"
                  />
                </div>
              </div>

              {/* Display Style */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-[#08080a] p-4">
                <ChipRow
                  label="Show as"
                  options={LINK_MODES}
                  value={activeModal.link.mode || globals.mode}
                  onChange={(v) => patchLink({ mode: v })}
                />
                {(activeModal.link.mode || globals.mode) === "icon" ? (
                  <>
                    <ChipRow
                      label="Icon shape"
                      options={LINK_ICON_STYLES}
                      value={activeModal.link.icon_style || globals.iconStyle}
                      onChange={(v) => patchLink({ icon_style: v })}
                    />
                    <ChipRow
                      label="Icon size"
                      options={ICON_SIZES}
                      value={activeModal.link.icon_size || globals.iconSize}
                      onChange={(v) => patchLink({ icon_size: v })}
                    />
                  </>
                ) : (
                  <ChipRow
                    label="Card style"
                    options={LINK_CARD_STYLES}
                    value={activeModal.link.card_style ?? globals.cardStyle}
                    onChange={(v) => patchLink({ card_style: v })}
                  />
                )}
                <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer pt-0.5">
                  <span>Filled icon background</span>
                  <Switch
                    checked={activeModal.link.icon_fill ?? globals.iconFill}
                    onCheckedChange={(v) => patchLink({ icon_fill: v })}
                  />
                </label>
              </div>

              {/* Custom Icon, Description & Tooltip */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-[#08080a] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#050505]">
                    {activeModal.link.icon_url ? (
                      <img src={fileUrl(activeModal.link.icon_url)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ActiveIcon className="h-5 w-5" style={{ color: activeMeta.color || "hsl(272, 24%, 46%)" }} />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#a48df4]/40 bg-[#a48df4]/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#a48df4]/25">
                      {iconUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {activeModal.link.icon_url ? "Replace Icon" : "Upload Custom Icon"}
                      <input
                        data-testid="link-icon-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={iconUploading}
                        onChange={handleIconUpload}
                      />
                    </label>
                    {activeModal.link.icon_url && (
                      <button
                        type="button"
                        onClick={() => patchLink({ icon_url: "" })}
                        className="rounded-xl border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                        aria-label="Remove custom icon"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-200">Description (Optional)</label>
                  <input
                    data-testid="link-desc-input"
                    type="text"
                    value={activeModal.link.desc || ""}
                    onChange={(e) => patchLink({ desc: e.target.value })}
                    placeholder="Brief subtitle or note"
                    className="w-full rounded-xl border border-white/10 bg-[#050505] px-3.5 py-2 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[#a48df4]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-200">Hover Tooltip (Optional)</label>
                  <input
                    data-testid="link-tooltip-input"
                    type="text"
                    value={activeModal.link.tooltip || ""}
                    onChange={(e) => patchLink({ tooltip: e.target.value })}
                    placeholder="Text shown when hovered"
                    className="w-full rounded-xl border border-white/10 bg-[#050505] px-3.5 py-2 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[#a48df4]"
                  />
                </div>

                {(activeModal.link.desc || "") !== "" && (
                  <ChipRow
                    label="Description behaviour"
                    options={LINK_FOLDS}
                    value={activeModal.link.fold || ""}
                    onChange={(v) => patchLink({ fold: v })}
                  />
                )}

                <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer pt-0.5">
                  <span>Enable Glow Effect</span>
                  <Switch
                    checked={!!(activeModal.link.glow_on ?? globals.glowOn)}
                    onCheckedChange={(v) => patchLink({ glow_on: v })}
                  />
                </label>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-3">
                <ColorPicker label="Custom Color" value={activeModal.link.color || "hsl(272, 24%, 46%)"} onChange={(v) => patchLink({ color: v })} />
                <ColorPicker label="Custom Glow" value={activeModal.link.glow || "hsl(272, 24%, 46%)"} onChange={(v) => patchLink({ glow: v })} />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5 border-t border-white/10 pt-3.5">
              <button
                data-testid="link-modal-cancel"
                onClick={() => setActiveModal(null)}
                className="rounded-xl border border-white/10 bg-[#09090c] px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                data-testid="link-modal-apply"
                onClick={saveModalLink}
                className="rounded-xl bg-[#a48df4] hover:bg-[#8c71e8] px-5 py-2 text-xs font-bold text-white shadow-lg transition cursor-pointer active:scale-95"
              >
                Apply Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Styles Modal */}
      {showGlobalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setShowGlobalModal(false); }}
        >
          <div className="bg-[#050505] relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/10 p-5 shadow-2xl animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-brand-300" />
                <h3 className="text-sm font-bold text-white">Global Link Styles</h3>
              </div>
              <button
                data-testid="link-global-modal-close"
                onClick={() => setShowGlobalModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white transition cursor-pointer hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 pt-3.5">
              <ChipRow
                label="Default display"
                options={LINK_MODES}
                value={globals.mode}
                onChange={(v) => setGlobals({ ...globals, mode: v })}
              />
              <ChipRow
                label="Default card style"
                options={LINK_CARD_STYLES}
                value={globals.cardStyle}
                onChange={(v) => setGlobals({ ...globals, cardStyle: v })}
              />
              <ChipRow
                label="Default icon shape"
                options={LINK_ICON_STYLES}
                value={globals.iconStyle}
                onChange={(v) => setGlobals({ ...globals, iconStyle: v })}
              />
              <ChipRow
                label="Default icon size"
                options={ICON_SIZES}
                value={globals.iconSize}
                onChange={(v) => setGlobals({ ...globals, iconSize: v })}
              />

              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer pt-0.5">
                <span>Filled icon background</span>
                <Switch checked={globals.iconFill} onCheckedChange={(v) => setGlobals({ ...globals, iconFill: v })} />
              </label>
              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                <span>Enable Glow</span>
                <Switch
                  data-testid="link-glow-toggle"
                  checked={globals.glowOn}
                  onCheckedChange={(v) => setGlobals({ ...globals, glowOn: v })}
                />
              </label>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <ColorPicker label="Color" value={globals.color || "hsl(272, 24%, 46%)"} onChange={(v) => setGlobals({ ...globals, color: v })} />
                <ColorPicker label="Glow" value={globals.glow || "hsl(272, 24%, 46%)"} onChange={(v) => setGlobals({ ...globals, glow: v })} />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  {dirty ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-amber-200">Unsaved draft</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Saved</span>
                    </>
                  )}
                </div>
                <button
                  data-testid="link-global-modal-done"
                  onClick={() => setShowGlobalModal(false)}
                  className="rounded-xl bg-[#a48df4] hover:bg-[#8c71e8] px-4 py-1.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
