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
  ChevronUp, ChevronDown, CheckCircle2,
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
                  ? "border-[#3f62e2] bg-[#3f62e2]/20 text-white shadow-sm"
                  : "border-[#1f1f1f] bg-[#09090b] text-zinc-400 hover:border-[#3f3f46] hover:text-zinc-200"
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
    <div data-testid="links-page" className="w-full text-left space-y-4 pb-28">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3f62e2]/15 border border-[#3f62e2]/30 text-white">
            <LinkIcon className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white">
              Links
            </h1>
            <span className="text-[11px] font-mono2 text-zinc-400 px-2 py-0.5 rounded-md bg-[#0d0d0d] border border-[#2a2a2e]">
              {links.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            data-testid="link-global-styles-btn"
            onClick={() => setShowGlobalModal(true)}
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-300 border border-[#2a2a2e] bg-[#09090b] hover:bg-white/[0.05] hover:text-white transition cursor-pointer"
          >
            <Paintbrush className="h-3.5 w-3.5 text-[#8aa6f5]" /> Global Styles
          </button>
          <button
            data-testid="add-link-btn"
            onClick={() => openAddLinkModal("discord")}
            className="flex items-center gap-1.5 rounded-xl bg-[#3f62e2] hover:bg-[#3550c8] px-4 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Link
          </button>
        </div>
      </div>

      {/* Quick Add Presets Bar */}
      <div className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-3" data-testid="link-presets">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                className="group flex items-center gap-2 rounded-xl border border-[#1f1f1f] bg-[#09090b] hover:border-[#3f62e2]/60 px-3 py-1.5 transition cursor-pointer shrink-0"
              >
                <span
                  className="flex h-4 w-4 items-center justify-center rounded"
                  style={{ background: `${preset.color}22` }}
                >
                  <preset.Icon className="h-2.5 w-2.5" style={{ color: preset.color }} />
                </span>
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
                  {preset.name}
                </span>
                <Plus className="h-3 w-3 text-zinc-600 group-hover:text-white transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Links Container */}
      <div className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-4 space-y-2">
        {links.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#2a2a2e] p-12 text-center bg-[#09090b]/40">
            <LinkIcon className="mx-auto mb-2 h-7 w-7 text-zinc-600" />
            <p className="text-xs font-semibold text-zinc-400">No links added</p>
            <button
              type="button"
              onClick={() => openAddLinkModal("discord")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#3f62e2] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#3550c8] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Link
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
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
                  className={`flex cursor-grab items-center justify-between gap-3 rounded-xl border p-2.5 sm:p-3 transition-all duration-150 active:cursor-grabbing ${
                    dragIndex === i
                      ? "border-[#3f62e2] opacity-40 bg-[#09090b]"
                      : "border-[#1f1f1f] bg-[#09090b] hover:border-[#3f3f46]"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <GripVertical className="h-4 w-4 shrink-0 text-zinc-600 hover:text-zinc-400" aria-hidden />

                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg border"
                        style={{
                          background: `${c}1f`,
                          borderColor: `${c}44`,
                          boxShadow: glow ? `0 0 14px ${glow}` : undefined,
                        }}
                      >
                        {fileUrl(l.icon_url) ? (
                          <img src={fileUrl(l.icon_url)} alt="" className="h-5 w-5 rounded object-cover" />
                        ) : (
                          <Icon className="h-4 w-4" style={{ color: c }} />
                        )}
                      </span>
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-bold text-zinc-100">
                          {l.label || meta.name || l.platform}
                        </span>
                        <span className="shrink-0 rounded bg-[#111111] border border-[#2a2a2e] px-1.5 py-0.2 font-mono2 text-[9px] uppercase text-zinc-400">
                          {isCard ? "card" : "icon"}
                        </span>
                      </div>
                      <div className="truncate font-mono2 text-[11px] text-zinc-500">
                        {l.url || l.username || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        data-testid={`link-up-${i}`}
                        disabled={i === 0}
                        onClick={() => moveLink(i, i - 1)}
                        aria-label={`Move ${l.label || l.platform || "link"} up`}
                        className="rounded bg-[#111111] border border-[#3f3f46]/20 p-1 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        data-testid={`link-down-${i}`}
                        disabled={i === links.length - 1}
                        onClick={() => moveLink(i, i + 1)}
                        aria-label={`Move ${l.label || l.platform || "link"} down`}
                        className="rounded bg-[#111111] border border-[#3f3f46]/20 p-1 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      data-testid={`link-edit-${i}`}
                      onClick={() => openEditLinkModal(i)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#2a2a2e] bg-[#111111] hover:border-[#3f62e2]/50 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-[#8aa6f5]" /> Edit
                    </button>

                    <button
                      type="button"
                      data-testid={`link-delete-${i}`}
                      onClick={() => removeLink(i)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
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
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#3f3f46]/50 bg-[#111111]/95 backdrop-blur-xl p-3.5 shadow-2xl">
          <div className="flex items-center gap-2 text-xs">
            {dirty ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <span className="font-semibold text-amber-200">Unsaved changes</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-zinc-300 font-medium">Saved</span>
              </>
            )}
          </div>

          <button
            data-testid="links-save-btn"
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#3f62e2] hover:bg-[#3550c8] px-5 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Link Editor Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
        >
          <div className="bg-[#111111] relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#2a2a2e] p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${activeMeta.color || "hsl(272, 24%, 46%)"}22` }}
                >
                  <ActiveIcon className="h-3.5 w-3.5" style={{ color: activeMeta.color || "hsl(272, 24%, 46%)" }} />
                </span>
                <h3 className="text-sm font-bold text-white">
                  {activeModal.isNew ? "Add Link" : "Edit Link"}
                </h3>
              </div>
              <button
                data-testid="link-modal-close"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3.5 pt-3.5 text-left">
              {/* Platform Search & Grid */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-200">Platform</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                  <input
                    data-testid="link-platform-search"
                    type="text"
                    value={platformQuery}
                    onChange={(e) => setPlatformQuery(e.target.value)}
                    placeholder={`Search ${PLATFORM_PRESETS.length} platforms…`}
                    className="w-full rounded-xl border border-[#2a2a2e] bg-[#09090b] py-1.5 pl-8 pr-3 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[#3f62e2]"
                  />
                </div>

                <div
                  data-testid="link-platform-grid"
                  className="grid max-h-40 grid-cols-3 gap-1 overflow-y-auto pr-1 sm:grid-cols-4"
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
                        className={`flex flex-col items-center gap-1 rounded-lg border p-1.5 text-[10px] font-semibold transition cursor-pointer ${
                          selected
                            ? "border-[#3f62e2] bg-[#3f62e2]/20 text-white"
                            : "border-[#1f1f1f] bg-[#09090b] text-zinc-400 hover:border-[#3f3f46] hover:text-zinc-200"
                        }`}
                      >
                        <p.Icon className="h-3.5 w-3.5" style={{ color: selected ? "#ffffff" : p.color }} />
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
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-200">Label</label>
                <input
                  data-testid="link-label-input"
                  type="text"
                  value={activeModal.link.label || ""}
                  onChange={(e) => patchLink({ label: e.target.value })}
                  placeholder="e.g. Discord"
                  className="w-full rounded-xl border border-[#2a2a2e] bg-[#09090b] px-3 py-1.5 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[#3f62e2]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-200">URL</label>
                <input
                  data-testid="link-url-input"
                  type="text"
                  value={activeModal.link.url || ""}
                  onChange={(e) => patchLink({ url: e.target.value })}
                  placeholder={placeholderFor(activeModal.link.platform)}
                  className="w-full rounded-xl border border-[#2a2a2e] bg-[#09090b] px-3 py-1.5 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[#3f62e2]"
                />
              </div>

              {/* Display Style */}
              <div className="space-y-2.5 rounded-xl border border-[#1f1f1f] bg-[#09090b] p-3">
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
              <div className="space-y-2.5 rounded-xl border border-[#1f1f1f] bg-[#09090b] p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#2a2a2e] bg-[#111111]">
                    {activeModal.link.icon_url ? (
                      <img src={fileUrl(activeModal.link.icon_url)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ActiveIcon className="h-4 w-4" style={{ color: activeMeta.color || "hsl(272, 24%, 46%)" }} />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#3f62e2]/40 bg-[#3f62e2]/15 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#3f62e2]/25">
                      {iconUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      {activeModal.link.icon_url ? "Replace" : "Upload"}
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
                        className="rounded-lg border border-red-500/20 bg-red-500/10 p-1 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                        aria-label="Remove custom icon"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-200">Description</label>
                  <input
                    data-testid="link-desc-input"
                    type="text"
                    value={activeModal.link.desc || ""}
                    onChange={(e) => patchLink({ desc: e.target.value })}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-[#2a2a2e] bg-[#111111] px-3 py-1.5 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[#3f62e2]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-200">Tooltip</label>
                  <input
                    data-testid="link-tooltip-input"
                    type="text"
                    value={activeModal.link.tooltip || ""}
                    onChange={(e) => patchLink({ tooltip: e.target.value })}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-[#2a2a2e] bg-[#111111] px-3 py-1.5 text-xs font-medium text-white placeholder-zinc-500 outline-none transition focus:border-[#3f62e2]"
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
                  <span>Glow</span>
                  <Switch
                    checked={!!(activeModal.link.glow_on ?? globals.glowOn)}
                    onCheckedChange={(v) => patchLink({ glow_on: v })}
                  />
                </label>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-2.5">
                <ColorPicker label="Custom Color" value={activeModal.link.color || "hsl(272, 24%, 46%)"} onChange={(v) => patchLink({ color: v })} />
                <ColorPicker label="Custom Glow" value={activeModal.link.glow || "hsl(272, 24%, 46%)"} onChange={(v) => patchLink({ glow: v })} />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-[#1f1f1f] pt-3">
              <button
                data-testid="link-modal-cancel"
                onClick={() => setActiveModal(null)}
                className="rounded-xl border border-[#2a2a2e] bg-[#09090b] px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                data-testid="link-modal-apply"
                onClick={saveModalLink}
                className="rounded-xl bg-[#3f62e2] hover:bg-[#3550c8] px-4 py-1.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
              >
                Apply
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
          <div className="bg-[#111111] relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#2a2a2e] p-5 shadow-2xl animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
              <div className="flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-[#8aa6f5]" />
                <h3 className="text-sm font-bold text-white">Global Styles</h3>
              </div>
              <button
                data-testid="link-global-modal-close"
                onClick={() => setShowGlobalModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 pt-3">
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
                <span>Glow</span>
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

              <div className="flex items-center justify-between pt-3 border-t border-[#3f3f46]/20">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  {dirty ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-amber-200">Unsaved</span>
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
                  className="rounded-xl bg-[#3f62e2] hover:bg-[#3550c8] px-4 py-1.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
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
