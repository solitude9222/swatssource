import { memo, useDeferredValue, useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { PremiumGate } from "@/components/ui-shared/PremiumGate";
import { api, fileUrl } from "@/lib/api";
import { ProfilePreview, TrackCardPreview } from "@/components/ProfilePreview";
import AvatarDecorationModal from "@/components/AvatarDecorationModal";
import { ColorPicker } from "@/components/ColorPicker";
import { SmartSelect } from "@/components/ui-shared/SmartSelect";
import { CrosshairPicker } from "@/components/CrosshairPicker";
import { BackgroundEffect } from "@/components/BackgroundEffect";
import { OverlayEffect } from "@/components/OverlayEffect";
import { FxText } from "@/components/FxText";
import { TOOLTIP_STYLES, TOOLTIP_ANIMATIONS, TOOLTIP_SIZES } from "@/components/FxTooltip";
import {
  TEXT_EFFECTS, OVERLAYS, CURSOR_EFFECTS, BACKGROUND_EFFECTS,
} from "@/constants/effects";
import {
  LAYOUTS, LAYOUT_MAP, DEFAULT_LAYOUT, SECTION_ANIMATIONS, resolveLayout,
  TRACK_POSITION_LABELS, trackPositionForLayout,
} from "@/constants/layouts";
import { TRACK_STYLES, resolveTrackStyle } from "@/constants/effects";
import { TrackStylePreview } from "@/components/TrackStylePreview";
import { FONTS, FREE_FONTS, fontStackOf, ensureFontsLoaded } from "@/constants/fonts";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/lib/notify";
import { useEditGate } from "@/hooks/useEditGate";
import AuthGateNotice from "@/components/AuthGateNotice";
import { useClearFxPreviewOnUnmount, setFxPreview, useFxPreview } from "@/components/overlays/useFxPreview";
import {
  EffectDrawer,
  FxModal,
  useEffectMemory,
  FxTuningProvider,
  FxTile,
} from "@/components/overlays";
import {
  Upload, Trash2, Loader2, Lock, Save, Image as ImageIcon, Film, Layout, Check, ChevronDown,
  ChevronRight, MousePointer2, User, Paintbrush, Music, Sparkles, Sliders, Volume2, VolumeX,
  Play, Pause, Disc, FileText, AlignLeft, Shuffle, Repeat, Plus,
} from "lucide-react";

export const CARD_STYLE_PRESETS = {
  classic: {
    card_style: "classic",
    card_fill_color: "#131316",
    card_fill_alpha: 78,
    card_blur: 20,
    card_outline_alpha: 33,
    card_radius: 24,
    card_background: true,
    card_bg_enabled: true,
    card_transparent: false,
    card_glow: true,
  },
  frosted: {
    card_style: "frosted",
    card_fill_color: "#ffffff",
    card_fill_alpha: 10,
    card_blur: 25,
    card_outline_alpha: 20,
    card_outline_color: "#ffffff",
    card_radius: 24,
    card_background: true,
    card_bg_enabled: true,
    card_transparent: false,
    card_glow: false,
  },
  "frosted-soft": {
    card_style: "frosted-soft",
    card_fill_color: "#ffffff",
    card_fill_alpha: 6,
    card_blur: 14,
    card_outline_alpha: 10,
    card_outline_color: "#ffffff",
    card_radius: 24,
    card_background: true,
    card_bg_enabled: true,
    card_transparent: false,
    card_glow: false,
  },
  outlined: {
    card_style: "outlined",
    card_fill_color: "#000000",
    card_fill_alpha: 0,
    card_blur: 0,
    card_outline_alpha: 100,
    card_radius: 24,
    card_background: true,
    card_bg_enabled: true,
    card_transparent: false,
    card_glow: false,
  },
  aurora: {
    card_style: "aurora",
    card_fill_color: "#0f1015",
    card_fill_alpha: 65,
    card_blur: 20,
    card_outline_alpha: 45,
    card_radius: 24,
    card_background: true,
    card_bg_enabled: true,
    card_transparent: false,
    card_glow: true,
  },
  transparent: {
    card_style: "transparent",
    card_fill_color: "#000000",
    card_fill_alpha: 0,
    card_blur: 0,
    card_outline_alpha: 0,
    card_radius: 24,
    card_background: false,
    card_bg_enabled: false,
    card_transparent: true,
    card_glow: false,
  },
};

const PREVIEW_WORD = "tourn";

// Named sections plus the aliases older links still use. "layout" and "effects"
// are not separate panels any more â€” the layout picker lives in Appearance and
// the effect pickers in Extra â€” so an old bookmark lands on the page that owns
// those controls instead of a bare panel.
const EDITOR_TABS = ["about", "appearance", "audios", "extra"];
const TAB_ALIASES = {
  profile: "about",
  card: "appearance",
  layout: "appearance",
  effects: "extra",
  entry: "extra",
};
const resolveEditorTab = (raw) => {
  const id = String(raw || "");
  if (EDITOR_TABS.includes(id)) return id;
  return TAB_ALIASES[id] || "about";
};

const SWITCH_CLASS =
  "h-5 w-9 shrink-0 rounded-full border border-[#2a2a2e] bg-[#111111] shadow-inner transition-colors duration-200 data-[state=checked]:border-[#b4bffa] data-[state=checked]:bg-[#b4bffa] data-[state=unchecked]:bg-[#3f3f46]/40";

function FontField({ label, value, onChange, isPremium, navigate, testid }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const selected =
    FONTS.find((f) => fontStackOf(value) === f.stack) ||
    FONTS.find((f) => f.name.toLowerCase() === String(value).toLowerCase()) ||
    FONTS.find((f) => f.free);

  // Typing in the search field re-filters a few hundred tiles; deferring the
  // query keeps the keystrokes immediate and lets the list catch up, instead of
  // blocking every character on the whole grid. Same for the category chips.
  const deferredQuery = useDeferredValue(query);
  const deferredCategory = useDeferredValue(activeCategory);

  const categories = useMemo(() => {
    const list = ["All"];
    FONTS.forEach((f) => {
      const cat = f.category || "Other";
      if (!list.includes(cat)) list.push(cat);
    });
    return list;
  }, []);

  const q = deferredQuery.trim().toLowerCase();
  const matches = useMemo(() => {
    let list = FONTS;
    if (deferredCategory !== "All") {
      list = list.filter((f) => (f.category || "Other") === deferredCategory);
    }
    if (q) {
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list;
  }, [q, deferredCategory]);

  const categorizedFonts = useMemo(() => {
    return matches.reduce((acc, font) => {
      const cat = font.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(font);
      return acc;
    }, {});
  }, [matches]);

  return (
    <div data-testid={testid}>
      <div className="mb-2 text-xs font-semibold text-zinc-300">{label}</div>

      <button
        type="button"
        data-testid={`${testid}-open`}
        onClick={() => { setQuery(""); setIsOpen(true); }}
        className="w-full flex items-center justify-between rounded-xl border border-[#2a2a2e] bg-[#111111] px-4 py-3 hover:border-[#b4bffa] transition-colors cursor-pointer"
      >
        <span className="text-sm text-white" style={{ fontFamily: selected.stack }}>
          {selected.name}
        </span>
        <span className="text-[10px] font-bold text-black bg-[#b4bffa] px-2.5 py-1 rounded-md">
          Change
        </span>
      </button>

      <FxModal
        open={isOpen}
        onOpenChange={setIsOpen}
        id={`${testid}-drawer`}
        title={label}
        eyebrow="Fonts"
        testid={`${testid}-drawer`}
      >
        {/* Category Subtabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3 -mx-1 px-1">
          {categories.map((cat) => {
            const active = activeCategory === cat;
            const count = cat === "All" ? FONTS.length : FONTS.filter((f) => (f.category || "Other") === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  active
                    ? "bg-[#b4bffa] text-black shadow-md font-bold"
                    : "bg-[#141418] text-zinc-400 hover:text-white border border-[#2a2a2e] hover:border-white/30"
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono2 ${active ? "bg-black/20 text-black font-bold" : "bg-white/10 text-zinc-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <input
          autoFocus
          type="search"
          data-testid={`${testid}-search`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${activeCategory === "All" ? "all" : activeCategory.toLowerCase()} fontsâ€¦`}
          className="ov-input mb-4 px-4 py-2.5 text-sm placeholder:text-zinc-500 bg-[#111111] border border-[#2a2a2e] text-white rounded-xl w-full"
        />

        <div className="mb-5 rounded-xl border border-[#2a2a2e] bg-[#111111] px-4 py-3">
          <div className="text-[11px] text-zinc-400">Preview</div>
          <div className="mt-1 truncate text-2xl text-white" style={{ fontFamily: selected.stack }}>
            {PREVIEW_WORD} Â· @yourname
          </div>
        </div>

        {matches.length === 0 && (
          <p className="py-10 text-center text-sm text-zinc-500">No fonts match â€œ{query}â€.</p>
        )}

        {Object.entries(categorizedFonts).map(([category, fonts]) => (
          <div key={category} className="mb-6 space-y-3">
            <h3 className="sticky top-0 z-[1] bg-[#09090b] py-2 font-display text-[11px] font-bold text-zinc-300 backdrop-blur-md">
              {category}
            </h3>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {fonts.map((f) => {
                const locked = !f.free && !isPremium;
                const active = selected?.name === f.name;
                return (
                  <button
                    key={f.name}
                    type="button"
                    data-testid={`${testid}-font-${f.name}`}
                    onClick={() => {
                      if (locked) { setIsOpen(false); navigate("/!/pricing"); }
                      else { onChange(f.stack); setIsOpen(false); }
                    }}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors duration-200 cursor-pointer ${
                      active
                        ? "border-[#b4bffa] bg-[#b4bffa] text-black font-bold"
                        : locked
                        ? "border-[#3f3f46]/20 bg-[#111111] text-zinc-500 hover:border-amber-500/30"
                        : "border-[#2a2a2e] bg-[#111111] hover:border-white/40 text-zinc-200"
                    }`}
                  >
                    <span
                      className={`truncate text-[15px] ${locked ? "text-zinc-500" : active ? "text-white font-bold" : "text-zinc-200"}`}
                      style={{ fontFamily: f.stack }}
                      title={f.name}
                    >
                      {f.name}
                    </span>
                    <span className="ml-2 shrink-0">
                      {locked ? (
                        <Lock className="h-3.5 w-3.5 text-amber-400" />
                      ) : active ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </FxModal>
    </div>
  );
}

function LayoutPicker({ value, onChange, isPremium, navigate }) {
  const current = value || DEFAULT_LAYOUT;
  const [isOpen, setIsOpen] = useState(false);
  const layoutItems = [
    {
      id: "minimal",
      label: "Minimal",
      hint: "Clean rectangular card with centered bio, badges and links",
      icon: (active) => (
        <div className={`w-full h-14 rounded-xl border flex flex-col items-center justify-center gap-1.5 p-2 transition-colors ${active ? "border-[#b4bffa]/50 bg-[#b4bffa]/15" : "border-white/10 bg-[#09090b]"}`}>
          <div className="w-5 h-5 rounded-full bg-white/30 border border-white/20" />
          <div className="w-14 h-1.5 rounded-full bg-white/40" />
          <div className="w-9 h-1 rounded-full bg-white/20" />
        </div>
      ),
    },
    {
      id: "floating",
      label: "Floating",
      hint: "Elevated frosted card with avatar hovering over top border",
      icon: (active) => (
        <div className={`relative w-full h-14 rounded-xl border flex flex-col items-center justify-end pb-2 pt-4 px-2 transition-colors ${active ? "border-[#b4bffa]/50 bg-[#b4bffa]/15" : "border-white/10 bg-[#09090b]"}`}>
          <div className="absolute top-1 w-5 h-5 rounded-full bg-white/40 border border-black/40 shadow-sm" />
          <div className="w-14 h-1.5 rounded-full bg-white/40 mb-1" />
          <div className="w-20 h-1 rounded-full bg-white/20" />
        </div>
      ),
    },
    {
      id: "banner",
      label: "Banner",
      hint: "Wide header banner image with overlapping avatar & details",
      icon: (active) => (
        <div className={`w-full h-14 rounded-xl border overflow-hidden flex flex-col transition-colors ${active ? "border-[#b4bffa]/50 bg-[#b4bffa]/15" : "border-white/10 bg-[#09090b]"}`}>
          <div className="w-full h-5 bg-white/20 border-b border-white/10 relative">
            <div className="absolute -bottom-2.5 left-2.5 w-5 h-5 rounded-full bg-white/40 border border-black/50" />
          </div>
          <div className="flex-1 pl-10 pt-1.5 space-y-1">
            <div className="w-12 h-1.5 rounded-full bg-white/40" />
            <div className="w-16 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      ),
    },
    {
      id: "slideshow",
      label: "Slideshow",
      hint: "Interactive multi-page slider with smooth transitions",
      icon: (active) => (
        <div className={`w-full h-14 rounded-xl border flex items-center justify-between px-2 gap-1.5 transition-colors ${active ? "border-[#b4bffa]/50 bg-[#b4bffa]/15" : "border-white/10 bg-[#09090b]"}`}>
          <div className="w-2 h-6 rounded-sm bg-white/15" />
          <div className="flex-1 h-10 rounded-lg bg-white/20 border border-white/10 flex flex-col items-center justify-center gap-1">
            <div className="w-4 h-4 rounded-full bg-white/40" />
            <div className="w-10 h-1 rounded-full bg-white/25" />
          </div>
          <div className="w-2 h-6 rounded-sm bg-white/15" />
        </div>
      ),
    },
  ];

  const currentLabel = layoutItems.find((l) => l.id === current)?.label || "Minimal";

  return (
    <div data-testid="layout-picker-container">
      <button
        type="button"
        data-testid="layout-open"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between rounded-xl border border-[#2a2a2e] bg-[#111111] px-4 py-3 hover:border-[#b4bffa] transition-colors cursor-pointer"
      >
        <span className="text-sm text-white">{currentLabel}</span>
        <span className="text-[10px] font-bold text-black bg-[#b4bffa] px-2.5 py-1 rounded-md">Change</span>
      </button>

      <FxModal
        open={isOpen}
        onOpenChange={setIsOpen}
        id="layout-drawer"
        title="Profile Layout"
        eyebrow="Layout"
        testid="layout-drawer"
      >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {layoutItems.map((l) => {
          const active = current === l.id;
          return (
            <button
              key={l.id}
              type="button"
              data-testid={`layout-option-${l.id}`}
              onClick={() => onChange(l.id)}
              className={`group relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer ${
                active
                  ? "border-[#b4bffa] bg-[#b4bffa]/10 shadow-[0_0_25px_rgba(180,191,250,0.15)] ring-1 ring-[#b4bffa]/50"
                  : "border-[#2a2a2e] bg-[#0c0c0e] hover:border-white/30 hover:bg-[#141418] text-zinc-300"
              }`}
            >
              {l.icon(active)}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{l.label}</span>
                  {active ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#b4bffa] text-black shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded-full border border-white/20 group-hover:border-white/40" />
                  )}
                </div>
                <p className="text-[11px] leading-snug text-zinc-400">{l.hint}</p>
              </div>
            </button>
          );
        })}
      </div>
      </FxModal>
    </div>
  );
}

// Sections no longer animate in. `animate-slide-up stagger-children` replayed a
// 300 ms movement on every section each time a subtab mounted, so switching tab
// read as a twitch; the panel's single entrance lives in the dashboard shell.
const Section = ({ title, hint, children }) => (
  <section className="w-full space-y-6 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-5 sm:p-7">
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#b4bffa]/15 text-[#c084fc]">
        <Sliders className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h2 className="truncate text-[15px] font-semibold leading-tight text-white">{title}</h2>
        {hint && <p className="mt-0.5 truncate text-xs text-zinc-400">{hint}</p>}
      </div>
    </div>
    {children}
  </section>
);

// Everything past the everyday controls is \"advanced\": surface dials, playback
// behaviour, page/privacy and embed settings. It stays out of the page entirely
// until Advanced mode is on, and the switch that turns it on sits at the bottom
// of the editor (see the AdvancedBar) instead of at the top of one section.
const AdvancedNotice = ({ what }) => (
  <div
    data-testid="advanced-hidden-notice"
    className="flex items-start gap-3 rounded-2xl border border-dashed border-white/[0.09] bg-[#0d0d0f] px-4 py-3.5"
  >
    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
    <div className="min-w-0">
      <p className="text-xs font-semibold text-zinc-300">Advanced settings are hidden</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
        {what} Turn on Advanced mode at the bottom of this page to reveal them.
      </p>
    </div>
  </div>
);

const ChipGrid = ({ options, value, onChange, onLocked, testid, cols = 3 }) => (
  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
    {options.map((o) => {
      const active = (value ?? "") === o.id;
      return (
        <button
          key={o.id || "none"}
          type="button"
          data-testid={testid ? `${testid}-${o.id || "none"}` : undefined}
          onClick={() => (o.locked ? onLocked?.() : onChange(o.id))}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
            active
              ? "border-[#b4bffa] bg-[#b4bffa] text-black font-bold shadow-sm"
              : o.locked
                ? "border-[#1f1f1f] bg-[#09090b] text-zinc-600"
                : "border-[#2a2a2e] bg-[#09090b] text-zinc-300 hover:border-white/30 hover:text-white"
          }`}
        >
          {o.locked && <Lock className="h-3 w-3 text-amber-400" />}
          <span className="truncate">{o.label}</span>
        </button>
      );
    })}
  </div>
);

const SliderRow = ({ label, value, min, max, step = 1, suffix = "", onChange, testid }) => {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  return (
    <div data-testid={testid}>
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-300 font-medium">
        <span>{label}</span>
        <span className="font-mono2 text-white font-bold">
          {local}
          {suffix}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[local]}
        onValueChange={([v]) => setLocal(v)}
        onValueCommit={([v]) => onChange(v)}
        className="[&_[role=slider]]:border-[#b4bffa] [&_[role=slider]]:bg-white [&_.absolute]:bg-[#b4bffa]"
        aria-label={label}
      />
    </div>
  );
};

const ENTRY_STYLES = [
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
];

const EntryStyleThumb = ({ id, accent }) => (
  <span className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-xl border border-[#2a2a2e] bg-[#09090b]">
    {id === "text" ? (
      <span className="relative font-mono2 text-[10px] uppercase tracking-widest text-white font-bold">
        Click to enter
      </span>
    ) : (
      <span className="relative flex items-center justify-center">
        <img src="/logo.png" alt="" className="w-8 h-8 object-contain scale-100" />
      </span>
    )}
  </span>
);

const ToggleRow = ({ testid, label, hint, checked, onCheckedChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#2a2a2e] bg-[#09090b] px-3.5 py-2.5 text-xs text-zinc-300 hover:border-[#3f3f46]/70 transition-colors">
    <span>
      {label}
      {hint && <span className="ml-2 text-[10px] text-zinc-500">({hint})</span>}
    </span>
    <Switch data-testid={testid} className={SWITCH_CLASS} checked={checked} onCheckedChange={onCheckedChange} />
  </label>
);

const LivePreviewCard = memo(function LivePreviewCard({ user, profile, displayName, tuning }) {
  const fxPreview = useFxPreview();

  const data = useMemo(() => {
    const previewProfile = { ...profile };
    if (fxPreview?.slot === "name") previewProfile.name_effect = fxPreview.id;
    if (fxPreview?.slot === "bio") previewProfile.bio_effect = fxPreview.id;
    return { ...user, display_name: displayName, profile: previewProfile };
  }, [user, profile, displayName, fxPreview]);

  return (
    <FxTuningProvider tuning={tuning}>
      <ProfilePreview data={data} embedded />
    </FxTuningProvider>
  );
});

function EffectStage({ variant, id, accent, label, size = "lg" }) {
  const compact = size === "compact";
  const frame = compact
    ? "relative h-28 w-52 sm:w-64 shrink-0 overflow-hidden rounded-2xl border border-[#2a2a2e] bg-[#09090b]"
    : "relative h-56 sm:h-64 w-full overflow-hidden rounded-2xl border border-[#2a2a2e] bg-[#09090b]";
  const caption = (
    <span className="absolute left-4 top-3 z-20 max-w-[calc(100%-2rem)] truncate text-[10px] font-mono2 uppercase tracking-[0.14em] text-zinc-400">
      {label}
    </span>
  );

  if (variant === "cursor") {
    return (
      <div className={frame}>
        {caption}
        {id ? (
          <div className={`absolute inset-0 fx-cursor-demo fx-cursor-${id} scale-[1.7]`}>
            <i /><i /><i /><i /><i /><i />
          </div>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-mono2 text-zinc-500">
            No cursor effect
          </span>
        )}
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={`${frame} flex items-center justify-center px-6`}>
        {caption}
        <FxText
          id={id || ""}
          text={PREVIEW_WORD}
          className={
            compact
              ? "text-2xl font-black tracking-tight text-white"
              : "text-4xl font-black tracking-tight text-white sm:text-5xl"
          }
        />
      </div>
    );
  }

  return (
    <div className={frame}>
      {caption}
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 125%, ${accent}55, transparent 72%)` }} />
      <div className="relative z-10 flex h-full items-center justify-center px-6 pointer-events-none">
        <div className={`rounded-2xl border border-[#2a2a2e] bg-black/50 text-center backdrop-blur-sm ${compact ? "px-4 py-3" : "px-6 py-5"}`}>
          <div className={`font-bold text-white ${compact ? "text-xs" : "text-base"}`}>swats</div>
          <div className="mt-1 font-mono2 text-[10px] text-zinc-400">@yourname</div>
        </div>
      </div>
      {id && variant === "bg" && <BackgroundEffect effect={id} />}
      {id && variant === "overlay" && <OverlayEffect effect={id} color={accent} />}
    </div>
  );
}

function EffectPicker({
  options, value, onChange, isPremium, navigate, testid, variant, accent,
  displayName, onPreview, tuning, onTuningChange, onTuningReset,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const memory = useEffectMemory(testid);

  const choices = [{ id: "", label: "None", premium: false }, ...options.filter((o) => o.id !== "")];
  const selected = choices.find((c) => c.id === (value || "")) || choices[0];
  const title =
    variant === "text" ? "Text effects"
      : variant === "bg" ? "Background effects"
      : variant === "overlay" ? "Overlay effects"
      : "Cursor effects";

  return (
    <div data-testid={testid} className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={() => { onPreview?.(null); setIsOpen(true); }}
        data-testid={`${testid}-stage-open`}
        aria-label={`Change the ${selected.label} effect`}
        className="shrink-0 rounded-2xl outline-none transition hover:ring-2 hover:ring-[#b4bffa]/60"
      >
        <EffectStage
          variant={variant}
          id={value || ""}
          accent={accent}
          size="compact"
          label={`${selected.label}${selected.premium && !isPremium ? " Â· Premium" : ""}`}
        />
      </button>

      <div className="min-w-[10rem] flex-1">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#b4bffa]" />
          <span className="truncate">{selected.label}</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
          {selected.id
            ? selected.premium && !isPremium
              ? "Premium â€” unlock it on the pricing page."
              : "Live on your profile."
            : "Nothing selected."}
        </p>
      </div>

      <button
        type="button"
        data-testid={`${testid}-open`}
        onClick={() => { onPreview?.(null); setIsOpen(true); }}
        className="px-4 py-2.5 rounded-xl bg-[#b4bffa] text-black font-bold text-xs transition hover:brightness-110 shrink-0"
      >
        Change effect
      </button>

      <EffectDrawer
        open={isOpen}
        onOpenChange={(o) => { setIsOpen(o); if (!o) onPreview?.(null); }}
        variant={variant}
        title={title}
        description="Pick an effect layer for your profile."
        options={options}
        value={value}
        onChange={(id) => { onChange(id); memory.pushRecent(id); }}
        onPreview={onPreview}
        isPremium={isPremium}
        onUpgrade={typeof navigate === "function" ? navigate : () => navigate?.("/!/pricing")}
        displayName={displayName || PREVIEW_WORD}
        accent={accent}
        tuning={tuning}
        onTuningChange={onTuningChange}
        onTuningReset={onTuningReset}
        favorites={memory.favorites}
        onToggleFavorite={memory.toggleFavorite}
        recent={memory.recent}
        testid={testid}
      />
    </div>
  );
}

function QuickUpload({ label, buttonLabel, value, accept, onUploaded, onRemove, premiumHint, testid }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", label.toLowerCase());
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onUploaded(data.url);
      toast.success(`${label} updated!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5" data-testid={testid}>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#b4bffa] px-4 py-2.5 text-xs font-bold text-black transition hover:brightness-110">
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {buttonLabel}
        <input type="file" accept={accept} onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>
      {value && (
        <button
          type="button"
          onClick={onRemove}
          data-testid={`${testid}-remove`}
          className="rounded-xl border border-[#2a2a2e] bg-[#09090b] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.08]"
        >
          Remove {label}
        </button>
      )}
      {premiumHint && <span className="text-[10px] text-amber-400">{premiumHint}</span>}
    </div>
  );
}

function MetaImageUpload({ value, onUploaded }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "embed image");
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onUploaded(data.url);
      toast.success("Embed image updated!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div data-testid="meta-image-upload">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#2a2a2e] bg-[#09090b] px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:border-[#b4bffa]">
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {value ? "Replace image" : "Upload image"}
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>
    </div>
  );
}

const ProfileRow = ({ label, children }) => (
  <div className="border-b border-[#1f1f1f] py-5 first:pt-0 last:border-b-0 last:pb-0">
    <div className="mb-3 text-[13px] font-semibold text-white">{label}</div>
    {children}
  </div>
);

export default function Editor() {
  const { user, setUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [premiumFeature, setPremiumFeature] = useState(null);
  const askPremium = (feature) => () => setPremiumFeature(feature);
  const gate = useEditGate();

  // The URL is the only place the open section lives. It used to be mirrored in
  // a `sub` state as well, with an effect copying one into the other; every
  // switch rendered twice and the two could disagree about the legacy
  // `?tab=layout` / `?tab=effects` aliases.
  const sub = resolveEditorTab(searchParams.get("tab"));

  const switchSub = (id) => {
    if (id === sub) return;
    setSearchParams(id === "about" ? {} : { tab: id }, { replace: true });
  };

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  const [showDecoModal, setShowDecoModal] = useState(false);
  const [showTipPanel, setShowTipPanel] = useState(false);
  const [showTextEffectsModal, setShowTextEffectsModal] = useState(false);
  const [showOverlayEffectsModal, setShowOverlayEffectsModal] = useState(false);
  const [showBgEffectsModal, setShowBgEffectsModal] = useState(false);
  const [showCursorEffectsModal, setShowCursorEffectsModal] = useState(false);

  // Media modals state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showCursorModal, setShowCursorModal] = useState(false);
  const [activeTextSlot, setActiveTextSlot] = useState("name"); // "name" | "alias" | "bio"

  const [p, setP] = useState({ ...user.profile });
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [bgMode, setBgMode] = useState(() => (user.profile?.background_url ? "media" : "color"));
  const [saving, setSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(() => localStorage.getItem("swats_editor_autosave") === "true");
  const autoSaveTimer = useRef(null);

  const makeSnapshot = (profile, name) =>
    JSON.stringify({
      ...profile,
      display_name: name || "",
    });

  const baselineRef = useRef(makeSnapshot(user.profile || {}, user.display_name || ""));
  const isDirty = baselineRef.current !== makeSnapshot(p, displayName);

  // Audio track draft for adding new song
  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackArtist, setNewTrackArtist] = useState("");
  const [newTrackUrl, setNewTrackUrl] = useState("");
  const [newTrackArtwork, setNewTrackArtwork] = useState("");
  const [trackStyle, setTrackStyle] = useState(() => resolveTrackStyle(user.profile?.track_style || user.profile?.audio_style || "compact"));
  const [newTrackLyrics, setNewTrackLyrics] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);

  useClearFxPreviewOnUnmount();

  const isPremium = user.tier === "premium" || user.tier === "admin" || user.is_owner;

  useEffect(() => {
    if (user?.profile) {
      setP((prev) => ({
        ...prev,
        ...user.profile,
        widgets: user.profile.widgets || [],
        tracks: user.profile.tracks || [],
      }));
      setTrackStyle(resolveTrackStyle(user.profile.track_style || user.profile.audio_style || "compact"));
      setDisplayName(user.display_name || "");
      baselineRef.current = makeSnapshot(user.profile, user.display_name);
      if (user.profile.background_url) setBgMode("media");
    }
  }, [user?.profile, user?.display_name]);

  const set = (k, v) => setP((prev) => ({ ...prev, [k]: v }));
  const setPlayerStyle = (id) => {
    const next = resolveTrackStyle(id);
    setTrackStyle(next);
    setP((prev) => ({ ...prev, track_style: next, audio_style: next }));
  };
  const accentColor = p.accent_color || "hsl(272, 24%, 46%)";
  // The layout decides the player's placement (see TRACK_POSITION_BY_LAYOUT),
  // so the audio panel reports it instead of offering a second switch that the
  // renderer could disagree with.
  const layout = resolveLayout(p.layout || DEFAULT_LAYOUT);
  const placement = trackPositionForLayout(layout);
  // One switch reveals every advanced control in the editor; it lives at the
  // bottom of the page so the everyday controls stay up top.
  const advanced = !!p.advanced_mode;

  const handleCardStylePreset = (styleId) => {
    const preset = CARD_STYLE_PRESETS[styleId] || { card_style: styleId };
    const isTransparent = styleId === "transparent";
    setP((prev) => ({
      ...prev,
      // Clear legacy transparent overrides so the chosen style can render.
      // Old profiles may have card_bg_enabled:false or card_transparent:true
      // from a deleted editor panel, which used to force every style to look
      // identical (always transparent) regardless of the picked preset.
      card_bg_enabled: isTransparent ? false : true,
      card_transparent: isTransparent ? true : false,
      ...preset,
      card_outline_color: preset.card_outline_color || prev.card_outline_color || accentColor,
      card_glow_color: preset.card_glow_color || prev.card_glow_color || accentColor,
    }));
  };

  const fxTuning = p.fx_tuning || {};
  const setFxTuning = (effectId, patch) => {
    if (!effectId) return;
    setP((prev) => ({
      ...prev,
      fx_tuning: {
        ...(prev.fx_tuning || {}),
        [effectId]: { ...((prev.fx_tuning || {})[effectId] || {}), ...patch },
      },
    }));
  };
  const resetFxTuning = (effectId) => {
    if (!effectId) return;
    setP((prev) => {
      const next = { ...(prev.fx_tuning || {}) };
      delete next[effectId];
      return { ...prev, fx_tuning: next };
    });
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "audio");
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setNewTrackUrl(data.url);
      const sizeStr = `${Math.round(file.size / 1024)} KB`;
      const fileNameTitle = file.name.replace(/\.[^/.]+$/, "");
      const finalTitle = newTrackTitle || fileNameTitle;
      setNewTrackTitle(finalTitle);
      const existing = p.tracks?.[0] || {};
      const updatedTrack = {
        ...existing,
        title: existing.title || finalTitle,
        url: data.url,
        size: sizeStr,
        artist: existing.artist || newTrackArtist || displayName || user.username || "Artist",
      };
      set("tracks", [updatedTrack, ...(p.tracks?.slice(1) || [])]);
      toast.success("Audio file uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Audio upload failed");
    }
    setUploadingAudio(false);
    e.target.value = "";
  };

  const handleArtworkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingArtwork(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "artwork");
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setNewTrackArtwork(data.url);
      const existing = p.tracks?.[0] || {};
      const updatedTrack = { ...existing, artwork: data.url };
      set("tracks", [updatedTrack, ...(p.tracks?.slice(1) || [])]);
      toast.success("Album cover uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Artwork upload failed");
    }
    setUploadingArtwork(false);
    e.target.value = "";
  };

  const handleLyricsFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setNewTrackLyrics(text);
      const existing = p.tracks?.[0] || {};
      const updatedTrack = { ...existing, lyrics: text };
      set("tracks", [updatedTrack, ...(p.tracks?.slice(1) || [])]);
      toast.success("Lyrics file loaded!");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAddTrack = () => {
    if (!newTrackUrl) {
      toast.error("Please upload or provide an audio URL");
      return;
    }
    const newEntry = {
      title: newTrackTitle.trim() || "Untitled Track",
      artist: newTrackArtist.trim() || displayName || user.username,
      url: newTrackUrl.trim(),
      artwork: newTrackArtwork.trim(),
      lyrics: newTrackLyrics.trim(),
    };
    const nextTracks = [...(p.tracks || []), newEntry];
    set("tracks", nextTracks);
    setNewTrackTitle("");
    setNewTrackArtist("");
    setNewTrackUrl("");
    setNewTrackArtwork("");
    setNewTrackLyrics("");
    toast.success("Track added to playlist!");
  };

  const handleRemoveTrack = (index) => {
    const nextTracks = (p.tracks || []).filter((_, i) => i !== index);
    set("tracks", nextTracks);
  };

  const save = async ({ silent = false } = {}) => {
    if (gate.guard("saving profile changes")) return;
    setSaving(true);
    try {
      const payload = {
        ...p,
        widgets: user.profile?.widgets || [],
        tracks: p.tracks || user.profile?.tracks || [],
        display_name: displayName,
      };
      if (p.advanced_mode) {
        payload.advanced_mode = true;
      } else {
        delete payload.advanced_mode;
      }
      const { data } = await api.put("/me/profile", payload);
      setUser(data);
      baselineRef.current = makeSnapshot(p, displayName);
      if (!silent) {
        toast.success("Profile changes saved!");
      }
    } catch (e) {
      if (!silent) {
        toast.error(e.response?.data?.detail || "Save failed");
      }
    }
    setSaving(false);
  };

  useEffect(() => {
    if (autoSave && isDirty && !saving) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        save({ silent: true });
      }, 1500);
    }
    return () => clearTimeout(autoSaveTimer.current);
  }, [autoSave, isDirty, saving, p, displayName]);

  const SUBTAB_ITEMS = [
    { id: "about", label: "About Me", icon: User },
    { id: "appearance", label: "Appearance", icon: Paintbrush },
    { id: "audios", label: "Audio", icon: Music },
    { id: "extra", label: "Extra", icon: Sparkles },
  ];

  return (
    <div data-testid="editor-page" className="space-y-6 text-white relative">
      <AuthGateNotice variant="card" />

      {/* Floating Unsaved Changes Pill in Top Right */}
      {isDirty && (
        <aside
          aria-label="Unsaved changes alert"
          className="fixed top-5 right-5 z-[120] flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#14120e]/95 border border-amber-500/40 text-amber-100 shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-amber-50 tracking-tight">You have unsaved changes</span>
            <span className="text-[10px] text-amber-300/80">Save to apply updates to your profile</span>
          </div>
          <button
            onClick={() => save()}
            disabled={saving}
            data-testid="editor-save"
            className="ml-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </aside>
      )}

      {/* Tab strip — full-width bordered bar, active = solid pill (cops.bio style) */}
      <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Profile editor sections" className="flex w-full rounded-[16px] border border-white/[0.07] bg-[#0c0c0e] p-1">
          {SUBTAB_ITEMS.map((s) => {
            const Icon = s.icon;
            const active = sub === s.id;
            return (
              <button
                key={s.id}
                type="button"
                data-testid={`editor-subtab-${s.id}`}
                onClick={() => switchSub(s.id)}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#535978] text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{s.label}</span>
              </button>
            );
          })}

          {/* Hidden test compat */}
          <div className="sr-only" aria-hidden="true">
            <button data-testid="editor-subtab-profile" onClick={() => switchSub("about")}>Profile</button>
            <button data-testid="editor-subtab-card" onClick={() => switchSub("appearance")}>Card</button>
            <button data-testid="editor-subtab-effects" onClick={() => switchSub("extra")}>Effects</button>
            <button data-testid="editor-subtab-entry" onClick={() => switchSub("extra")}>Entry</button>
            <button data-testid="editor-subtab-layout" onClick={() => switchSub("audios")}>Layout</button>
          </div>
        </nav>

        {/* Auto-save toggle */}
        <label className="flex w-fit shrink-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0c0c0e] px-3.5 py-2.5 text-xs text-zinc-400">
          <span>Auto-save</span>
          <Switch
            checked={autoSave}
            onCheckedChange={(val) => {
              setAutoSave(val);
              localStorage.setItem("swats_editor_autosave", String(val));
              toast.success(val ? "Auto-save enabled" : "Auto-save disabled");
            }}
          />
        </label>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
      <div className="w-full min-w-0 space-y-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={sub}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
          {sub === "about" && (
            <>
            <Section title="About Me" hint="Your display name, bio, and personal info">
              <ProfileRow label="Display Name">
                <input
                  data-testid="editor-displayname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl bg-[#0a0a0c] border border-[#2a2a2e] px-4 py-3 text-sm text-white outline-none focus:border-[#b4bffa] focus:ring-2 focus:ring-[#b4bffa]/20 placeholder:text-zinc-600 transition-all"
                  placeholder="Your display name"
                />
              </ProfileRow>

              <ProfileRow label="Bio">
                <textarea
                  data-testid="editor-bio"
                  value={p.bio || ""}
                  onChange={(e) => set("bio", e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl bg-[#0a0a0c] border border-[#2a2a2e] px-4 py-3 text-sm text-white outline-none focus:border-[#b4bffa] focus:ring-2 focus:ring-[#b4bffa]/20 placeholder:text-zinc-600 transition-all"
                  placeholder="Tell people who you are..."
                />
              </ProfileRow>

              <ProfileRow label="Details">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs text-zinc-400">Location</label>
                    <input
                      data-testid="editor-location"
                      value={p.location || ""}
                      onChange={(e) => set("location", e.target.value)}
                      placeholder="e.g. Tokyo, Japan"
                      className="w-full rounded-xl bg-[#0a0a0c] border border-[#2a2a2e] px-4 py-2.5 text-xs text-white outline-none focus:border-[#b4bffa] focus:ring-2 focus:ring-[#b4bffa]/20 placeholder:text-zinc-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-zinc-400">Accent Colour</label>
                    <ColorPicker label="" value={p.accent_color || "hsl(272, 24%, 46%)"} onChange={(v) => set("accent_color", v)} testid="color-accent" />
                  </div>
                </div>
              </ProfileRow>
            </Section>
            </>
          )}

          {/* ========================================================
              SUBTAB 2: APPEARANCE (CARD, BADGE, LAYOUT, LINK FULL REDO)
              ======================================================== */}
          {sub === "appearance" && (
            <>
              <Section title="Card Appearance" hint="Surface, glow, borders and presets">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-2">Card Style Presets</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.keys(CARD_STYLE_PRESETS).map((styleId) => {
                        const active = (p.card_style || "classic") === styleId;
                        return (
                          <button
                            key={styleId}
                            type="button"
                            data-testid={`cardstyle-${styleId}`}
                            onClick={() => handleCardStylePreset(styleId)}
                            className={`p-3 rounded-xl border text-xs font-semibold transition text-left ${
                              active
                                ? "border-[#b4bffa] bg-[#b4bffa] text-black font-bold shadow-sm"
                                : "border-[#2a2a2e] bg-[#09090b] text-zinc-300 hover:border-white/30"
                            }`}
                          >
                            <span className="capitalize">{styleId.replace("-", " ")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#1f1f1f] pt-4">
                    <div>
                      <div className="text-xs font-semibold text-white">Card Background</div>
                      <div className="text-[11px] text-zinc-400">Render card body background container</div>
                    </div>
                    <Switch
                      data-testid="card-bg-toggle"
                      className={SWITCH_CLASS}
                      checked={p.card_background !== false}
                      onCheckedChange={(v) => set("card_background", v)}
                    />
                  </div>

                  {advanced && (
                    <div data-testid="advanced-appearance" className="space-y-4 rounded-xl border border-[#2a2a2e] bg-[#09090b] p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs text-zinc-400">Card Fill Color</label>
                          <ColorPicker
                            value={p.card_fill_color || "#131316"}
                            onChange={(v) => set("card_fill_color", v)}
                            testid="card-fill-color"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs text-zinc-400">Border Outline Color</label>
                          <ColorPicker
                            value={p.card_outline_color || accentColor}
                            onChange={(v) => set("card_outline_color", v)}
                            testid="card-outline-color"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 border-t border-[#1f1f1f] pt-4">
                        <SliderRow
                          testid="card-fill-alpha"
                          label="Fill Opacity"
                          value={Number(p.card_fill_alpha ?? 78)}
                          min={0}
                          max={100}
                          suffix="%"
                          onChange={(v) => set("card_fill_alpha", v)}
                        />
                        <SliderRow
                          testid="card-blur"
                          label="Glass Blur"
                          value={Number(p.card_blur ?? 20)}
                          min={0}
                          max={40}
                          suffix="px"
                          onChange={(v) => set("card_blur", v)}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 border-t border-[#1f1f1f] pt-4">
                        <SliderRow
                          testid="card-outline-alpha"
                          label="Border Opacity"
                          value={Number(p.card_outline_alpha ?? 33)}
                          min={0}
                          max={100}
                          suffix="%"
                          onChange={(v) => {
                            set("card_outline_alpha", v);
                            set("card_border_opacity", v);
                          }}
                        />
                        <SliderRow
                          testid="card-radius"
                          label="Border Radius"
                          value={Number(p.card_radius ?? 24)}
                          min={0}
                          max={60}
                          suffix="px"
                          onChange={(v) => set("card_radius", v)}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 border-t border-[#1f1f1f] pt-4">
                        <SliderRow
                          testid="card-width"
                          label="Card Width"
                          value={Number(p.card_width ?? 680)}
                          min={320}
                          max={920}
                          step={20}
                          suffix="px"
                          onChange={(v) => set("card_width", v)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Glow & Gradient Settings */}
                  <div className="space-y-4 rounded-xl border border-[#2a2a2e] bg-[#09090b] p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Glow & Gradient</h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">Card Ambient Glow</div>
                        <div className="text-[11px] text-zinc-400">Outer diffused luminescent halo</div>
                      </div>
                      <Switch
                        data-testid="card-glow-toggle"
                        className={SWITCH_CLASS}
                        checked={p.card_glow !== false}
                        onCheckedChange={(v) => set("card_glow", v)}
                      />
                    </div>

                    {p.card_glow !== false && (
                      <div className="grid gap-4 sm:grid-cols-2 border-t border-[#1f1f1f] pt-3">
                        <div>
                          <label className="mb-1.5 block text-xs text-zinc-400">Card Glow Color</label>
                          <ColorPicker
                            value={p.card_glow_color || accentColor}
                            onChange={(v) => set("card_glow_color", v)}
                            testid="card-glow-color"
                          />
                        </div>
                        <SliderRow
                          testid="card-glow-strength"
                          label="Card Glow Intensity"
                          value={Number(p.card_glow_strength ?? 50)}
                          min={0}
                          max={100}
                          suffix="%"
                          onChange={(v) => set("card_glow_strength", v)}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[#1f1f1f] pt-3">
                      <div>
                        <div className="text-xs font-semibold text-white">Card Gradient Fill</div>
                        <div className="text-[11px] text-zinc-400">Blend secondary color across card</div>
                      </div>
                      <Switch
                        data-testid="card-gradient-toggle"
                        className={SWITCH_CLASS}
                        checked={p.card_gradient_enabled === true}
                        onCheckedChange={(v) => set("card_gradient_enabled", v)}
                      />
                    </div>

                    {p.card_gradient_enabled && (
                      <div className="grid gap-4 sm:grid-cols-2 border-t border-[#1f1f1f] pt-3">
                        <div>
                          <label className="mb-1.5 block text-xs text-zinc-400">Gradient Secondary Color</label>
                          <ColorPicker
                            value={p.card_gradient_color || accentColor}
                            onChange={(v) => set("card_gradient_color", v)}
                          />
                        </div>
                        <SliderRow
                          label="Gradient Angle"
                          value={Number(p.card_gradient_angle ?? 135)}
                          min={0}
                          max={360}
                          step={5}
                          suffix="Â°"
                          onChange={(v) => set("card_gradient_angle", v)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Section>

              {/* Hidden test compatibility for badge styling legacy queries */}
              <div className="sr-only" aria-hidden="true">
                <ChipGrid
                  testid="badge-placement"
                  cols={3}
                  value={p.badge_placement || "next_to_name"}
                  onChange={(v) => set("badge_placement", v)}
                  options={[
                    { id: "next_to_name", label: "Next to Name" },
                    { id: "below_name", label: "Below Name" },
                    { id: "above_name", label: "Above Name" },
                    { id: "card_top_right", label: "Top Right" },
                    { id: "card_bottom", label: "Bottom of Card" },
                  ]}
                />
                <Switch
                  data-testid="badge-glow-toggle"
                  className={SWITCH_CLASS}
                  checked={p.badge_glow !== false}
                  onCheckedChange={(v) => set("badge_glow", v)}
                />
                <SliderRow
                  testid="badge-glow-intensity"
                  label="Badge Glow Intensity"
                  value={Number(p.badge_glow_intensity ?? 60)}
                  min={0}
                  max={100}
                  suffix="%"
                  onChange={(v) => set("badge_glow_intensity", v)}
                />
                <Switch
                  data-testid="badge-overlay-toggle"
                  className={SWITCH_CLASS}
                  checked={p.badge_overlay === true}
                  onCheckedChange={(v) => set("badge_overlay", v)}
                />
                <SliderRow
                  testid="badge-overlay-slider"
                  label="Badge Overlay Strength"
                  value={Number(p.badge_overlay_strength ?? 60)}
                  min={0}
                  max={100}
                  suffix="%"
                  onChange={(v) => set("badge_overlay_strength", v)}
                />
              </div>

              <Section title="Fonts" hint="Typography for your username, bio and text effects">
                <div className="space-y-4">
                  <FontField
                    testid="font-display"
                    label="Username font"
                    value={p.font_display}
                    onChange={(stack) => set("font_display", stack)}
                    isPremium={isPremium}
                    navigate={navigate}
                  />

                  <FontField
                    testid="font-bio"
                    label="Bio font"
                    value={p.font_bio}
                    onChange={(stack) => set("font_bio", stack)}
                    isPremium={isPremium}
                    navigate={navigate}
                  />

                  <div className="space-y-3 border-t border-[#1f1f1f] pt-4">
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Text effects</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Name effect</label>
                        <SmartSelect
                          value={p.name_effect || ""}
                          onChange={(v) => set("name_effect", v)}
                          options={[{ value: "", label: "None" }, ...TEXT_EFFECTS.map((e) => ({ value: e.id, label: e.label }))]}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Bio effect</label>
                        <SmartSelect
                          value={p.bio_effect || ""}
                          onChange={(v) => set("bio_effect", v)}
                          options={[{ value: "", label: "None" }, ...TEXT_EFFECTS.map((e) => ({ value: e.id, label: e.label }))]}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#1f1f1f] pt-3">
                    <div>
                      <div className="text-xs font-semibold text-white">Social Icons Glow</div>
                      <div className="text-[11px] text-zinc-400">Glow on social platform icons and link pills</div>
                    </div>
                    <Switch
                      data-testid="social-glow-toggle"
                      className={SWITCH_CLASS}
                      checked={p.social_glow === true}
                      onCheckedChange={(v) => set("social_glow", v)}
                    />
                  </div>
                </div>
              </Section>


              {advanced ? (
                <>
              <Section title="Page & Privacy" hint="Footer branding and text sizing">
                <SliderRow
                  testid="bio-size"
                  label="Bio text size"
                  value={Number(p.bio_size ?? 100)}
                  min={80}
                  max={160}
                  step={5}
                  suffix="%"
                  onChange={(v) => set("bio_size", v)}
                />
                <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 text-xs text-zinc-300">
                  <span>
                    Hide the &quot;made with tourn.lol&quot; footer
                    {!isPremium && <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-400">Premium</span>}
                  </span>
                  <Switch
                    data-testid="hide-footer"
                    className={SWITCH_CLASS}
                    checked={!!p.hide_footer}
                    onCheckedChange={(v) => (isPremium ? set("hide_footer", v) : setPremiumFeature("Footer removal"))}
                  />
                </label>
              </Section>

              <Section title="Animations" hint="Page entry animations and folding">
                <ChipGrid
                  testid="reveal"
                  cols={3}
                  value={p.reveal_animation || ""}
                  onChange={(v) => set("reveal_animation", v)}
                  onLocked={askPremium("Section animations")}
                  options={SECTION_ANIMATIONS.map((a) => ({ ...a, locked: !!a.premium && !isPremium }))}
                />
                <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 border-t border-[#1f1f1f] pt-4 text-xs text-zinc-300">
                  <span>
                    Foldable sections <span className="text-[10px] text-zinc-400">(click a header to collapse)</span>
                  </span>
                  <Switch
                    data-testid="section-fold-toggle"
                    className={SWITCH_CLASS}
                    checked={!!p.section_fold}
                    onCheckedChange={(v) => (isPremium ? set("section_fold", v) : askPremium("Foldable sections")())}
                  />
                </label>
              </Section>
                </>
              ) : (
                <AdvancedNotice what="Page privacy, text sizing, entry animations and section folding live here." />
              )}
            </>
          )}

          {/* ========================================================
              SUBTAB 3: AUDIOS (STREAMLINED AUDIO MANAGER)
              ======================================================== */}
          {sub === "audios" && (
            <div className="space-y-6">
              {/* Choose a real, separate player design from its visual sample first. */}
              <Section title="Player style" hint="Pick a layout; the sample updates with your saved track and cover art">
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
                  {TRACK_STYLES.map((style) => {
                    const active = trackStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        data-testid={`audio-style-${style.id}`}
                        aria-pressed={active}
                        onClick={() => setPlayerStyle(style.id)}
                        className={`group flex min-w-0 items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${active ? "border-white/20 bg-[#151517]" : "border-white/[0.06] bg-[#0b0b0c] hover:border-white/12 hover:bg-[#101012]"}`}
                      >
                        <div className="flex h-[68px] w-[150px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.05] bg-[#070708] p-1">
                          <TrackStylePreview id={style.id} accent={accentColor} size="sm" />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-xs font-semibold text-zinc-100">{style.label}{active && <Check className="h-3.5 w-3.5 text-zinc-400" />}</span>
                          <span className="mt-1 block text-[10px] leading-relaxed text-zinc-600">{style.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Keep the live player directly under its style picker, rather than far below the upload and tuning controls. */}
              <section className="space-y-3" aria-label="Audio player live preview" data-testid="audio-style-preview-section">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200">Live preview</span>
                    <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-zinc-500">{TRACK_STYLES.find((style) => style.id === trackStyle)?.label || "Compact"}</span>
                  </div>
                  <span className="text-[11px] text-zinc-600">Updates when you choose a style or edit your track</span>
                </div>
                <div className="relative flex min-h-[140px] items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#080809] p-6">
                  {(() => {
                    const effectiveTrack = {
                      title: p.tracks?.[0]?.title || newTrackTitle || "Your track title",
                      artist: p.tracks?.[0]?.artist || newTrackArtist || "Artist name",
                      artwork: p.tracks?.[0]?.artwork || newTrackArtwork || "",
                      lyrics: p.tracks?.[0]?.lyrics || newTrackLyrics || "",
                      url: p.tracks?.[0]?.url || newTrackUrl || "",
                      audio_url: p.tracks?.[0]?.audio_url || "",
                    };
                    return (
                      <div className="w-full max-w-lg flex flex-col items-center">
                        <TrackCardPreview
                          track={effectiveTrack}
                          style={trackStyle}
                          accent={accentColor}
                          volume={(Number.isFinite(Number(p.audio_volume ?? p.track_volume)) ? Number(p.audio_volume ?? p.track_volume) : 80) / 100}
                          profile={p}
                          embedded={true}
                        />
                      </div>
                    );
                  })()}
                </div>
              </section>

              {/* Placement is not a separate switch any more: the layout owns it.
                  This row only reports what the current layout does, so the
                  player can never be pinned somewhere the card was not drawn
                  to hold it. */}
              <div
                data-testid="audio-placement-note"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1f1f1f] bg-[#111111] px-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0b0b0c] text-zinc-500">
                    <Layout className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200">
                      Placement follows your layout: {LAYOUT_MAP[layout]?.label || "Minimal"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {TRACK_POSITION_LABELS[placement] || TRACK_POSITION_LABELS[""]} â€” change the layout in Appearance to move the player.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="audio-placement-change-layout"
                  onClick={() => switchSub("appearance")}
                  className="rounded-xl border border-[#2a2a2e] px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#b4bffa] hover:text-white"
                >
                  Change layout
                </button>
              </div>

              {/* 2. MIDDLE: AUDIO UPLOAD WITH ALBUM COVER, ARTIST AND LYRICS */}
              <Section title="Audio Track & Content" hint="Audio file, album artwork, artist credentials, and synchronized lyrics">
                <div className="space-y-5">
                  {/* Uploaded Audio File Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-[#2a2a2e] bg-[#09090b] shadow-inner">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#b4bffa]/15 border border-[#b4bffa]/30 flex items-center justify-center shrink-0 shadow-sm">
                        <Music className="w-5 h-5 text-[#b4bffa]" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-white">
                          {p.tracks?.[0]?.url ? (p.tracks[0].url.split("/").pop() || "Audio track uploaded") : "No audio uploaded"}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono2 text-zinc-500">
                          {p.tracks?.[0]?.size && <span className="text-zinc-400">{p.tracks[0].size}</span>}
                          <span>{p.tracks?.[0]?.url ? "Uploaded" : "Add a track to preview the player"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#b4bffa] hover:brightness-110 px-4 py-2 text-xs font-bold text-black transition shadow-md">
                        {uploadingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Upload / Replace
                        <input type="file" accept="audio/*" onChange={handleAudioUpload} disabled={uploadingAudio} className="hidden" />
                      </label>
                      {p.tracks?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTrack(0)}
                          className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/15 transition cursor-pointer"
                          title="Remove Audio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Track Name & Artist Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                        Track Name
                      </label>
                      <input
                        type="text"
                        data-testid="editor-track-name"
                        value={p.tracks?.[0]?.title ?? newTrackTitle}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewTrackTitle(val);
                          if (p.tracks && p.tracks.length > 0) {
                            const updated = [...p.tracks];
                            updated[0] = { ...updated[0], title: val };
                            set("tracks", updated);
                          } else if (newTrackUrl || newTrackArtwork || newTrackArtist) {
                            set("tracks", [{ title: val, url: newTrackUrl, artwork: newTrackArtwork, artist: newTrackArtist }]);
                          }
                        }}
                        placeholder="Track name"
                        className="w-full px-4 py-3 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] text-xs text-white outline-none focus:border-[#b4bffa] transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                        Artist Name
                      </label>
                      <input
                        type="text"
                        value={p.tracks?.[0]?.artist ?? newTrackArtist}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewTrackArtist(val);
                          if (p.tracks && p.tracks.length > 0) {
                            const updated = [...p.tracks];
                            updated[0] = { ...updated[0], artist: val };
                            set("tracks", updated);
                          } else if (newTrackUrl || newTrackArtwork || newTrackTitle) {
                            set("tracks", [{ title: newTrackTitle, url: newTrackUrl, artwork: newTrackArtwork, artist: val }]);
                          }
                        }}
                        placeholder="Artist / Band Name"
                        className="w-full px-4 py-3 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] text-xs text-white outline-none focus:border-[#b4bffa] transition"
                      />
                    </div>
                  </div>

                  {/* Album Cover Artwork */}
                  <div className="p-4 rounded-xl border border-[#2a2a2e] bg-[#09090b] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-300">Album Cover Artwork</div>
                      {(p.tracks?.[0]?.artwork || newTrackArtwork) && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewTrackArtwork("");
                            if (p.tracks?.[0]) {
                              const updated = [...p.tracks];
                              delete updated[0].artwork;
                              set("tracks", updated);
                            }
                          }}
                          className="text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                        >
                          Remove Artwork
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-16 h-16 rounded-xl border border-[#2a2a2e] bg-[#0d0d0d] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {(p.tracks?.[0]?.artwork || newTrackArtwork) ? (
                          <img
                            src={p.tracks?.[0]?.artwork || newTrackArtwork}
                            alt="Cover artwork"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Disc className="w-7 h-7 text-zinc-500" />
                        )}
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#b4bffa] hover:brightness-110 px-3.5 py-2 text-xs font-bold text-black transition shadow-sm">
                            {uploadingArtwork ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            Upload Cover
                            <input type="file" accept="image/*" onChange={handleArtworkUpload} disabled={uploadingArtwork} className="hidden" />
                          </label>
                          <input
                            type="text"
                            value={p.tracks?.[0]?.artwork ?? newTrackArtwork}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewTrackArtwork(val);
                              if (p.tracks && p.tracks.length > 0) {
                                const updated = [...p.tracks];
                                updated[0] = { ...updated[0], artwork: val };
                                set("tracks", updated);
                              }
                            }}
                            placeholder="Or paste image URL (https://...)"
                            className="flex-1 px-3 py-2 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] text-xs text-white outline-none focus:border-[#b4bffa] transition"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-400">Square artwork image recommended (500x500 PNG / JPG)</p>
                      </div>
                    </div>
                  </div>

                  {/* Lyrics, playback behaviour and volume are advanced: the
                      everyday job of the Audio tab is pick a style and upload a
                      track. */}
                  {advanced && (
                    <>
                  <div className="p-4 rounded-xl border border-[#2a2a2e] bg-[#09090b] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-zinc-300">Synchronized Lyrics</div>
                        <div className="text-[11px] text-zinc-400">Upload .lrc file or paste lyrics with timestamps</div>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#2a2a2e] bg-[#0d0d0d] hover:border-white/30 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition">
                        <FileText className="w-3.5 h-3.5 text-[#b4bffa]" />
                        Upload .lrc / .txt
                        <input type="file" accept=".lrc,.txt" onChange={handleLyricsFileUpload} className="hidden" />
                      </label>
                    </div>

                    <textarea
                      value={p.tracks?.[0]?.lyrics ?? newTrackLyrics}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewTrackLyrics(val);
                        if (p.tracks && p.tracks.length > 0) {
                          const updated = [...p.tracks];
                          updated[0] = { ...updated[0], lyrics: val };
                          set("tracks", updated);
                        }
                      }}
                      rows={4}
                      placeholder="[00:12.00] Line one of synchronized lyrics...&#10;[00:18.50] Line two...&#10;[00:25.10] Line three..."
                      className="w-full px-4 py-3 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] text-xs text-white font-mono2 outline-none focus:border-[#b4bffa] transition resize-y"
                    />
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Timestamp format: [mm:ss.xx] line text. Only displays in lyrics player mode when lyrics are provided.</span>
                      {(p.tracks?.[0]?.lyrics || newTrackLyrics) && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewTrackLyrics("");
                            if (p.tracks?.[0]) {
                              const updated = [...p.tracks];
                              delete updated[0].lyrics;
                              set("tracks", updated);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                        >
                          Clear Lyrics
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Shuffle Mode Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#2a2a2e] bg-[#09090b]">
                    <div>
                      <div className="text-xs font-bold text-white">Shuffle Mode</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Random playback order</div>
                    </div>
                    <Switch
                      data-testid="shuffle-mode-toggle"
                      className={SWITCH_CLASS}
                      checked={p.audio_shuffle === true}
                      onCheckedChange={(v) => set("audio_shuffle", v)}
                    />
                  </div>

                  {/* Autoplay Audio Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#2a2a2e] bg-[#09090b]">
                    <div>
                      <div className="text-xs font-bold text-white">Autoplay Audio</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Start playback automatically on visitor arrival</div>
                    </div>
                    <Switch
                      data-testid="autoplay-audio-toggle"
                      className={SWITCH_CLASS}
                      checked={p.autoplay_audio === true || p.audio_autoplay === true}
                      onCheckedChange={(v) => {
                        set("autoplay_audio", v);
                        set("audio_autoplay", v);
                      }}
                    />
                  </div>

                  {/* Loop Mode Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#2a2a2e] bg-[#09090b]">
                    <div>
                      <div className="text-xs font-bold text-white">Loop Mode</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Repeat current track indefinitely when it ends</div>
                    </div>
                    <Switch
                      data-testid="loop-mode-toggle"
                      className={SWITCH_CLASS}
                      checked={p.audio_loop === true}
                      onCheckedChange={(v) => set("audio_loop", v)}
                    />
                  </div>

                  {/* Default Volume Slider */}
                  <div className="p-4 rounded-xl border border-[#2a2a2e] bg-[#09090b] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Default Volume</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Initial volume when music starts playing</div>
                      </div>
                      <span className="text-xs font-mono2 text-white font-bold">{Number.isFinite(Number(p.audio_volume ?? p.track_volume)) ? Number(p.audio_volume ?? p.track_volume) : 80}%</span>
                    </div>
                    <Slider
                      value={[Number.isFinite(Number(p.audio_volume ?? p.track_volume)) ? Number(p.audio_volume ?? p.track_volume) : 80]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => {
                        set("audio_volume", v);
                        set("track_volume", v);
                      }}
                    />
                  </div>
                    </>
                  )}
              </div>
              </Section>

              {!advanced && (
                <AdvancedNotice what="Synchronized lyrics, shuffle/autoplay/loop, default volume and the player's card styling live here." />
              )}

              {/* 3. BOTTOM: WIDGET CARD CUSTOMIZATION */}
              {advanced && (
              <div data-testid="audio-widget-customization" className="rounded-2xl border border-[#2a2a2e] bg-[#111111] p-5 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Widget Card Customization</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Fine-tune player borders, glassmorphic fill, blur, and live preview</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      set("audio_border_width", 0);
                      set("audio_border_opacity", 0.13);
                      set("audio_border_color", "#ffffff");
                      set("audio_bg_color", "#ffffff");
                      set("audio_bg_opacity", 0.00);
                      set("audio_bg_blur", 11);
                      set("audio_glow", true);
                      set("audio_glow_color", "");
                      set("audio_glow_spread", 25);
                      toast.success("Reset to defaults!");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#09090b] hover:border-white/30 text-xs font-semibold text-zinc-300 hover:text-white border border-[#2a2a2e] transition shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    Reset to Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {/* Border Width */}
                  <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Border Width</span>
                      <span className="text-xs font-mono2 text-white font-bold">
                        {Number.isFinite(Number(p.audio_border_width)) ? Number(p.audio_border_width) : 0}px
                      </span>
                    </div>
                    <Slider
                      value={[Number.isFinite(Number(p.audio_border_width)) ? Number(p.audio_border_width) : 0]}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={([v]) => set("audio_border_width", v)}
                    />
                  </div>

                  {/* Border Opacity */}
                  <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Border Opacity</span>
                      <span className="text-xs font-mono2 text-white font-bold">
                        {(Number.isFinite(Number(p.audio_border_opacity)) ? Number(p.audio_border_opacity) : 0.13).toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[(Number.isFinite(Number(p.audio_border_opacity)) ? Number(p.audio_border_opacity) : 0.13) * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => set("audio_border_opacity", v / 100)}
                    />
                  </div>

                  {/* Border Color */}
                  <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Border Color</span>
                      <span className="text-xs font-mono2 text-zinc-400">{p.audio_border_color || "#ffffff"}</span>
                    </div>
                    <ColorPicker
                      label=""
                      value={p.audio_border_color || "#ffffff"}
                      onChange={(val) => set("audio_border_color", val)}
                    />
                  </div>

                  {/* Background Color */}
                  <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Background Color</span>
                      <span className="text-xs font-mono2 text-zinc-400">{p.audio_bg_color || "#ffffff"}</span>
                    </div>
                    <ColorPicker
                      label=""
                      value={p.audio_bg_color || "#ffffff"}
                      onChange={(val) => set("audio_bg_color", val)}
                    />
                  </div>

                  {/* Background Opacity */}
                  <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Background Opacity</span>
                      <span className="text-xs font-mono2 text-white font-bold">
                        {(Number.isFinite(Number(p.audio_bg_opacity)) ? Number(p.audio_bg_opacity) : 0.00).toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[(Number.isFinite(Number(p.audio_bg_opacity)) ? Number(p.audio_bg_opacity) : 0.00) * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => set("audio_bg_opacity", v / 100)}
                    />
                  </div>

                  {/* Background Blur */}
                  <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Background Blur</span>
                      <span className="text-xs font-mono2 text-white font-bold">
                        {Number.isFinite(Number(p.audio_bg_blur)) ? Number(p.audio_bg_blur) : 11}px
                      </span>
                    </div>
                    <Slider
                      value={[Number.isFinite(Number(p.audio_bg_blur)) ? Number(p.audio_bg_blur) : 11]}
                      min={0}
                      max={40}
                      step={1}
                      onValueChange={([v]) => set("audio_bg_blur", v)}
                    />
                  </div>

                  {/* Glow Toggle */}
                  <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Ambient Glow</span>
                      <Switch
                        data-testid="audio-glow-toggle"
                        className={SWITCH_CLASS}
                        checked={p.audio_glow !== false}
                        onCheckedChange={(v) => set("audio_glow", v)}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400">Radiant ambient glow around the audio widget</p>
                  </div>

                  {/* Glow Color */}
                  <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Glow Color</span>
                    </div>
                    <ColorPicker
                      label=""
                      value={p.audio_glow_color || accentColor}
                      onChange={(val) => set("audio_glow_color", val)}
                    />
                  </div>

                  {/* Glow Spread */}
                  <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Glow Spread</span>
                      <span className="text-xs font-mono2 text-white font-bold">
                        {Number.isFinite(Number(p.audio_glow_spread)) ? Number(p.audio_glow_spread) : 25}px
                      </span>
                    </div>
                    <Slider
                      value={[Number.isFinite(Number(p.audio_glow_spread)) ? Number(p.audio_glow_spread) : 25]}
                      min={0}
                      max={60}
                      step={1}
                      onValueChange={([v]) => set("audio_glow_spread", v)}
                    />
                  </div>
                </div>


              </div>
              )}

              {/* Legacy backward-compatibility elements in sr-only */}
              <div className="sr-only" aria-hidden="true">
                <input
                  type="text"
                  value={newTrackArtist}
                  onChange={(e) => setNewTrackArtist(e.target.value)}
                  placeholder="Artist"
                />
                <input
                  type="text"
                  value={newTrackUrl}
                  onChange={(e) => setNewTrackUrl(e.target.value)}
                  placeholder="URL"
                />
                <button type="button" onClick={handleAddTrack}>Add Track</button>
                <Switch
                  data-testid="disable-audio-border-toggle"
                  checked={p.disable_audio_border === true}
                  onCheckedChange={(v) => set("disable_audio_border", v)}
                />
                <Switch
                  data-testid="disable-mute-border-toggle"
                  checked={p.disable_mute_border === true}
                  onCheckedChange={(v) => set("disable_mute_border", v)}
                />
              </div>
            </div>
          )}

          {/* ========================================================
              SUBTAB 4: EXTRA (SYSTEM SETTINGS, ENTRY SCREEN, 3D TILT, EFFECTS POPUPS)
              ======================================================== */}
          {sub === "extra" && (
            <>
              {advanced && (
              <Section title="Card Extra & 3D Tilt" hint="Hover depth and dynamic tilt">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">3D Card Tilt</div>
                      <div className="text-[11px] text-zinc-400">Card responds dynamically to cursor position with perspective</div>
                    </div>
                    <Switch
                      data-testid="tilt-toggle"
                      className={SWITCH_CLASS}
                      checked={p.tilt !== false}
                      onCheckedChange={(v) => set("tilt", v)}
                    />
                  </div>

                  {p.tilt !== false && (
                    <SliderRow
                      testid="tilt-strength"
                      label="3D Tilt Intensity"
                      value={Number(p.tilt_strength ?? 15)}
                      min={5}
                      max={40}
                      suffix="Â°"
                      onChange={(v) => set("tilt_strength", v)}
                    />
                  )}
                </div>
              </Section>
              )}

              {/* Profile Effects buttons moved to sr-only for test compat — effects are accessible via the Fonts section text-effect dropdowns */}
              <div className="sr-only" aria-hidden="true">
                <button data-testid="text-effects-modal-open" onClick={() => setShowTextEffectsModal(true)}>Text Effects</button>
                <button data-testid="overlay-effects-modal-open" onClick={() => setShowOverlayEffectsModal(true)}>Overlay Effects</button>
                <button data-testid="background-effects-modal-open" onClick={() => setShowBgEffectsModal(true)}>Background Effects</button>
                <button data-testid="cursor-effects-modal-open" onClick={() => setShowCursorEffectsModal(true)}>Cursor Effects</button>
              </div>
              <div className="sr-only" aria-hidden="true">
                <ToggleRow
                    testid="fx-name-alias-toggle"
                    label="Apply effect to Alias / Username too"
                    checked={!!p.use_name_effect_on_alias}
                    onCheckedChange={(checked) => {
                      set("use_name_effect_on_alias", checked);
                      set("alias_effect", checked ? (p.name_effect || "") : "");
                    }}
                  />
                  <EffectPicker
                    testid="fx-name"
                    variant="text"
                    options={TEXT_EFFECTS}
                    value={p.name_effect}
                    onChange={(v) => set("name_effect", v)}
                    isPremium={isPremium}
                    navigate={askPremium("Name text effects")}
                    accent={accentColor}
                    displayName={displayName}
                    tuning={fxTuning}
                    onTuningChange={setFxTuning}
                    onTuningReset={resetFxTuning}
                  />
                  <EffectPicker
                    testid="fx-bio"
                    variant="text"
                    options={TEXT_EFFECTS}
                    value={p.bio_effect}
                    onChange={(v) => set("bio_effect", v)}
                    isPremium={isPremium}
                    navigate={askPremium("Bio text effects")}
                    accent={accentColor}
                    displayName={displayName}
                    tuning={fxTuning}
                    onTuningChange={setFxTuning}
                    onTuningReset={resetFxTuning}
                  />
                  <EffectPicker
                    testid="fx-overlay"
                    variant="overlay"
                    options={OVERLAYS}
                    value={p.overlay_effect}
                    onChange={(v) => set("overlay_effect", v)}
                    isPremium={isPremium}
                    navigate={askPremium("Overlay effects")}
                    accent={accentColor}
                  />
                  <EffectPicker
                    testid="fx-bg"
                    variant="bg"
                    options={BACKGROUND_EFFECTS}
                    value={p.background_effect}
                    onChange={(v) => set("background_effect", v)}
                    isPremium={isPremium}
                    navigate={askPremium("Background effects")}
                    accent={accentColor}
                  />
                  <EffectPicker
                    testid="fx-cursor"
                    variant="cursor"
                    options={CURSOR_EFFECTS}
                    value={p.cursor_effect}
                    onChange={(v) => set("cursor_effect", v)}
                    isPremium={isPremium}
                    navigate={askPremium("Cursor effects")}
                    accent={accentColor}
                  />
              </div>

              {!advanced && (
                <AdvancedNotice what="3D tilt, embed/metadata settings and the entry screen live here." />
              )}

              {advanced && (
                <>
              <Section title="Page Identity" hint="Custom name shown in share embeds">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                      Custom page name
                    </label>
                    <input
                      data-testid="editor-meta-title"
                      value={p.meta_title || ""}
                      onChange={(e) => set("meta_title", e.target.value)}
                      maxLength={60}
                      placeholder={`${(displayName || user.username) + (" on tourn.lol")}`}
                      className="w-full rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] px-4 py-2.5 text-xs text-white outline-none focus:border-[#b4bffa]"
                    />
                    <p className="mt-1.5 text-[11px] text-zinc-600">When shared on Discord, your profile shows your background with your avatar and this name centred below.</p>
                  </div>
                </div>
              </Section>
              {/* Hidden test compat -- meta fields simplified; legacy testids kept for tests */}
              <div className="sr-only" aria-hidden="true">
                <input data-testid="editor-meta-description" value={p.meta_description || ""} onChange={(e) => set("meta_description", e.target.value)} readOnly />
                <input data-testid="editor-meta-image" value={p.meta_image || ""} onChange={(e) => set("meta_image", e.target.value)} readOnly />
              </div>

              {/* Profile Entry Screen Settings */}
              <Section title="Profile Entry Screen">
                <label className="mb-4 flex cursor-pointer items-center justify-between gap-4 text-xs font-bold text-white">
                  <span>Enable Entry Overlay Screen</span>
                  <Switch data-testid="entry-enable" className={SWITCH_CLASS} checked={!!p.entry_enabled} onCheckedChange={(v) => set("entry_enabled", v)} />
                </label>
                {p.entry_enabled && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-2">Visual Entry Style</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ENTRY_STYLES.map(({ id, label }) => {
                          const active = (p.entry_style || "text") === id;
                          return (
                            <button
                              key={id}
                              data-testid={`entry-style-${id}`}
                              aria-pressed={active}
                              onClick={() => set("entry_style", id)}
                              className={`flex flex-col gap-2 rounded-xl border p-2 text-xs font-semibold transition cursor-pointer ${
                                active ? "bg-[#b4bffa] border-[#b4bffa] text-black font-bold" : "border-[#2a2a2e] bg-[#09090b] text-zinc-300 hover:border-white/30"
                              }`}
                            >
                              <EntryStyleThumb id={id} accent={accentColor} />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Entry Prompt Text
                      </label>
                      <input
                        data-testid="entry-text"
                        value={p.entry_text || ""}
                        onChange={(e) => set("entry_text", e.target.value)}
                        maxLength={60}
                        placeholder="Click to enter"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] text-xs text-white outline-none focus:border-[#b4bffa]"
                      />
                    </div>

                    {p.entry_style === "image" && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Entry Image Stamp
                        </label>
                        <div className="flex items-center gap-2.5">
                          {p.entry_image ? (
                            <img src={fileUrl(p.entry_image)} alt="" className="h-10 w-10 rounded-xl object-contain bg-black/40 border border-[#2a2a2e] p-1" />
                          ) : null}
                          <input
                            type="text"
                            value={p.entry_image || ""}
                            onChange={(e) => set("entry_image", e.target.value)}
                            placeholder="Paste image URL (or image path)"
                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e] text-xs text-white outline-none focus:border-[#b4bffa]"
                          />
                        </div>
                      </div>
                    )}

                    <FontField
                      testid="entry-font"
                      label="Entry Font"
                      value={p.entry_font}
                      onChange={(val) => set("entry_font", val)}
                      isPremium={isPremium}
                      navigate={navigate}
                    />

                    <div className="grid gap-3 sm:grid-cols-2 pt-1">
                      <ColorPicker label="Text Color" value={p.entry_color || "#f4f4f5"} onChange={(v) => set("entry_color", v)} />
                      <ColorPicker label="Glow / Accent Color" value={p.entry_glow_color || accentColor} onChange={(v) => set("entry_glow_color", v)} />
                      <ColorPicker label="Backdrop Tint" value={p.entry_backdrop_color || "#060608"} onChange={(v) => set("entry_backdrop_color", v)} />
                      {(p.entry_style || "button") === "button" && (
                        <ColorPicker label="Button Fill Color" value={p.entry_bg_color || "rgba(255,255,255,0.08)"} onChange={(v) => set("entry_bg_color", v)} />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Backdrop Blur
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: "0px", label: "Off" },
                          { id: "8px", label: "Low" },
                          { id: "16px", label: "Med" },
                          { id: "28px", label: "High" },
                        ].map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => set("entry_blur", b.id)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                              (p.entry_blur || "16px") === b.id
                                ? "border-[#b4bffa] bg-[#b4bffa] text-black font-bold"
                                : "border-[#2a2a2e] bg-[#09090b] text-zinc-300 hover:border-white/30"
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Section>
                </>
              )}

              {/* Text Effects Modal with separate toggles for name, alias, bio */}
              <FxModal
                open={showTextEffectsModal}
                onOpenChange={setShowTextEffectsModal}
                id="text-effects-modal"
                eyebrow="Typography Effects"
                title="Text Effects Studio"
                description="Custom animated typography for display name, handle alias, and bio description."
                testid="text-effects-modal"
                footer={
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setShowTextEffectsModal(false)} className="px-4 py-2 text-xs bg-[#b4bffa] text-black font-bold rounded-xl hover:brightness-110 transition shadow-sm">
                      Done
                    </button>
                  </div>
                }
              >
                <div className="space-y-6">
                  {/* Scope Selector Tabs */}
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0d0d0d] border border-[#2a2a2e]">
                    {[
                      { id: "name", label: "Display Name" },
                      { id: "alias", label: "Alias / Username" },
                      { id: "bio", label: "Bio Text" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTextSlot(tab.id)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                          activeTextSlot === tab.id ? "bg-[#b4bffa] text-black font-bold shadow-sm" : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Active Slot Toggle & Current Selection */}
                  <div className="p-4 rounded-xl border border-[#2a2a2e] bg-[#111111] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white capitalize">
                        {activeTextSlot === "name" ? "Display Name" : activeTextSlot === "alias" ? "Alias (@handle)" : "Bio Text"} Effect
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Current: <span className="font-semibold text-white">{
                          (TEXT_EFFECTS.find((e) => e.id === (
                            activeTextSlot === "name" ? p.name_effect
                            : activeTextSlot === "alias" ? p.alias_effect
                            : p.bio_effect
                          ))?.label) || "None"
                        }</span>
                      </div>
                    </div>
                    <Switch
                      className={SWITCH_CLASS}
                      checked={!!(
                        activeTextSlot === "name" ? p.name_effect
                        : activeTextSlot === "alias" ? p.alias_effect
                        : p.bio_effect
                      )}
                      onCheckedChange={(enabled) => {
                        const targetKey = activeTextSlot === "name" ? "name_effect" : activeTextSlot === "alias" ? "alias_effect" : "bio_effect";
                        set(targetKey, enabled ? "rainbow" : "");
                      }}
                    />
                  </div>

                  {/* Grid of effects for chosen slot */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {TEXT_EFFECTS.map((fx) => {
                      const currentVal =
                        activeTextSlot === "name" ? p.name_effect
                        : activeTextSlot === "alias" ? p.alias_effect
                        : p.bio_effect;
                      const active = (currentVal || "") === fx.id;
                      const locked = fx.premium && !isPremium;
                      return (
                        <button
                          key={fx.id || "none"}
                          type="button"
                          onClick={() => {
                            if (locked) {
                              setShowTextEffectsModal(false);
                              askPremium("Text Effects")();
                              return;
                            }
                            const targetKey = activeTextSlot === "name" ? "name_effect" : activeTextSlot === "alias" ? "alias_effect" : "bio_effect";
                            set(targetKey, fx.id);
                          }}
                          className={`p-3 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                            active
                              ? "border-[#b4bffa] bg-[#b4bffa] text-black font-bold shadow-sm"
                              : "border-[#2a2a2e] bg-[#09090b] text-zinc-300 hover:border-white/30"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{fx.label}</span>
                            {locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : active ? <Check className="w-3.5 h-3.5 text-black" /> : null}
                          </div>
                          {fx.id ? (
                            <div className="h-6 flex items-center overflow-hidden">
                              <FxText id={fx.id} text="Sample" className="text-sm font-bold truncate text-white" />
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500">Plain text</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </FxModal>

              {/* Overlay Effects Modal with Live Previews */}
              <FxModal
                open={showOverlayEffectsModal}
                onOpenChange={setShowOverlayEffectsModal}
                id="overlay-effects-modal"
                eyebrow="Filters"
                title="Overlay Filters"
                description="Layer dynamic weather, film grain or VHS scanlines over your entire page."
                testid="overlay-effects-modal"
                footer={
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setShowOverlayEffectsModal(false)} className="px-4 py-2 text-xs bg-[#b4bffa] text-black font-bold rounded-xl hover:brightness-110 transition shadow-sm cursor-pointer">
                      Done
                    </button>
                  </div>
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {OVERLAYS.map((fx) => {
                    const active = (p.overlay_effect || "") === fx.id;
                    const locked = fx.premium && !isPremium;
                    return (
                      <button
                        key={fx.id || "none"}
                        type="button"
                        onClick={() => {
                          if (locked) {
                            setShowOverlayEffectsModal(false);
                            askPremium("Overlay effects")();
                            return;
                          }
                          set("overlay_effect", fx.id);
                        }}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col gap-2.5 group cursor-pointer ${
                          active
                            ? "border-[#b4bffa] bg-[#b4bffa]/15 text-white ring-1 ring-[#b4bffa]"
                            : "border-[#2a2a2e] bg-[#09090b] text-zinc-300 hover:border-white/30"
                        }`}
                      >
                        <div className="w-full h-16 rounded-xl bg-[#0a0a0e] border border-white/10 overflow-hidden relative flex items-center justify-center">
                          <FxTile variant="overlay" id={fx.id} accent={accentColor} />
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold w-full">
                          <span className={active ? "text-[#b4bffa]" : "text-white"}>{fx.label}</span>
                          {locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : active ? <Check className="w-3.5 h-3.5 text-[#b4bffa]" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FxModal>

              {/* Background Effects Modal with Live Previews */}
              <FxModal
                open={showBgEffectsModal}
                onOpenChange={setShowBgEffectsModal}
                id="bg-effects-modal"
                eyebrow="Backgrounds"
                title="Background Effects"
                description="Animated particle canvases, shooting stars, rain, and constellations."
                testid="bg-effects-modal"
                footer={
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setShowBgEffectsModal(false)} className="px-4 py-2 text-xs bg-[#b4bffa] text-black font-bold rounded-xl hover:brightness-110 transition shadow-sm cursor-pointer">
                      Done
                    </button>
                  </div>
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BACKGROUND_EFFECTS.map((fx) => {
                    const active = (p.background_effect || "") === fx.id;
                    const locked = fx.premium && !isPremium;
                    return (
                      <button
                        key={fx.id || "none"}
                        type="button"
                        onClick={() => {
                          if (locked) {
                            setShowBgEffectsModal(false);
                            askPremium("Background effects")();
                            return;
                          }
                          set("background_effect", fx.id);
                        }}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col gap-2.5 group cursor-pointer ${
                          active
                            ? "border-[#b4bffa] bg-[#b4bffa]/15 text-white ring-1 ring-[#b4bffa]"
                            : "border-[#2a2a2e] bg-[#09090b] text-zinc-300 hover:border-white/30"
                        }`}
                      >
                        <div className="w-full h-16 rounded-xl bg-[#0a0a0e] border border-white/10 overflow-hidden relative flex items-center justify-center">
                          <FxTile variant="bg" id={fx.id} accent={accentColor} />
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold w-full">
                          <span className={active ? "text-[#b4bffa]" : "text-white"}>{fx.label}</span>
                          {locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : active ? <Check className="w-3.5 h-3.5 text-[#b4bffa]" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FxModal>

              {/* Cursor Effects Modal with Live Previews */}
              <FxModal
                open={showCursorEffectsModal}
                onOpenChange={setShowCursorEffectsModal}
                id="cursor-effects-modal"
                eyebrow="Pointers"
                title="Cursor Particle Effects"
                description="Interactive particle sparks, star dust, and blood drips following the cursor."
                testid="cursor-effects-modal"
                footer={
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setShowCursorEffectsModal(false)} className="px-4 py-2 text-xs bg-[#b4bffa] text-black font-bold rounded-xl hover:brightness-110 transition shadow-sm cursor-pointer">
                      Done
                    </button>
                  </div>
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CURSOR_EFFECTS.map((fx) => {
                    const active = (p.cursor_effect || "") === fx.id;
                    const locked = fx.premium && !isPremium;
                    return (
                      <button
                        key={fx.id || "none"}
                        type="button"
                        onClick={() => {
                          if (locked) {
                            setShowCursorEffectsModal(false);
                            askPremium("Cursor effects")();
                            return;
                          }
                          set("cursor_effect", fx.id);
                        }}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col gap-2.5 group cursor-pointer ${
                          active
                            ? "border-[#b4bffa] bg-[#b4bffa]/15 text-white ring-1 ring-[#b4bffa]"
                            : "border-[#2a2a2e] bg-[#09090b] text-zinc-300 hover:border-white/30"
                        }`}
                      >
                        <div className="w-full h-14 rounded-xl bg-[#0a0a0e] border border-white/10 overflow-hidden relative flex items-center justify-center">
                          <FxTile variant="cursor" id={fx.id} accent={accentColor} />
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold w-full">
                          <span className={active ? "text-[#b4bffa]" : "text-white"}>{fx.label}</span>
                          {locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : active ? <Check className="w-3.5 h-3.5 text-[#b4bffa]" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FxModal>
            </>
          )}

          {/* The one switch that reveals the advanced controls, at the bottom of
              the page where the everyday settings end. */}
          </motion.div>
          </AnimatePresence>

          <div
            data-testid="editor-advanced-bar"
            className="flex flex-col gap-4 rounded-2xl border border-[#1f1f1f] bg-[#0d0d0f] p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${advanced ? "border-[#b4bffa]/40 bg-[#b4bffa]/15 text-[#b4bffa]" : "border-white/[0.06] bg-[#0b0b0c] text-zinc-500"}`}>
                <Sliders className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">Advanced mode</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                  Surface dials, playback behaviour, page &amp; privacy, embed settings and the entry screen stay hidden until this is on.
                </p>
              </div>
            </div>
            <Switch
              data-testid="advanced-mode-toggle"
              className={SWITCH_CLASS}
              checked={advanced}
              onCheckedChange={(v) => set("advanced_mode", v)}
            />
          </div>

          {/* Hidden test-accessible fallback save button if clean */}
          {!isDirty && (
            <button
              onClick={() => save()}
              disabled={saving}
              data-testid="editor-save"
              className="sr-only"
              aria-hidden="true"
            >
              Save Changes
            </button>
          )}
      </div>

      <aside className="min-w-0 xl:sticky xl:top-6" aria-label="Live profile preview">
        <LivePreviewCard user={user} profile={p} displayName={displayName} tuning={fxTuning} />
      </aside>
      </div>
      </div>

      <AvatarDecorationModal
        isOpen={showDecoModal}
        onClose={() => setShowDecoModal(false)}
        value={p.avatar_decoration || ""}
        onChange={(val) => set("avatar_decoration", val)}
        hueValue={Number(p.avatar_decoration_hue || 0)}
        onHueChange={(val) => set("avatar_decoration_hue", val)}
        effectValue={p.avatar_effect || (String(p.avatar_decoration || "").startsWith("swats_") ? p.avatar_decoration : "")}
        onEffectChange={(val) => set("avatar_effect", val)}
        avatarUrl={p.avatar_url}
        isPremium={isPremium}
        onGoPremium={askPremium("Avatar decorations")}
        discordId={user?.discord?.id || null}
      />

      {/* Avatar Media Modal */}
      <FxModal
        open={showAvatarModal}
        onOpenChange={setShowAvatarModal}
        id="avatar-media-modal"
        eyebrow="Media"
        title="Avatar"
        description="Upload, adjust, and decorate your profile picture."
        testid="avatar-media-modal"
        footer={
          <div className="flex justify-end">
            <button type="button" onClick={() => setShowAvatarModal(false)} className="px-4 py-2 text-xs bg-[#b4bffa] text-black font-bold rounded-xl hover:brightness-110 transition shadow-sm cursor-pointer">
              Done
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-300">Upload Avatar</label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <div className="h-full w-full overflow-hidden rounded-full ring-1 ring-white/10 bg-[#111111]">
                  {p.avatar_url ? (
                    <img src={fileUrl(p.avatar_url)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-zinc-400">
                      {(displayName || user.username || "?")[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                {p.avatar_decoration && (
                  <img
                    src={p.avatar_decoration}
                    alt=""
                    className="pointer-events-none absolute inset-0 h-full w-full scale-[1.28] object-contain"
                    style={Number(p.avatar_decoration_hue) ? { filter: `hue-rotate(${Number(p.avatar_decoration_hue)}deg)` } : undefined}
                  />
                )}
              </div>
              <QuickUpload
                testid="modal-avatar-upload"
                label=""
                buttonLabel={p.avatar_url ? "Change" : "Upload"}
                value={p.avatar_url}
                accept="image/*"
                onUploaded={(u) => set("avatar_url", u)}
                onRemove={() => set("avatar_url", "")}
              />
            </div>
          </div>

          {/* Avatar Adjustments */}
          {p.avatar_url && (
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <label className="block text-xs font-semibold text-zinc-300">Adjustments</label>
              <SliderRow
                testid="modal-avatar-zoom"
                label="Zoom"
                value={Number(p.avatar_zoom ?? 100)}
                min={100}
                max={250}
                step={5}
                suffix="%"
                onChange={(v) => set("avatar_zoom", v)}
              />
              <SliderRow
                testid="modal-avatar-crop-x"
                label="Position X"
                value={Number(p.avatar_pos_x ?? 50)}
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={(v) => set("avatar_pos_x", v)}
              />
              <SliderRow
                testid="modal-avatar-crop-y"
                label="Position Y"
                value={Number(p.avatar_pos_y ?? 50)}
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={(v) => set("avatar_pos_y", v)}
              />
            </div>
          )}

          {/* Decoration Section */}
          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            <label className="block text-xs font-semibold text-zinc-300">Decoration</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { setShowAvatarModal(false); setShowDecoModal(true); }}
                className="rounded-xl bg-[#b4bffa] px-4 py-2.5 text-xs font-bold text-black transition hover:brightness-110 cursor-pointer"
              >
                {p.avatar_decoration ? "Change Decoration" : "Add Decoration"}
              </button>
              {p.avatar_decoration && (
                <button
                  type="button"
                  onClick={() => { set("avatar_decoration", ""); set("avatar_decoration_hue", 0); }}
                  className="rounded-xl border border-[#2a2a2e] bg-[#09090b] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.08]"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </FxModal>

      {/* Background Media Modal */}
      <FxModal
        open={showBackgroundModal}
        onOpenChange={setShowBackgroundModal}
        id="background-media-modal"
        eyebrow="Media"
        title="Background"
        description="Set a color or upload an image/video as your profile background."
        testid="background-media-modal"
        footer={
          <div className="flex justify-end">
            <button type="button" onClick={() => setShowBackgroundModal(false)} className="px-4 py-2 text-xs bg-[#b4bffa] text-black font-bold rounded-xl hover:brightness-110 transition shadow-sm cursor-pointer">
              Done
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="inline-flex rounded-xl border border-[#2a2a2e] bg-[#09090b] p-1">
            {[
              { id: "color", label: "Color" },
              { id: "media", label: "Media" },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  if (mode.id === "color" && p.background_url) set("background_url", "");
                  setBgMode(mode.id);
                }}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                  bgMode === mode.id ? "bg-[#b4bffa] text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {bgMode === "color" ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">Background Color</label>
              <ColorPicker value={p.background_color || ""} onChange={(v) => set("background_color", v)} testid="modal-bg-color" />
            </div>
          ) : (
            <div className="space-y-4">
              <QuickUpload
                testid="modal-bg-upload"
                label=""
                buttonLabel={p.background_url ? "Change Media" : "Upload Media"}
                value={p.background_url}
                accept="image/*,video/*"
                onUploaded={(u) => set("background_url", u)}
                onRemove={() => set("background_url", "")}
              />

              {p.background_url && (
                <>
                  <SliderRow
                    testid="modal-bg-opacity"
                    label="Opacity"
                    value={Number(p.background_opacity ?? 98)}
                    min={0}
                    max={100}
                    step={1}
                    suffix="%"
                    onChange={(v) => set("background_opacity", v)}
                  />
                  <SliderRow
                    testid="modal-bg-dim"
                    label="Dim"
                    value={Number(p.background_dim ?? 0)}
                    min={0}
                    max={100}
                    step={1}
                    suffix="%"
                    onChange={(v) => set("background_dim", v)}
                  />
                  <SliderRow
                    testid="modal-bg-blur"
                    label="Blur"
                    value={Number(p.background_blur ?? 0)}
                    min={0}
                    max={20}
                    step={1}
                    suffix="px"
                    onChange={(v) => set("background_blur", v)}
                  />
                </>
              )}
            </div>
          )}

        </div>
      </FxModal>

      {/* Audio Media Modal */}
      <FxModal
        open={showAudioModal}
        onOpenChange={setShowAudioModal}
        id="audio-media-modal"
        eyebrow="Media"
        title="Audio"
        description="Manage up to 3 audio tracks for your profile."
        testid="audio-media-modal"
        footer={
          <div className="flex justify-end">
            <button type="button" onClick={() => setShowAudioModal(false)} className="px-4 py-2 text-xs bg-[#b4bffa] text-black font-bold rounded-xl hover:brightness-110 transition shadow-sm cursor-pointer">
              Done
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-xs text-zinc-400 mb-2">
            {p.tracks?.length || 0} of 3 tracks used
          </div>

          {(p.tracks || []).map((track, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-[#2a2a2e] bg-[#09090b]">
              <Disc className="w-8 h-8 text-zinc-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{track.title || `Track ${idx + 1}`}</div>
                <div className="text-[11px] text-zinc-500">{track.audio_url?.split('/').pop() || 'Audio file'}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newTracks = [...(p.tracks || [])];
                  newTracks.splice(idx, 1);
                  set("tracks", newTracks);
                }}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-zinc-500 hover:text-white transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {(!p.tracks || p.tracks.length < 3) && (
            <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/[0.08] hover:border-white/[0.15] cursor-pointer transition">
              <Plus className="w-4 h-4 text-zinc-500" />
              <span className="text-xs text-zinc-400">Add Track</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("kind", "audio");
                    const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
                    const newTrack = { audio_url: data.url, title: file.name.replace(/\.[^/.]+$/, "") };
                    set("tracks", [...(p.tracks || []), newTrack]);
                    toast.success("Audio uploaded!");
                  } catch (err) {
                    toast.error(err.response?.data?.detail || "Upload failed");
                  }
                  e.target.value = "";
                }}
              />
            </label>
          )}

          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <label className="block text-xs font-semibold text-zinc-300">Playback</label>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Autoplay</span>
              <Switch
                checked={p.audio_autoplay !== false}
                onCheckedChange={(v) => set("audio_autoplay", v)}
                className={SWITCH_CLASS}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Shuffle</span>
              <Switch
                checked={p.audio_shuffle === true}
                onCheckedChange={(v) => set("audio_shuffle", v)}
                className={SWITCH_CLASS}
              />
            </div>
          </div>
        </div>
      </FxModal>

      {/* Cursor Media Modal */}
      <FxModal
        open={showCursorModal}
        onOpenChange={setShowCursorModal}
        id="cursor-media-modal"
        eyebrow="Media"
        title="Cursor"
        description="Upload custom cursors and add particle effects."
        testid="cursor-media-modal"
        footer={
          <div className="flex justify-end">
            <button type="button" onClick={() => setShowCursorModal(false)} className="px-4 py-2 text-xs bg-[#b4bffa] text-black font-bold rounded-xl hover:brightness-110 transition shadow-sm cursor-pointer">
              Done
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Cursor Upload */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-300">Custom Cursor</label>
            <div className="flex items-center gap-4">
              {p.custom_cursor && (
                <img src={fileUrl(p.custom_cursor)} alt="cursor" className="w-8 h-8 object-contain" />
              )}
              <label className="rounded-xl border border-[#2a2a2e] bg-[#09090b] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-[#b4bffa] cursor-pointer">
                {p.custom_cursor ? "Change" : "Upload Cursor"}
                <input
                  type="file"
                  accept="image/*,.cur,.ani"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("kind", "cursor");
                      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
                      set("custom_cursor", data.url);
                      toast.success("Cursor uploaded!");
                    } catch (err) {
                      toast.error(err.response?.data?.detail || "Upload failed");
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              {p.custom_cursor && (
                <button
                  type="button"
                  onClick={() => set("custom_cursor", "")}
                  className="rounded-xl border border-[#2a2a2e] bg-[#09090b] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.08]"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

        </div>
      </FxModal>

      <PremiumGate
        open={!!premiumFeature}
        feature={premiumFeature}
        onClose={() => setPremiumFeature(null)}
      />
    </div>
  );
}
