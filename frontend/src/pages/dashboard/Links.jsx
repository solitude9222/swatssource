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
  ExternalLink, Search, Check, AlertCircle, Loader2, Upload, GripVertical,
  ChevronUp, ChevronDown, Sparkles, Smartphone, Eye, CheckCircle2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ColorPicker";

const CUSTOM = [
  { id: "website", name: "Website", Icon: Globe, color: "#60a5fa" },
  { id: "product", name: "Product", Icon: Package, color: "#34d399" },
];

// Catalogue of presets
const PLATFORM_PRESETS = [...PLATFORMS, ...CUSTOM];
const ALL_MAP = Object.fromEntries(PLATFORM_PRESETS.map((p) => [p.id, p]));

// Quick presets surfaced for immediate access
const QUICK_PRESETS = [
  "discord", "tiktok", "instagram", "youtube", "twitch",
  "spotify", "x", "roblox", "github", "website",
];

// Per-platform URL hints
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

// Global defaults reader
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

// A row of single-choice chips using the strict palette
function ChipRow({ label, options, value, onChange, testid }) {
  return (
    <div>
      {label && <label className="mb-2 block text-[11px] font-semibold text-zinc-400">{label}</label>}
      <div className="flex flex-wrap gap-2" data-testid={testid}>
        {options.map((o) => {
          const key = o.id === "" ? "none" : o.id;
          const isSel = selectable(value, o.id);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(o.id)}
              title={o.label}
              className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                isSel
                  ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)]/20 text-white shadow-[0_0_12px_rgba(107,88,122,0.3)]"
                  : "border-[#3f3f46]/40 bg-[#111111]/60 text-zinc-400 hover:border-[#3f3f46] hover:text-zinc-200"
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

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // null | { isNew, index, link }
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [platformQuery, setPlatformQuery] = useState("");
  const [dragIndex, setDragIndex] = useState(null);

  const dirty = draftSignature(links, globals) !== savedSignature;

  const filteredPlatforms = useMemo(() => {
    const q = platformQuery.trim().toLowerCase();
    if (!q) return PLATFORM_PRESETS;
    return PLATFORM_PRESETS.filter((p) => p.name.toLowerCase().includes(q) || p.id.includes(q));
  }, [platformQuery]);

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
    if (from == null || from === to) return;
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

  return (
    <div data-testid="links-page" className="w-full text-left pb-24">
      {/* Studio Header Card */}
      <div className="mb-6 rounded-2xl border border-[#3f3f46]/30 bg-[#111111] p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(272,24%,46%)]/15 border border-[hsl(272,24%,46%)]/30 text-white">
                <LinkIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  Links Studio
                  <span className="text-xs font-mono2 font-normal text-zinc-400 px-2.5 py-0.5 rounded-full bg-[#09090b] border border-[#3f3f46]/40">
                    {links.length} {links.length === 1 ? "item" : "items"}
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure interactive link cards, social badges, custom icons, glow and animations.
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <button
              data-testid="link-global-styles-btn"
              onClick={() => setShowGlobalModal(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-300 border border-[#3f3f46]/40 bg-[#09090b] hover:bg-white/[0.05] hover:text-white transition cursor-pointer"
              title="Global Colors & Styles"
            >
              <Paintbrush className="h-4 w-4 text-[hsl(272,24%,65%)]" /> Global Styles
            </button>
            <button
              data-testid="add-link-btn"
              onClick={() => openAddLinkModal("discord")}
              className="flex items-center gap-2 rounded-xl bg-[hsl(272,24%,46%)] hover:bg-[hsl(272,24%,40%)] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[hsl(272,24%,46%)]/25 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Link
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls + Right Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_390px] gap-6 items-start">
        {/* Left Column: Presets + Active Links List */}
        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="rounded-2xl border border-[#3f3f46]/30 bg-[#111111] p-5 sm:p-6 space-y-3.5 shadow-xl" data-testid="link-presets">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[hsl(272,24%,65%)]" /> Quick Presets
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Click any platform to immediately add a pre-styled social card.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {QUICK_PRESETS.map((id) => {
                const preset = ALL_MAP[id];
                if (!preset) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    data-testid={`link-preset-${id}`}
                    onClick={() => openAddLinkModal(id)}
                    title={`Add ${preset.name}`}
                    className="group flex items-center gap-2.5 rounded-xl border border-[#3f3f46]/30 bg-[#09090b]/80 hover:bg-[#09090b] hover:border-[hsl(272,24%,46%)]/60 p-2.5 transition-all duration-200 cursor-pointer text-left"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                      style={{ background: `${preset.color}1f` }}
                    >
                      <preset.Icon className="h-3.5 w-3.5" style={{ color: preset.color }} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-300 group-hover:text-white">
                      {preset.name}
                    </span>
                    <Plus className="h-3 w-3 shrink-0 text-zinc-600 transition-colors duration-200 group-hover:text-white" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Links List */}
          <div className="rounded-2xl border border-[#3f3f46]/30 bg-[#111111] p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#3f3f46]/20 pb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Active Links &amp; Cards
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Drag rows to reorder how they appear on your profile.
                </p>
              </div>
              <span className="text-[11px] font-mono2 text-zinc-400">
                {links.length} total
              </span>
            </div>

            <div className="space-y-2.5">
              {links.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#3f3f46]/40 p-12 text-center bg-[#09090b]/50">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(272,24%,46%)]/10 text-white">
                    <LinkIcon className="h-6 w-6 text-[hsl(272,24%,65%)]" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-200">No links added yet</p>
                  <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                    Choose one of the quick presets above or click &quot;Add Link&quot; to build your bio-link list.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAddLinkModal("discord")}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[hsl(272,24%,46%)] hover:bg-[hsl(272,24%,40%)] px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create First Link
                  </button>
                </div>
              )}

              {links.map((l, i) => {
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
                    className={`flex cursor-grab items-center justify-between gap-3.5 rounded-xl border p-3.5 transition-all duration-200 active:cursor-grabbing ${
                      dragIndex === i
                        ? "border-[hsl(272,24%,46%)] opacity-50 bg-[#09090b]"
                        : "border-[#3f3f46]/30 bg-[#09090b]/70 hover:bg-[#09090b] hover:border-[#3f3f46]"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <GripVertical className="h-4 w-4 shrink-0 text-zinc-600 hover:text-zinc-400" aria-hidden />

                      {/* Icon Tile */}
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all"
                          style={{
                            background: `${c}1f`,
                            borderColor: `${c}44`,
                            boxShadow: glow ? `0 0 16px ${glow}` : undefined,
                          }}
                        >
                          {fileUrl(l.icon_url) ? (
                            <img src={fileUrl(l.icon_url)} alt="" className="h-7 w-7 rounded-lg object-cover" />
                          ) : (
                            <Icon className="h-5 w-5" style={{ color: c }} />
                          )}
                        </span>
                      </span>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-bold text-zinc-100">
                            {l.label || meta.name || l.platform}
                          </span>
                          <span className="shrink-0 rounded-md bg-[#111111] border border-[#3f3f46]/30 px-1.5 py-0.5 font-mono2 text-[9px] uppercase text-zinc-400">
                            {isCard ? "Card" : "Icon"}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate font-mono2 text-[11px] text-zinc-400">
                          {l.url || l.username || "No destination URL"}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          data-testid={`link-up-${i}`}
                          disabled={i === 0}
                          onClick={() => moveLink(i, i - 1)}
                          aria-label={`Move ${l.label || l.platform || "link"} up`}
                          className="rounded-md bg-[#111111] border border-[#3f3f46]/20 p-1 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          data-testid={`link-down-${i}`}
                          disabled={i === links.length - 1}
                          onClick={() => moveLink(i, i + 1)}
                          aria-label={`Move ${l.label || l.platform || "link"} down`}
                          className="rounded-md bg-[#111111] border border-[#3f3f46]/20 p-1 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        data-testid={`link-edit-${i}`}
                        onClick={() => openEditLinkModal(i)}
                        className="flex items-center gap-1.5 rounded-xl border border-[#3f3f46]/40 bg-[#111111] hover:border-[hsl(272,24%,46%)]/50 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-[hsl(272,24%,65%)]" /> Edit
                      </button>

                      <button
                        type="button"
                        data-testid={`link-delete-${i}`}
                        onClick={() => removeLink(i)}
                        className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
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
          </div>
        </div>

        {/* Right Column: Live Interactive Profile Preview */}
        <div className="hidden xl:block sticky top-20">
          <div className="rounded-2xl border border-[#3f3f46]/30 bg-[#111111] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3f3f46]/20 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <Smartphone className="h-4 w-4 text-[hsl(272,24%,65%)]" /> Live Studio Preview
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-mono2 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>

            {/* Simulated Phone / Profile Surface */}
            <div className="rounded-2xl border border-[#3f3f46]/40 bg-[#09090b] p-4 text-center space-y-4 shadow-inner">
              {/* Profile Header Preview */}
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl border-2 border-[hsl(272,24%,46%)]/40 overflow-hidden bg-[#111111] shadow-lg flex items-center justify-center mb-2">
                  {user.profile?.avatar_url ? (
                    <img src={fileUrl(user.profile.avatar_url)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {(user.profile?.display_name || user.username || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-white">
                  {user.profile?.display_name || user.username || "Your Name"}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono2">
                  @{user.username || "username"}
                </div>
              </div>

              {/* Rendered Links Preview */}
              <div className="space-y-2 pt-2">
                {links.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-600">
                    Links added will preview here in real time.
                  </div>
                ) : (
                  links.map((l, idx) => {
                    const meta = ALL_MAP[l.platform] || {};
                    const Icon = meta.Icon || LinkIcon;
                    const c = l.color || globals.color || meta.color || "hsl(272, 24%, 46%)";
                    const isCard = (l.mode || globals.mode) !== "icon";

                    if (!isCard) {
                      return (
                        <div key={idx} className="inline-flex m-1">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl border transition-all"
                            style={{
                              background: globals.iconFill ? `${c}22` : "transparent",
                              borderColor: `${c}55`,
                            }}
                          >
                            {fileUrl(l.icon_url) ? (
                              <img src={fileUrl(l.icon_url)} alt="" className="h-5 w-5 rounded object-cover" />
                            ) : (
                              <Icon className="h-4 w-4" style={{ color: c }} />
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className="group flex items-center justify-between gap-2.5 rounded-xl border border-white/10 bg-[#111111]/80 hover:bg-[#111111] p-3 text-left transition-all"
                        style={{
                          borderColor: `${c}40`,
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: `${c}22` }}
                          >
                            {fileUrl(l.icon_url) ? (
                              <img src={fileUrl(l.icon_url)} alt="" className="h-4 w-4 rounded object-cover" />
                            ) : (
                              <Icon className="h-3.5 w-3.5" style={{ color: c }} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold text-white">
                              {l.label || meta.name || l.platform}
                            </div>
                            {l.desc && (
                              <div className="truncate text-[10px] text-zinc-400">{l.desc}</div>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Save Dock */}
      <div className={`${dirty || justSaved ? "block" : "hidden"} sticky bottom-5 z-20 mt-6`} data-testid="links-save-bar">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#3f3f46]/40 bg-[#111111]/95 backdrop-blur-xl p-4 shadow-2xl">
          <div className="flex items-center gap-2.5 text-xs">
            {dirty ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <span className="font-semibold text-amber-200">Unsaved changes in links studio</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-zinc-300 font-medium">All changes saved to your profile</span>
              </>
            )}
          </div>

          <button
            data-testid="links-save-btn"
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[hsl(272,24%,46%)] hover:bg-[hsl(272,24%,40%)] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[hsl(272,24%,46%)]/25 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Links"}
          </button>
        </div>
      </div>

      {/* Link Editor Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
        >
          <div className="bg-[#111111] relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#3f3f46]/40 p-6 sm:p-8 shadow-[0_25px_90px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#3f3f46]/30 pb-5">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${activeMeta.color || "hsl(272, 24%, 46%)"}22` }}
                >
                  <ActiveIcon className="h-5 w-5" style={{ color: activeMeta.color || "hsl(272, 24%, 46%)" }} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {activeModal.isNew ? "Add Link Card" : "Edit Link Card"}
                  </h3>
                  <p className="text-xs text-zinc-400">Configure destination URL, design, custom icon and glow.</p>
                </div>
              </div>
              <button
                data-testid="link-modal-close"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 pt-6 text-left">
              <div className="space-y-4">
                {/* Platform Search & Grid */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-zinc-200">Choose Platform</label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                    <input
                      data-testid="link-platform-search"
                      type="text"
                      value={platformQuery}
                      onChange={(e) => setPlatformQuery(e.target.value)}
                      placeholder={`Search ${PLATFORM_PRESETS.length} platforms…`}
                      className="w-full rounded-xl border border-[#3f3f46]/40 bg-[#09090b] py-2.5 pl-9 pr-3 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[hsl(272,24%,46%)]"
                    />
                  </div>

                  <div
                    data-testid="link-platform-grid"
                    className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4"
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
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[10px] font-semibold transition cursor-pointer ${
                            selected
                              ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)]/20 text-white shadow-sm"
                              : "border-[#3f3f46]/30 bg-[#09090b]/60 text-zinc-400 hover:border-[#3f3f46] hover:bg-[#09090b] hover:text-zinc-200"
                          }`}
                        >
                          <p.Icon className="h-5 w-5" style={{ color: selected ? "#ffffff" : p.color }} />
                          <span className="w-full truncate text-center">{p.name}</span>
                        </button>
                      );
                    })}

                    {filteredPlatforms.length === 0 && (
                      <div className="col-span-full py-8 text-center text-xs text-zinc-500">
                        No platform matches &ldquo;{platformQuery}&rdquo;.
                      </div>
                    )}
                  </div>
                </div>

                {/* Display Label */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-200">Display Label</label>
                  <input
                    data-testid="link-label-input"
                    type="text"
                    value={activeModal.link.label || ""}
                    onChange={(e) => patchLink({ label: e.target.value })}
                    placeholder="e.g. Join Official Discord"
                    className="w-full rounded-xl border border-[#3f3f46]/40 bg-[#09090b] px-4 py-2.5 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[hsl(272,24%,46%)]"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-200">URL / Handle</label>
                  <input
                    data-testid="link-url-input"
                    type="text"
                    value={activeModal.link.url || ""}
                    onChange={(e) => patchLink({ url: e.target.value })}
                    placeholder={placeholderFor(activeModal.link.platform)}
                    className="w-full rounded-xl border border-[#3f3f46]/40 bg-[#09090b] px-4 py-2.5 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[hsl(272,24%,46%)]"
                  />
                </div>

                {/* Display Style Configuration */}
                <div className="space-y-4 rounded-2xl border border-[#3f3f46]/30 bg-[#09090b]/60 p-4 sm:p-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Display style</div>
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
                  <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer pt-1">
                    <span>Filled icon background</span>
                    <Switch
                      checked={activeModal.link.icon_fill ?? globals.iconFill}
                      onCheckedChange={(v) => patchLink({ icon_fill: v })}
                    />
                  </label>
                </div>

                {/* Custom icon, description & glow */}
                <div className="space-y-4 rounded-2xl border border-[#3f3f46]/30 bg-[#09090b]/60 p-4 sm:p-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Custom icon &amp; description</div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#3f3f46]/40 bg-[#111111]">
                      {activeModal.link.icon_url ? (
                        <img src={fileUrl(activeModal.link.icon_url)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ActiveIcon className="h-5 w-5" style={{ color: activeMeta.color || "hsl(272, 24%, 46%)" }} />
                      )}
                    </span>
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[hsl(272,24%,46%)]/40 bg-[hsl(272,24%,46%)]/15 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[hsl(272,24%,46%)]/25">
                        {iconUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        {activeModal.link.icon_url ? "Replace icon" : "Upload icon"}
                        <input
                          data-testid="link-icon-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={iconUploading}
                          onChange={handleIconUpload}
                        />
                      </label>
                      {activeModal.link.icon_url ? (
                        <button
                          type="button"
                          onClick={() => patchLink({ icon_url: "" })}
                          className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                          aria-label="Remove custom icon"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-500">PNG, JPG or SVG — replaces platform glyph.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-200">Short description</label>
                    <input
                      data-testid="link-desc-input"
                      type="text"
                      value={activeModal.link.desc || ""}
                      onChange={(e) => patchLink({ desc: e.target.value })}
                      placeholder="e.g. Our community · 40k members"
                      className="w-full rounded-xl border border-[#3f3f46]/40 bg-[#09090b] px-4 py-2.5 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[hsl(272,24%,46%)]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-200">Tooltip</label>
                    <input
                      data-testid="link-tooltip-input"
                      type="text"
                      value={activeModal.link.tooltip || ""}
                      onChange={(e) => patchLink({ tooltip: e.target.value })}
                      placeholder="Shown when a visitor hovers this link"
                      className="w-full rounded-xl border border-[#3f3f46]/40 bg-[#09090b] px-4 py-2.5 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[hsl(272,24%,46%)]"
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

                  <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer pt-1">
                    <span>Glow around this link</span>
                    <Switch
                      checked={!!(activeModal.link.glow_on ?? globals.glowOn)}
                      onCheckedChange={(v) => patchLink({ glow_on: v })}
                    />
                  </label>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker label="Custom Color" value={activeModal.link.color || "hsl(272, 24%, 46%)"} onChange={(v) => patchLink({ color: v })} />
                  <ColorPicker label="Custom Glow" value={activeModal.link.glow || "hsl(272, 24%, 46%)"} onChange={(v) => patchLink({ glow: v })} />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-2.5 border-t border-[#3f3f46]/30 pt-5">
              <button
                data-testid="link-modal-cancel"
                onClick={() => setActiveModal(null)}
                className="rounded-xl border border-[#3f3f46]/40 bg-[#09090b] hover:bg-white/[0.05] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                data-testid="link-modal-apply"
                onClick={saveModalLink}
                className="rounded-xl bg-[hsl(272,24%,46%)] hover:bg-[hsl(272,24%,40%)] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[hsl(272,24%,46%)]/25 transition cursor-pointer"
              >
                Apply Link Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Styles Modal */}
      {showGlobalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowGlobalModal(false); }}
        >
          <div className="bg-[#111111] relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#3f3f46]/40 p-6 sm:p-8 shadow-[0_25px_90px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-[#3f3f46]/30 pb-5">
              <div className="flex items-center gap-2.5">
                <Paintbrush className="h-5 w-5 text-[hsl(272,24%,65%)]" />
                <h3 className="text-lg font-bold text-white tracking-tight">Global Link Styles</h3>
              </div>
              <button
                data-testid="link-global-modal-close"
                onClick={() => setShowGlobalModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 pt-5">
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

              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer pt-2">
                <span>Filled icon background</span>
                <Switch checked={globals.iconFill} onCheckedChange={(v) => setGlobals({ ...globals, iconFill: v })} />
              </label>
              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                <span>Glow around links</span>
                <Switch
                  data-testid="link-glow-toggle"
                  checked={globals.glowOn}
                  onCheckedChange={(v) => setGlobals({ ...globals, glowOn: v })}
                />
              </label>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <ColorPicker label="Global Color" value={globals.color || "hsl(272, 24%, 46%)"} onChange={(v) => setGlobals({ ...globals, color: v })} />
                <ColorPicker label="Global Glow" value={globals.glow || "hsl(272, 24%, 46%)"} onChange={(v) => setGlobals({ ...globals, glow: v })} />
              </div>

              <p className="rounded-xl border border-[#3f3f46]/30 bg-[#09090b] px-3.5 py-2.5 text-[11px] leading-relaxed text-zinc-400">
                Links with their own custom colour or style keep it. These defaults apply to every link that
                doesn&apos;t set its own.
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[#3f3f46]/20">
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  {dirty ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-amber-200">Remember to save your links</span>
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
                  className="rounded-xl bg-[hsl(272,24%,46%)] hover:bg-[hsl(272,24%,40%)] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[hsl(272,24%,46%)]/25 transition cursor-pointer"
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
