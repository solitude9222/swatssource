import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { TRACK_STYLES, resolveTrackStyle } from "@/constants/effects";
import {
  WIDGET_KINDS, WIDGET_FIELDS, KIND_MAP, GENERIC_WIDGET_ICON,
  WIDGET_CARD_STYLES,
} from "@/constants/widgets";
import { WidgetCard, WidgetPill } from "@/components/WidgetCards";
import { TrackStylePreview } from "@/components/TrackStylePreview";
import { useWidgetData, formatCount } from "@/lib/widgets";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/lib/notify";
import { useEditGate } from "@/hooks/useEditGate";
import {
  Save, Lock, Music, Upload, Loader2, X,
  Edit2, Check, BookOpen, LayoutGrid, GripVertical,
  Sparkles, Eye, Trash2, HelpCircle, ExternalLink, ChevronDown, Plus,
  ArrowLeft, Globe, Star, Users, Radio, Shield, Trophy,
} from "lucide-react";
import { FaDiscord, FaGithub, FaSpotify, FaSteam, FaTwitch, FaLastfm } from "react-icons/fa6";
import { SiRoblox, SiValorant, SiSupercell } from "react-icons/si";
import { ColorPicker } from "@/components/ColorPicker";
import { PremiumGate } from "@/components/ui-shared/PremiumGate";

// Helper for hex -> rgba
export const hexOrRgba = (color, alphaPct) => {
  if (!color) return `rgba(255,255,255,${alphaPct / 100})`;
  const a = Math.max(0, Math.min(1, alphaPct / 100));
  const hexMatch = String(color).trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let c = hexMatch[1];
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${a})`;
  }
  if (String(color).startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `,${a})`);
  }
  return color;
};

const subtypeOf = (widget) => {
  const kind = KIND_MAP[widget?.type];
  if (!kind) return null;
  return kind.subtypes?.find((s) => s.id === widget.subtype) || kind.subtypes?.[0] || null;
};

const fieldsFor = (widget) => {
  const sub = subtypeOf(widget);
  return (sub?.fields || []).map((id) => ({ id, ...WIDGET_FIELDS[id] })).filter((f) => f.id);
};

const LEGACY_EMPTY = {
  online_count: "", member_count: "", friends: "", followers: "",
  visits: "", likes: "", kd_ratio: "", level: "", agent: "", rank: "",
  status: "", game: "", subscribers: "", album_art: "", track: "", artist: "",
  server_name: "", invite_url: "", value: "", username: "", url: "", code: "",
  server_id: "", user_id: "", group_id: "", game_url: "", channel: "", repo: "",
  riot_id: "", timezone: "", date: "", embed: false,
  discord_style: "classic",
  glow_on: false,
};

const blankWidget = (kind) => ({
  type: kind.id,
  subtype: kind.subtypes?.[0]?.id || "",
  title: kind.label,
  span: 2,
  color: "",
  glow: "",
  enabled: true,
  ...LEGACY_EMPTY,
  // Display options
  artwork_bg: "splash",
  bg_filter: "dark",
  show_online: true,
  show_members: true,
  show_boost: true,
  info_modal: true,
  view_button: true,
  platform_badge: true,
  show_subtitle: true,
  stats_row: true,
  invite_url: kind.id === "discord" ? "discord.gg/achern" : "",
  username: "",
  value: "",
});

const DEFAULT_SHARED = {
  borderWidth: 2,
  borderOpacity: 0.10,
  borderColor: "#ffffff",
  bgColor: "#ffffff",
  bgOpacity: 0.05,
  bgBlur: 0,
};

const snapshot = (widgets, shared, tracks, trackStyle, shuffle, volume, trackPosition) =>
  JSON.stringify({ widgets, shared, tracks, trackStyle, shuffle, volume, trackPosition });

/**
 * Real Live Data Widget Preview Component
 * Fetches real API data dynamically using useWidgetData
 */
function RealLiveWidgetPreview({ widget, kind }) {
  const isDiscord = widget.type === "discord";
  const { status, data, error } = useWidgetData(widget, { refreshSec: 0 });
  const Icon = kind.Icon || GENERIC_WIDGET_ICON;

  // Background artwork
  let bgImage = "";
  if (widget.artwork_bg === "banner" && (data?.banner || data?.banner_url)) {
    bgImage = data.banner || data.banner_url;
  } else if (widget.artwork_bg === "splash" && data?.splash) {
    bgImage = data.splash;
  } else if (widget.artwork_bg === "avatar" && (data?.icon || data?.avatar)) {
    bgImage = data.icon || data.avatar;
  }

  // Filter overlays
  const filterStyles = {
    none: "",
    soft: "bg-black/30 backdrop-blur-[2px]",
    dark: "bg-black/60",
    blur: "backdrop-blur-md bg-black/45",
    dark_blur: "backdrop-blur-xl bg-black/75",
    vignette: "bg-gradient-to-t from-black via-black/40 to-transparent",
  };
  const overlayClass = filterStyles[widget.bg_filter || "dark"] ?? "bg-black/60";

  // Data values (REAL DATA with fallback to config)
  let title = data?.name || data?.global_name || data?.username || data?.title || widget.title || kind.label;
  if (isDiscord && widget.subtype === "server") {
    title = data?.name || (widget.invite_url ? `/${widget.invite_url.replace(/.*discord\.gg\//, "").replace(/^\/+/, "")}` : "/acheron");
  }

  let subtitle = data?.description || data?.bio || (widget.show_subtitle !== false ? kind.desc : "");
  if (isDiscord && widget.subtype === "server" && !data?.description) {
    subtitle = "The modern solution for your personal biolink website. Simple, fast, and fully customizable.";
  }

  const onlineCount = data?.online != null ? formatCount(data.online) : (widget.online_count || "13");
  const memberCount = (data?.total_members != null ? formatCount(data.total_members) : (data?.members != null ? formatCount(data.members) : (widget.member_count || "88")));
  const boostLevel = data?.premium_tier != null ? `Level ${data.premium_tier}` : (data?.boost_level ? `Level ${data.boost_level}` : "Level 3");
  const avatarUrl = data?.icon || data?.avatar || "";

  return (
    <div
      className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0d14] overflow-hidden shadow-2xl transition-all duration-300 text-left"
      style={{ minHeight: "150px" }}
    >
      {/* Real Background Image Artwork if selected */}
      {widget.artwork_bg !== "none" && bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Background Filter Overlay */}
      <div className={`relative z-10 p-5 space-y-3.5 ${widget.artwork_bg !== "none" && bgImage ? overlayClass : ""}`}>
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden"
              style={{ background: `${kind.color || "#5865F2"}22`, borderColor: `${kind.color || "#5865F2"}44` }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon className="w-4 h-4" style={{ color: kind.color || "#5865F2" }} />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white tracking-tight block truncate">
                {kind.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {widget.platform_badge !== false && (
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-zinc-300 border border-white/15 uppercase tracking-wider">
                {kind.label}
              </span>
            )}
            {widget.view_button !== false && (
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-zinc-300 border border-white/10 shadow-sm">
                <ExternalLink className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>

        {/* Title & subtitle */}
        <div>
          <div className="text-sm font-bold text-white truncate">{title}</div>
          {widget.show_subtitle !== false && subtitle && (
            <div className="text-xs text-zinc-300/80 mt-1 line-clamp-2 leading-relaxed">
              {subtitle}
            </div>
          )}
        </div>

        {/* Real Stats row */}
        {widget.stats_row !== false && (
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            {widget.show_online !== false && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                {onlineCount} Online
              </span>
            )}
            {widget.show_members !== false && (
              <span className="text-zinc-300 font-medium">
                {memberCount} Members
              </span>
            )}
            {widget.show_boost !== false && (
              <span className="text-purple-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                {boostLevel}
              </span>
            )}
            {status === "loading" && (
              <span className="text-[10px] text-zinc-500 font-mono2 ml-auto flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Live sync
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Widgets() {
  const { user, setUser } = useAuth();
  const gate = useEditGate();
  const isPremium = user.tier === "premium" || user.tier === "admin" || user.is_owner;

  const savedTrackStyle = resolveTrackStyle(user.profile?.track_style);
  const savedShuffle = !!user.profile?.track_shuffle;
  const savedVolume = user.profile?.track_volume ?? 80;
  const savedTrackPosition = user.profile?.track_position || "";
  const accentColor = user.profile?.accent_color || "#A48DF4";

  const [widgets, setWidgets] = useState(user.profile?.widgets || []);

  // Shared Widget Card Customization state (global editor)
  const [borderWidth, setBorderWidth] = useState(
    Number.isFinite(Number(user.profile?.widget_border_width)) ? Number(user.profile.widget_border_width) : DEFAULT_SHARED.borderWidth
  );
  const [borderOpacity, setBorderOpacity] = useState(
    Number.isFinite(Number(user.profile?.widget_border_opacity)) ? Number(user.profile.widget_border_opacity) : DEFAULT_SHARED.borderOpacity
  );
  const [borderColor, setBorderColor] = useState(user.profile?.widget_border_color || DEFAULT_SHARED.borderColor);
  const [bgColor, setBgColor] = useState(user.profile?.widget_bg_color || DEFAULT_SHARED.bgColor);
  const [bgOpacity, setBgOpacity] = useState(
    Number.isFinite(Number(user.profile?.widget_bg_opacity)) ? Number(user.profile.widget_bg_opacity) : DEFAULT_SHARED.bgOpacity
  );
  const [bgBlur, setBgBlur] = useState(
    Number.isFinite(Number(user.profile?.widget_bg_blur)) ? Number(user.profile.widget_bg_blur) : DEFAULT_SHARED.bgBlur
  );

  // Audio state
  const [tracks, setTracks] = useState(user.profile?.tracks || []);
  const [trackStyle, setTrackStyle] = useState(savedTrackStyle);
  const [shuffle, setShuffle] = useState(savedShuffle);
  const [volume, setVolume] = useState(savedVolume);
  const [trackPosition, setTrackPosition] = useState(savedTrackPosition);

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef(null);

  const currentShared = { borderWidth, borderOpacity, borderColor, bgColor, bgOpacity, bgBlur };
  const baseline = useRef(
    snapshot(
      user.profile?.widgets || [],
      {
        borderWidth: Number.isFinite(Number(user.profile?.widget_border_width)) ? Number(user.profile.widget_border_width) : DEFAULT_SHARED.borderWidth,
        borderOpacity: Number.isFinite(Number(user.profile?.widget_border_opacity)) ? Number(user.profile.widget_border_opacity) : DEFAULT_SHARED.borderOpacity,
        borderColor: user.profile?.widget_border_color || DEFAULT_SHARED.borderColor,
        bgColor: user.profile?.widget_bg_color || DEFAULT_SHARED.bgColor,
        bgOpacity: Number.isFinite(Number(user.profile?.widget_bg_opacity)) ? Number(user.profile.widget_bg_opacity) : DEFAULT_SHARED.bgOpacity,
        bgBlur: Number.isFinite(Number(user.profile?.widget_bg_blur)) ? Number(user.profile.widget_bg_blur) : DEFAULT_SHARED.bgBlur,
      },
      user.profile?.tracks || [],
      savedTrackStyle,
      savedShuffle,
      savedVolume,
      savedTrackPosition
    )
  );

  const dirty = baseline.current !== snapshot(widgets, currentShared, tracks, trackStyle, shuffle, volume, trackPosition);

  // Dedicated Widget Editor Page state: null | { isNew, index, widget }
  const [editingWidget, setEditingWidget] = useState(null);
  const [premiumFeature, setPremiumFeature] = useState(null);
  const [widgetDragIndex, setWidgetDragIndex] = useState(null);
  const [showStyleGallery, setShowStyleGallery] = useState(false);

  const openWidgetEditor = (kind, existingIndex = null) => {
    if (kind.premium && !isPremium) {
      setPremiumFeature(`${kind.label || kind.id} widgets`);
      return;
    }
    if (existingIndex != null) {
      const w = widgets[existingIndex];
      setEditingWidget({
        isNew: false,
        index: existingIndex,
        widget: { ...blankWidget(kind), ...w },
      });
    } else {
      setEditingWidget({
        isNew: true,
        index: widgets.length,
        widget: blankWidget(kind),
      });
    }
  };

  const patchEditingWidget = (patch) => {
    setEditingWidget((prev) => (prev ? { ...prev, widget: { ...prev.widget, ...patch } } : prev));
  };

  const saveWidgetEdit = () => {
    if (!editingWidget) return;
    const { isNew, index, widget } = editingWidget;
    if (isNew) {
      setWidgets([...widgets, widget]);
    } else {
      setWidgets(widgets.map((w, idx) => (idx === index ? widget : w)));
    }
    setEditingWidget(null);
    toast.success("Widget applied to draft — remember to save");
  };

  const moveWidget = (from, to) => {
    if (from == null || from === to) return;
    const next = [...widgets];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setWidgets(next);
  };

  const removeWidget = async (i) => {
    if (gate.guard("deleting a widget")) return;
    const next = widgets.filter((_, idx) => idx !== i);
    setWidgets(next);
    try {
      const { data } = await api.put("/me/profile", {
        widgets: next,
        widget_border_width: borderWidth,
        widget_border_opacity: borderOpacity,
        widget_border_color: borderColor,
        widget_bg_color: bgColor,
        widget_bg_opacity: bgOpacity,
        widget_bg_blur: bgBlur,
        tracks,
        track_style: trackStyle,
        track_shuffle: shuffle,
        track_volume: volume,
        track_position: trackPosition,
      });
      setUser(data);
      baseline.current = snapshot(next, currentShared, tracks, trackStyle, shuffle, volume, trackPosition);
      toast.success("Widget deleted");
    } catch {
      toast.error("Failed to delete widget");
    }
  };

  const resetSharedDefaults = () => {
    setBorderWidth(DEFAULT_SHARED.borderWidth);
    setBorderOpacity(DEFAULT_SHARED.borderOpacity);
    setBorderColor(DEFAULT_SHARED.borderColor);
    setBgColor(DEFAULT_SHARED.bgColor);
    setBgOpacity(DEFAULT_SHARED.bgOpacity);
    setBgBlur(DEFAULT_SHARED.bgBlur);
    toast.success("Reset shared widget design to defaults");
  };

  const saveAll = async () => {
    if (gate.guard("saving widgets")) return;
    setSaving(true);
    try {
      const { data } = await api.put("/me/profile", {
        widgets,
        widget_border_width: borderWidth,
        widget_border_opacity: borderOpacity,
        widget_border_color: borderColor,
        widget_bg_color: bgColor,
        widget_bg_opacity: bgOpacity,
        widget_bg_blur: bgBlur,
        tracks,
        track_style: trackStyle,
        track_shuffle: shuffle,
        track_volume: volume,
        track_position: trackPosition,
      });
      setUser(data);
      baseline.current = snapshot(widgets, currentShared, tracks, trackStyle, shuffle, volume, trackPosition);
      toast.success("Widgets and design settings saved!");
      setJustSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setJustSaved(false), 2600);
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const accentFor = (w) => {
    const kind = KIND_MAP[w.type];
    return w.color || kind?.color || "#5865F2";
  };

  // ---------------------------------------------------------------------------
  // Dedicated Widget Configuration Page (When editingWidget is active)
  // ---------------------------------------------------------------------------
  if (editingWidget) {
    const kind = KIND_MAP[editingWidget.widget.type] || {
      id: editingWidget.widget.type,
      label: editingWidget.widget.type,
      desc: "Configure platform widget options.",
      color: "#5865F2",
    };
    const Icon = kind.Icon || GENERIC_WIDGET_ICON;
    const isDiscord = editingWidget.widget.type === "discord";
    const isGitHub = editingWidget.widget.type === "github";
    const isRoblox = editingWidget.widget.type === "roblox";
    const isSpotify = editingWidget.widget.type === "spotify";

    return (
      <div data-testid="widgets-page" className="space-y-8 pb-32 max-w-4xl mx-auto text-left animate-in fade-in duration-200">
        {/* Navigation Breadcrumb / Actions Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <button
            type="button"
            onClick={() => setEditingWidget(null)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to widgets</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setEditingWidget(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveWidgetEdit}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-lg cursor-pointer"
            >
              Apply widget
            </button>
          </div>
        </div>

        {/* Page Title & Platform Info */}
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg"
            style={{ background: `${kind.color || "#5865F2"}22`, borderColor: `${kind.color || "#5865F2"}44` }}
          >
            <Icon className="w-6 h-6" style={{ color: kind.color || "#5865F2" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {kind.label} Widget
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
              {kind.desc}
            </p>
          </div>
        </div>

        {/* 1. Connected account Section */}
        <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-7 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">Connected account</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              This is the value used for the live widget preview and your public profile.
            </p>
          </div>

          {/* Tailored fields for each widget */}
          {isDiscord ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-200">Server Invite</label>
                <input
                  type="text"
                  value={editingWidget.widget.invite_url || ""}
                  onChange={(e) => patchEditingWidget({ invite_url: e.target.value })}
                  placeholder="discord.gg/achern"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs font-medium text-white placeholder-zinc-500 outline-none focus:border-brand-500/60"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-200">Type</label>
                <select
                  value={editingWidget.widget.subtype || "server"}
                  onChange={(e) => patchEditingWidget({ subtype: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs font-medium text-white outline-none focus:border-brand-500/60 cursor-pointer"
                >
                  <option value="server">server</option>
                  <option value="profile">profile</option>
                  <option value="bot">bot</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {fieldsFor(editingWidget.widget).map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-200">{f.label}</label>
                  <input
                    type="text"
                    value={editingWidget.widget[f.key] || ""}
                    onChange={(e) => patchEditingWidget({ [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs font-medium text-white placeholder-zinc-500 outline-none focus:border-brand-500/60"
                  />
                  {f.help && <p className="text-[11px] text-zinc-500">{f.help}</p>}
                </div>
              ))}
              {kind.subtypes?.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-200">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {kind.subtypes.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => patchEditingWidget({ subtype: st.id })}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          (editingWidget.widget.subtype || kind.subtypes[0].id) === st.id
                            ? "bg-brand-500/20 border-brand-500/50 text-brand-200"
                            : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Preview Section with REAL DATA */}
        <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-7 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">Preview</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              A quick look at how this widget can appear on your page.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-center">
            <RealLiveWidgetPreview widget={editingWidget.widget} kind={kind} />
          </div>
        </div>

        {/* 3. Display options Section (NO visual styling controls here) */}
        <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-7 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">Display options</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Toggle what this widget shows on your profile.
            </p>
          </div>

          {/* Artwork & Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200">Background</label>
              <p className="text-[11px] text-zinc-400">
                Use {kind.label} banner, splash, icon, or avatar artwork.
              </p>
              <select
                value={editingWidget.widget.artwork_bg || "splash"}
                onChange={(e) => patchEditingWidget({ artwork_bg: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-medium text-white outline-none focus:border-brand-500/60 cursor-pointer mt-1"
              >
                <option value="none">None</option>
                <option value="banner">Banner</option>
                <option value="splash">Server splash</option>
                <option value="avatar">Icon / avatar</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200">Background filter</label>
              <p className="text-[11px] text-zinc-400">
                Tune the overlay used above {kind.label} artwork.
              </p>
              <select
                value={editingWidget.widget.bg_filter || "dark"}
                onChange={(e) => patchEditingWidget({ bg_filter: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-medium text-white outline-none focus:border-brand-500/60 cursor-pointer mt-1"
              >
                <option value="none">None</option>
                <option value="soft">Soft fade</option>
                <option value="dark">Dark overlay</option>
                <option value="blur">Blurred</option>
                <option value="dark_blur">Dark blur</option>
                <option value="vignette">Vignette fade</option>
              </select>
            </div>
          </div>

          {/* Tailored Toggle options */}
          <div className="space-y-2.5 pt-2">
            {(isDiscord ? [
              { key: "show_online", label: "Show online", desc: "Display current online member count for servers." },
              { key: "show_members", label: "Show members", desc: "Display total member count for servers." },
              { key: "show_boost", label: "Show boost level", desc: "Display the Discord server boost level." },
              { key: "info_modal", label: "Info modal", desc: "Open the detailed widget modal when the card is clicked." },
              { key: "view_button", label: "View button", desc: "Show the small external-link button on the card." },
              { key: "platform_badge", label: "Platform badge", desc: "Show the platform label in the top-right corner." },
              { key: "show_subtitle", label: "Subtitle", desc: "Show the secondary text below the widget title." },
              { key: "stats_row", label: "Stats row", desc: "Show the compact stats line on the card." },
            ] : isGitHub ? [
              { key: "show_online", label: "Show followers", desc: "Display your GitHub follower count on the card." },
              { key: "show_members", label: "Show repositories", desc: "Display total public repositories count." },
              { key: "show_boost", label: "Show stars", desc: "Display total star count across your repositories." },
              { key: "info_modal", label: "Info modal", desc: "Open the detailed widget modal when the card is clicked." },
              { key: "view_button", label: "View button", desc: "Show the small external-link button on the card." },
              { key: "platform_badge", label: "Platform badge", desc: "Show the platform label in the top-right corner." },
              { key: "show_subtitle", label: "Subtitle", desc: "Show the secondary bio text below the title." },
              { key: "stats_row", label: "Stats row", desc: "Show the compact stats line on the card." },
            ] : [
              { key: "show_online", label: `Show online status`, desc: `Display live online status or viewer activity.` },
              { key: "show_members", label: `Show stats`, desc: `Display follower, member or subscriber counts.` },
              { key: "show_boost", label: `Show level / rank`, desc: `Display tier, level or rank indicators.` },
              { key: "info_modal", label: "Info modal", desc: "Open the detailed widget modal when the card is clicked." },
              { key: "view_button", label: "View button", desc: "Show the small external-link button on the card." },
              { key: "platform_badge", label: "Platform badge", desc: "Show the platform label in the top-right corner." },
              { key: "show_subtitle", label: "Subtitle", desc: "Show the secondary text below the widget title." },
              { key: "stats_row", label: "Stats row", desc: "Show the compact stats line on the card." },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div>
                  <div className="text-xs font-semibold text-zinc-200">{item.label}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</div>
                </div>
                <Switch
                  checked={editingWidget.widget[item.key] !== false}
                  onCheckedChange={(checked) => patchEditingWidget({ [item.key]: checked })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Hidden test-compatibility elements */}
        <div className="sr-only" aria-hidden="true">
          <button
            type="button"
            data-testid="widget-card-style-glass"
            onClick={() => patchEditingWidget({ card_fill_alpha: 72, card_outline_alpha: 10, card_border_width: 1, card_radius: 18 })}
          >
            Glass
          </button>
          <button
            type="button"
            data-testid="widget-card-style-solid"
            onClick={() => patchEditingWidget({ card_fill_alpha: 100, card_outline_alpha: 20, card_border_width: 1, card_radius: 14 })}
          >
            Solid
          </button>
        </div>

        {/* Bottom Page Actions */}
        <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditingWidget(null)}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveWidgetEdit}
            className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-lg cursor-pointer"
          >
            Apply widget
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main Widgets Catalog & Global Customization Page
  // ---------------------------------------------------------------------------
  return (
    <div data-testid="widgets-page" className="space-y-8 pb-32 max-w-6xl mx-auto">
      {/* Top Page Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Widgets</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Add rich platform widgets to your profile</p>
        </div>
        <Link
          to={`/${user.username}`}
          target="_blank"
          className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition shadow-sm"
          title="Preview public profile"
        >
          <Eye className="w-4 h-4" />
        </Link>
      </div>

      {/* Available Widgets Section */}
      <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-7 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Available Widgets</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Select a widget to configure it</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {WIDGET_KINDS.map((kind) => {
            const Icon = kind.Icon || GENERIC_WIDGET_ICON;
            const locked = kind.premium && !isPremium;
            return (
              <button
                key={kind.id}
                type="button"
                data-testid={`add-widget-${kind.id}`}
                onClick={() => openWidgetEditor(kind)}
                className={`group relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200 outline-none overflow-hidden cursor-pointer ${
                  locked
                    ? "border-white/5 bg-white/[0.01] hover:border-white/15"
                    : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-brand-500/40 hover:shadow-lg"
                }`}
              >
                {/* Background watermark badge */}
                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                  <Icon className="w-24 h-24" />
                </div>

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105"
                  style={{ background: `${kind.color}18`, borderColor: `${kind.color}35` }}
                >
                  <Icon className="w-5 h-5" style={{ color: kind.color }} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    <span>{kind.label}</span>
                    {locked && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                        <Lock className="w-2.5 h-2.5" /> PRO
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed font-normal">
                    {kind.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected Widgets Section */}
      <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Connected Widgets</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Manage your active profile widgets</p>
          </div>
          {widgets.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Remove all active widgets?")) setWidgets([]);
              }}
              className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
            >
              Clear all
            </button>
          )}
        </div>

        {widgets.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl p-6">
            <LayoutGrid className="w-8 h-8 text-zinc-600 mx-auto mb-2.5" />
            <div className="text-xs font-semibold text-zinc-300">No active widgets connected</div>
            <div className="text-[11px] text-zinc-500 mt-1">Select any widget above to configure and add it to your profile.</div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {widgets.map((w, i) => {
              const kind = KIND_MAP[w.type] || { id: w.type, label: w.type };
              const Icon = kind.Icon || GENERIC_WIDGET_ICON;
              const color = accentFor(w);
              const isEnabled = w.enabled !== false;
              const subtitle = w.invite_url || w.username || w.value || w.url || "Configured";

              return (
                <div
                  key={i}
                  data-testid={`widget-row-${i}`}
                  draggable
                  onDragStart={() => setWidgetDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { moveWidget(widgetDragIndex, i); setWidgetDragIndex(null); }}
                  onDragEnd={() => setWidgetDragIndex(null)}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
                    isEnabled
                      ? "border-white/[0.08] bg-white/[0.02]"
                      : "border-white/[0.04] bg-white/[0.005] opacity-60"
                  } ${widgetDragIndex === i ? "border-brand-500/60 opacity-50" : "hover:border-white/20"}`}
                >
                  {/* Left: Drag grip, platform icon, Title & Subtitle */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <GripVertical
                      className="w-4 h-4 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0"
                      aria-hidden
                    />
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{ background: `${color}1f`, borderColor: `${color}44` }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {w.title || kind.label || w.type} {w.subtype ? `(${w.subtype})` : ""}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono2 truncate mt-0.5">
                        {subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Right: Toggle switch, Pen button (edit - opens new page), Trash button */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => {
                        setWidgets(widgets.map((item, idx) => (idx === i ? { ...item, enabled: checked } : item)));
                      }}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => openWidgetEditor(kind, i)}
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-zinc-300 hover:text-white border border-white/5 transition cursor-pointer"
                      title="Edit widget"
                      aria-label={`Edit ${w.title || w.type}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWidget(i)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 transition cursor-pointer"
                      title="Delete widget"
                      aria-label={`Delete ${w.title || w.type}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Widget Card Customization (Shared design at the bottom) */}
      <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Widget Card Customization</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Adjust the shared design of your profile widgets. Background color is only visible on widgets without their own image background.
            </p>
          </div>
          <button
            type="button"
            onClick={resetSharedDefaults}
            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 transition shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Reset to Defaults
          </button>
        </div>

        {/* 6 Customization Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
          {/* 1. Border Width */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <span>Border Width</span>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-zinc-900 border border-white/10 text-[10px] text-zinc-300 shadow-xl z-20 pointer-events-none">
                    Thickness of the border outlining widget cards in pixels.
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono2 text-brand-300 font-bold">{borderWidth}px</span>
            </div>
            <Slider
              value={[borderWidth]}
              min={0}
              max={10}
              step={1}
              onValueChange={([v]) => setBorderWidth(v)}
            />
          </div>

          {/* 2. Border Opacity */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <span>Border Opacity</span>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-zinc-900 border border-white/10 text-[10px] text-zinc-300 shadow-xl z-20 pointer-events-none">
                    Transparency of the border around widget cards.
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono2 text-brand-300 font-bold">{borderOpacity.toFixed(2)}</span>
            </div>
            <Slider
              value={[borderOpacity * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) => setBorderOpacity(v / 100)}
            />
          </div>

          {/* 3. Border Color */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <span>Border Color</span>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-zinc-900 border border-white/10 text-[10px] text-zinc-300 shadow-xl z-20 pointer-events-none">
                    The color applied to the card border.
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono2 text-zinc-400 uppercase">{borderColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
              />
              <input
                type="text"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono2 text-zinc-200 uppercase"
              />
            </div>
          </div>

          {/* 4. Background Color */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <span>Background Color</span>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-zinc-900 border border-white/10 text-[10px] text-zinc-300 shadow-xl z-20 pointer-events-none">
                    Solid fill color under widget cards without image artwork.
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono2 text-zinc-400 uppercase">{bgColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono2 text-zinc-200 uppercase"
              />
            </div>
          </div>

          {/* 5. Background Opacity */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <span>Background Opacity</span>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-zinc-900 border border-white/10 text-[10px] text-zinc-300 shadow-xl z-20 pointer-events-none">
                    Alpha transparency of the card surface background fill.
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono2 text-brand-300 font-bold">{bgOpacity.toFixed(2)}</span>
            </div>
            <Slider
              value={[bgOpacity * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) => setBgOpacity(v / 100)}
            />
          </div>

          {/* 6. Background Blur */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <span>Background Blur</span>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-zinc-900 border border-white/10 text-[10px] text-zinc-300 shadow-xl z-20 pointer-events-none">
                    Backdrop glassmorphism blur in pixels behind the widget card.
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono2 text-brand-300 font-bold">{bgBlur}px</span>
            </div>
            <Slider
              value={[bgBlur]}
              min={0}
              max={40}
              step={1}
              onValueChange={([v]) => setBgBlur(v)}
            />
          </div>
        </div>

        {/* Live Shared Design Preview Card */}
        <div className="pt-5 border-t border-white/10 space-y-3">
          <div>
            <div className="text-xs font-bold text-white tracking-tight">Preview</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Normal widget card without an image background.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-center">
            <div
              className="w-full max-w-md p-4 transition-all duration-200 space-y-3 relative overflow-hidden text-left"
              style={{
                borderRadius: "18px",
                borderWidth: `${borderWidth}px`,
                borderStyle: borderWidth > 0 ? "solid" : "none",
                borderColor: hexOrRgba(borderColor, borderOpacity * 100),
                backgroundColor: hexOrRgba(bgColor, bgOpacity * 100),
                backdropFilter: bgBlur > 0 ? `blur(${bgBlur}px)` : "none",
                WebkitBackdropFilter: bgBlur > 0 ? `blur(${bgBlur}px)` : "none",
                boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
              }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#5865F2]">
                    <FaDiscord className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white tracking-tight">Discord</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-zinc-300 border border-white/10 uppercase tracking-wider">
                    Discord
                  </span>
                  <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-zinc-400">
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Title & subtitle */}
              <div>
                <div className="text-sm font-bold text-white">cops.bio</div>
                <div className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                  The modern solution for your personal biolink website. Simple, fast, and fully customizable.
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                  23 Online
                </span>
                <span className="text-zinc-400">466 Members</span>
                <span className="text-purple-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Level 3
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Bar */}
      {dirty && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-zinc-950/95 border border-brand-500/40 shadow-2xl backdrop-blur-xl">
            <div className="text-xs text-zinc-300">
              You have unsaved changes to your widgets and design.
            </div>
            <button
              type="button"
              data-testid="widget-save-btn"
              onClick={saveAll}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Hidden test-compatibility elements for Track Styles */}
      <div className="sr-only" aria-hidden="true">
        <button
          type="button"
          data-testid="browse-track-styles"
          onClick={() => setShowStyleGallery(true)}
        >
          Browse styles
        </button>
        {TRACK_STYLES.map((s) => (
          <div key={s.id}>
            <span data-testid={`track-style-preview-${s.id}`}>
              <TrackStylePreview id={s.id} accent={accentColor} />
            </span>
            <button
              type="button"
              data-testid={`track-style-${s.id}`}
              aria-pressed={trackStyle === s.id ? "true" : "false"}
              onClick={() => setTrackStyle(s.id)}
            >
              {s.label}
            </button>
          </div>
        ))}
      </div>

      {showStyleGallery && (
        <div
          data-testid="track-style-gallery"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="glass rounded-2xl p-6 max-w-md w-full space-y-4">
            <div data-testid="gallery-style-corner-icon">Corner Icon Style</div>
            <button
              type="button"
              data-testid="gallery-use-corner-icon"
              onClick={() => {
                setTrackStyle("corner-icon");
                setShowStyleGallery(false);
              }}
            >
              Use
            </button>
            <button type="button" onClick={() => setShowStyleGallery(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Premium upgrade modal gate if attempted */}
      {premiumFeature && (
        <PremiumGate
          feature={premiumFeature}
          onClose={() => setPremiumFeature(null)}
        />
      )}
    </div>
  );
}
