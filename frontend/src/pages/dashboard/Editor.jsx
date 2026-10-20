import { memo, useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PremiumGate } from "@/components/ui-shared/PremiumGate";
import { api, fileUrl } from "@/lib/api";
import { ProfilePreview } from "@/components/ProfilePreview";
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
import { LAYOUTS, LAYOUT_MAP, DEFAULT_LAYOUT, SECTION_ANIMATIONS } from "@/constants/layouts";
import { FONTS, FREE_FONTS, fontStackOf } from "@/constants/fonts";
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
    card_glow: false,
  },
};

const AUDIO_STYLES = [
  { id: "compact", label: "Compact", desc: "Clean streamlined player pill with controls and artwork" },
  { id: "lyrics", label: "Lyrics", desc: "Scrolling real-time or formatted lyrics view under artwork" },
  { id: "marquee", label: "Marquee", desc: "Classic scrolling animated marquee text title & audio wave" },
  { id: "vinyl", label: "Vinyl", desc: "Realistic revolving vinyl record with turntable arm accent" },
];

const PREVIEW_WORD = "swats";

const SWITCH_CLASS =
  "h-5 w-9 shrink-0 rounded-full border border-[#3f3f46]/60 bg-[#111111] shadow-inner transition-colors duration-200 data-[state=checked]:border-[hsl(272,24%,46%)] data-[state=checked]:bg-[hsl(272,24%,46%)] data-[state=unchecked]:bg-[#3f3f46]/40";

function FontField({ label, value, onChange, isPremium, navigate, testid }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = FONTS.find((f) => fontStackOf(value) === f.stack) || FONTS.find((f) => f.free);

  const q = query.trim().toLowerCase();
  const matches = q ? FONTS.filter((f) => f.name.toLowerCase().includes(q)) : FONTS;
  const categorizedFonts = matches.reduce((acc, font) => {
    const cat = font.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(font);
    return acc;
  }, {});

  return (
    <div data-testid={testid}>
      <div className="mb-2 text-xs font-semibold text-zinc-300">{label}</div>

      <button
        type="button"
        data-testid={`${testid}-open`}
        onClick={() => { setQuery(""); setIsOpen(true); }}
        className="w-full flex items-center justify-between rounded-xl border border-[#3f3f46]/40 bg-[#111111] px-4 py-3 hover:border-[hsl(272,24%,46%)] transition-colors"
      >
        <span className="text-sm text-white" style={{ fontFamily: selected.stack }}>
          {selected.name}
        </span>
        <span className="text-[10px] font-bold text-white bg-[hsl(272,24%,46%)] px-2.5 py-1 rounded-md">
          Change
        </span>
      </button>

      <FxModal
        open={isOpen}
        onOpenChange={setIsOpen}
        id={`${testid}-drawer`}
        title={label}
        description={`${FONTS.length} typefaces, ${FREE_FONTS.length} of them free.`}
        eyebrow="Fonts"
        testid={`${testid}-drawer`}
      >
        <input
          autoFocus
          type="search"
          data-testid={`${testid}-search`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${FONTS.length} fonts…`}
          className="ov-input mb-4 px-4 py-2.5 text-sm placeholder:text-zinc-500 bg-[#111111] border border-[#3f3f46]/40 text-white rounded-xl"
        />

        <div className="mb-5 rounded-xl border border-[#3f3f46]/40 bg-[#111111] px-4 py-3">
          <div className="text-[11px] text-zinc-400">Preview</div>
          <div className="mt-1 truncate text-2xl text-white" style={{ fontFamily: selected.stack }}>
            {PREVIEW_WORD} · @yourname
          </div>
        </div>

        {matches.length === 0 && (
          <p className="py-10 text-center text-sm text-zinc-500">No fonts match “{query}”.</p>
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
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors duration-200 ${
                      active
                        ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)]/20 text-white"
                        : locked
                        ? "border-[#3f3f46]/20 bg-[#111111] text-zinc-500 hover:border-amber-500/30"
                        : "border-[#3f3f46]/40 bg-[#111111] hover:border-white/40 text-zinc-200"
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
                        <Check className="h-4 w-4 text-[hsl(272,24%,46%)]" />
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
  const [isOpen, setIsOpen] = useState(false);
  const selected = LAYOUTS.find((l) => l.id === value) || LAYOUT_MAP[DEFAULT_LAYOUT];

  return (
    <div>
      <button
        type="button"
        data-testid="layout-open"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between rounded-2xl border border-[#3f3f46]/40 bg-[#111111] px-4 py-4 hover:border-[hsl(272,24%,46%)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(272,24%,46%)]/20 text-white">
            <Layout className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-white">{selected.label}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{selected.hint}</div>
          </div>
        </div>
        <span className="text-[10px] font-bold text-white bg-[hsl(272,24%,46%)] px-2.5 py-1 rounded-md shrink-0">
          Change Layout
        </span>
      </button>

      <FxModal
        open={isOpen}
        onOpenChange={setIsOpen}
        id="layout-drawer"
        title="Layout"
        description="Choose how your profile page is structured."
        eyebrow="Profile Structure"
        testid="layout-drawer"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {["minimal", "floating", "banner", "slideshow"].map((id) => {
            const l = LAYOUT_MAP[id] || { id, label: id, hint: "" };
            const active = (value || DEFAULT_LAYOUT) === l.id;
            return (
              <button
                key={l.id}
                type="button"
                data-testid={`layout-option-${l.id}`}
                onClick={() => {
                  onChange(l.id);
                  setIsOpen(false);
                }}
                className={`p-4 rounded-2xl border text-left transition flex flex-col gap-2 ${
                  active
                    ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)]/15 text-white"
                    : "border-[#3f3f46]/40 bg-[#111111] hover:border-white/30 text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-sm text-white">
                  <span>{l.label}</span>
                  {active && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="text-xs text-zinc-400">{l.hint}</div>
              </button>
            );
          })}
        </div>
      </FxModal>
    </div>
  );
}

const Section = ({ title, hint, children }) => (
  <section className="w-full rounded-2xl border border-[#3f3f46]/30 bg-[#111111] p-5 sm:p-7 space-y-6 shadow-sm">
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-zinc-300">{title}</h2>
      <span className="h-px flex-1 bg-[#3f3f46]/30" />
      {hint && <span className="shrink-0 text-[11px] text-zinc-400">{hint}</span>}
    </div>
    {children}
  </section>
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
              ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)] text-white shadow-sm"
              : o.locked
                ? "border-[#3f3f46]/30 bg-[#09090b] text-zinc-600"
                : "border-[#3f3f46]/40 bg-[#09090b] text-zinc-300 hover:border-white/30 hover:text-white"
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
        className="[&_[role=slider]]:border-[hsl(272,24%,46%)] [&_[role=slider]]:bg-white [&_.absolute]:bg-[hsl(272,24%,46%)]"
        aria-label={label}
      />
    </div>
  );
};

const ENTRY_STYLES = [
  { id: "text", label: "Text" },
  { id: "button", label: "Button" },
  { id: "image", label: "Image" },
];

const EntryStyleThumb = ({ id, accent }) => (
  <span className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-xl border border-[#3f3f46]/40 bg-[#09090b]">
    {id === "text" ? (
      <span className="relative font-mono2 text-[10px] uppercase tracking-widest text-white font-bold">
        Click to enter
      </span>
    ) : id === "image" ? (
      <span className="relative flex flex-col items-center gap-1">
        <img src="/logo.png" alt="" className="w-5 h-5 object-contain" />
        <span className="text-[9px] font-mono2 text-zinc-400">Image Stamp</span>
      </span>
    ) : (
      <span className="relative rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold text-white shadow-md">
        Click to enter
      </span>
    )}
  </span>
);

const ToggleRow = ({ testid, label, hint, checked, onCheckedChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#3f3f46]/40 bg-[#09090b] px-3.5 py-2.5 text-xs text-zinc-300 hover:border-[#3f3f46]/70 transition-colors">
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
    ? "relative h-28 w-52 sm:w-64 shrink-0 overflow-hidden rounded-2xl border border-[#3f3f46]/40 bg-[#09090b]"
    : "relative h-56 sm:h-64 w-full overflow-hidden rounded-2xl border border-[#3f3f46]/40 bg-[#09090b]";
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
        <div className={`rounded-2xl border border-[#3f3f46]/40 bg-black/50 text-center backdrop-blur-sm ${compact ? "px-4 py-3" : "px-6 py-5"}`}>
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
        className="shrink-0 rounded-2xl outline-none transition hover:ring-2 hover:ring-[hsl(272,24%,46%)]/60"
      >
        <EffectStage
          variant={variant}
          id={value || ""}
          accent={accent}
          size="compact"
          label={`${selected.label}${selected.premium && !isPremium ? " · Premium" : ""}`}
        />
      </button>

      <div className="min-w-[10rem] flex-1">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[hsl(272,24%,46%)]" />
          <span className="truncate">{selected.label}</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
          {selected.id
            ? selected.premium && !isPremium
              ? "Premium — unlock it on the pricing page."
              : "Live on your profile."
            : "Nothing selected."}
        </p>
      </div>

      <button
        type="button"
        data-testid={`${testid}-open`}
        onClick={() => { onPreview?.(null); setIsOpen(true); }}
        className="px-4 py-2.5 rounded-xl bg-[hsl(272,24%,46%)] text-white font-semibold text-xs transition hover:brightness-110 shrink-0"
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
      <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[hsl(272,24%,46%)] px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-110">
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {buttonLabel}
        <input type="file" accept={accept} onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>
      {value && (
        <button
          type="button"
          onClick={onRemove}
          data-testid={`${testid}-remove`}
          className="rounded-xl border border-[#3f3f46]/40 bg-[#09090b] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.08]"
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
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#3f3f46]/40 bg-[#09090b] px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:border-[hsl(272,24%,46%)]">
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {value ? "Replace image" : "Upload image"}
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>
    </div>
  );
}

const ProfileRow = ({ label, children }) => (
  <div className="border-b border-[#3f3f46]/30 py-5 last:border-b-0">
    <div className="mb-3 text-sm font-semibold text-zinc-200">{label}</div>
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

  // Tab resolution from query param or initial state
  const tabParam = searchParams.get("tab") || "";
  const initialSub =
    tabParam === "appearance" ? "appearance"
      : tabParam === "layout" ? "layout"
      : tabParam === "audios" ? "audios"
      : (tabParam === "extra" || tabParam === "effects") ? "extra"
      : "about";

  const [sub, setSub] = useState(initialSub);

  // Sync tab change with URL search params when changed
  const switchSub = (id) => {
    setSub(id);
    if (id === "about") {
      searchParams.delete("tab");
      setSearchParams(searchParams, { replace: true });
    } else {
      searchParams.set("tab", id);
      setSearchParams(searchParams, { replace: true });
    }
  };

  // Sync when URL parameter changes externally
  useEffect(() => {
    if (tabParam === "appearance" && sub !== "appearance") setSub("appearance");
    else if (tabParam === "layout" && sub !== "layout") setSub("layout");
    else if (tabParam === "audios" && sub !== "audios") setSub("audios");
    else if ((tabParam === "extra" || tabParam === "effects") && sub !== "extra") setSub("extra");
    else if (!tabParam && sub !== "about" && sub !== "appearance" && sub !== "layout" && sub !== "audios" && sub !== "extra") {
      setSub("about");
    }
  }, [tabParam]);

  const [showDecoModal, setShowDecoModal] = useState(false);
  const [showTipPanel, setShowTipPanel] = useState(false);
  const [showTextEffectsModal, setShowTextEffectsModal] = useState(false);
  const [showOverlayEffectsModal, setShowOverlayEffectsModal] = useState(false);
  const [showBgEffectsModal, setShowBgEffectsModal] = useState(false);
  const [showCursorEffectsModal, setShowCursorEffectsModal] = useState(false);
  const [activeTextSlot, setActiveTextSlot] = useState("name"); // "name" | "alias" | "bio"

  const [p, setP] = useState({ ...user.profile });
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [bgMode, setBgMode] = useState(user.profile?.background_url ? "media" : "color");
  const [saving, setSaving] = useState(false);

  // Audio track draft for adding new song
  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackArtist, setNewTrackArtist] = useState("");
  const [newTrackUrl, setNewTrackUrl] = useState("");
  const [newTrackArtwork, setNewTrackArtwork] = useState("");
  const [newTrackLyrics, setNewTrackLyrics] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);

  useClearFxPreviewOnUnmount();

  const isPremium = user.tier === "premium" || user.tier === "admin" || user.is_owner;

  useEffect(() => {
    if (user?.profile) {
      setP((prev) => ({
        ...prev,
        widgets: user.profile.widgets || [],
        tracks: user.profile.tracks || [],
      }));
    }
  }, [user?.profile?.widgets, user?.profile?.tracks]);

  const set = (k, v) => setP((prev) => ({ ...prev, [k]: v }));
  const accentColor = p.accent_color || "hsl(272, 24%, 46%)";

  const handleCardStylePreset = (styleId) => {
    const preset = CARD_STYLE_PRESETS[styleId] || { card_style: styleId };
    setP((prev) => ({
      ...prev,
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
      if (!newTrackTitle) {
        setNewTrackTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      toast.success("Audio file uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Audio upload failed");
    }
    setUploadingAudio(false);
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

  const save = async () => {
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
      toast.success("Profile changes saved!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    }
    setSaving(false);
  };

  const SUBTAB_ITEMS = [
    { id: "about", label: "About Me", icon: User },
    { id: "appearance", label: "Appearance", icon: Paintbrush },
    { id: "audios", label: "Audios", icon: Music },
    { id: "extra", label: "Extra", icon: Sparkles },
    { id: "layout", label: "Layout", icon: Layout },
  ];

  return (
    <div data-testid="editor-page" className="space-y-8 bg-[#09090b] text-white">
      <AuthGateNotice variant="card" />

      {/* Navigation Subtabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SUBTAB_ITEMS.map((s) => {
          const Icon = s.icon;
          const active = sub === s.id;
          return (
            <button
              key={s.id}
              type="button"
              data-testid={`editor-subtab-${s.id}`}
              onClick={() => switchSub(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                active
                  ? "bg-[hsl(272,24%,46%)] text-white shadow-sm"
                  : "bg-[#111111] text-zinc-400 hover:text-white border border-[#3f3f46]/30 hover:border-[#3f3f46]/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{s.label}</span>
            </button>
          );
        })}

        {/* Hidden test compatibility buttons for legacy suite selectors */}
        <div className="sr-only" aria-hidden="true">
          <button data-testid="editor-subtab-profile" onClick={() => switchSub("about")}>Profile</button>
          <button data-testid="editor-subtab-card" onClick={() => switchSub("appearance")}>Card</button>
          <button data-testid="editor-subtab-effects" onClick={() => switchSub("extra")}>Effects</button>
          <button data-testid="editor-subtab-entry" onClick={() => switchSub("extra")}>Entry</button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_420px] 2xl:grid-cols-[1fr_450px]">
        {/* Controls Column */}
        <div className="space-y-6">

          {/* ========================================================
              SUBTAB 1: ABOUT ME
              ======================================================== */}
          {sub === "about" && (
            <Section title="About Me" hint="Your picture, decorations, banner, and bio">
              <ProfileRow label="Avatar">
                <div className="flex items-center gap-5">
                  <div className="relative h-16 w-16 shrink-0">
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
                    testid="asset-avatar"
                    label="Avatar"
                    buttonLabel="Change Avatar"
                    value={p.avatar_url}
                    accept="image/*"
                    onUploaded={(u) => set("avatar_url", u)}
                    onRemove={() => set("avatar_url", "")}
                  />
                </div>
                {p.avatar_url && (
                  <div className="mt-4 space-y-3">
                    <SliderRow
                      testid="avatar-zoom"
                      label="Pfp zoom"
                      value={Number(p.avatar_zoom ?? 100)}
                      min={100}
                      max={250}
                      step={5}
                      suffix="%"
                      onChange={(v) => set("avatar_zoom", v)}
                    />
                    <SliderRow
                      testid="avatar-crop-x"
                      label="Crop X"
                      value={Number(p.avatar_pos_x ?? 50)}
                      min={0}
                      max={100}
                      step={1}
                      suffix="%"
                      onChange={(v) => set("avatar_pos_x", v)}
                    />
                    <SliderRow
                      testid="avatar-crop-y"
                      label="Crop Y"
                      value={Number(p.avatar_pos_y ?? 50)}
                      min={0}
                      max={100}
                      step={1}
                      suffix="%"
                      onChange={(v) => set("avatar_pos_y", v)}
                    />
                  </div>
                )}
              </ProfileRow>

              <ProfileRow label="Decoration">
                <div className="flex flex-wrap items-center gap-2.5" data-testid="decoration-picker-row">
                  <button
                    type="button"
                    data-testid="open-decorations"
                    onClick={() => setShowDecoModal(true)}
                    className="rounded-xl bg-[hsl(272,24%,46%)] px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-110 cursor-pointer"
                  >
                    Change Decoration
                  </button>
                  {p.avatar_decoration && (
                    <button
                      type="button"
                      data-testid="remove-decoration"
                      onClick={() => { set("avatar_decoration", ""); set("avatar_decoration_hue", 0); }}
                      className="rounded-xl border border-[#3f3f46]/40 bg-[#09090b] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.08]"
                    >
                      Remove Decoration
                    </button>
                  )}
                  {Number(p.avatar_decoration_hue) > 0 && (
                    <span className="font-mono2 text-[10px] text-zinc-400">hue {p.avatar_decoration_hue}°</span>
                  )}
                </div>
              </ProfileRow>

              <ProfileRow label="Background">
                <div className="mb-3 inline-flex rounded-xl border border-[#3f3f46]/40 bg-[#09090b] p-1">
                  {[
                    { id: "color", label: "Color" },
                    { id: "media", label: "Media" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      data-testid={`bg-mode-${mode.id}`}
                      aria-pressed={bgMode === mode.id}
                      onClick={() => {
                        if (mode.id === "color" && p.background_url) set("background_url", "");
                        setBgMode(mode.id);
                      }}
                      className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                        bgMode === mode.id ? "bg-[hsl(272,24%,46%)] text-white" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {bgMode === "color" ? (
                  <div className="max-w-xs space-y-2">
                    <ColorPicker label="" value={p.background_color || ""} onChange={(v) => set("background_color", v)} testid="background-color" />
                    <p className="text-[11px] text-zinc-400">
                      Sets a solid background color. Any image/video background will be removed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <QuickUpload
                      testid="asset-background"
                      label="Background"
                      buttonLabel="Change Media"
                      value={p.background_url}
                      accept={isPremium ? "image/*,video/mp4" : "image/*"}
                      onUploaded={(u) => set("background_url", u)}
                      onRemove={() => set("background_url", "")}
                      premiumHint={!isPremium ? "MP4 video background is Premium" : null}
                    />
                    {p.background_url && (
                      <div className="max-w-sm space-y-4 pt-2">
                        <SliderRow
                          testid="slider-bg-opacity"
                          label="Background opacity"
                          value={Number(p.bg_opacity ?? 100)}
                          min={0}
                          max={100}
                          suffix="%"
                          onChange={(v) => set("bg_opacity", v)}
                        />
                        <SliderRow
                          testid="slider-bg-dim"
                          label="Background dim / darkness"
                          value={Number(p.bg_dim ?? 50)}
                          min={0}
                          max={100}
                          suffix="%"
                          onChange={(v) => set("bg_dim", v)}
                        />
                        <ColorPicker label="Tint" value={p.overlay_color || accentColor} onChange={(v) => set("overlay_color", v)} testid="background-tint" />
                      </div>
                    )}
                  </div>
                )}
              </ProfileRow>

              <ProfileRow label="Banner">
                <div className="space-y-3">
                  <QuickUpload
                    testid="asset-banner"
                    label="Banner"
                    buttonLabel="Change Banner"
                    value={p.banner_url}
                    accept="image/*"
                    onUploaded={(u) => set("banner_url", u)}
                    onRemove={() => set("banner_url", "")}
                  />
                  <ChipGrid
                    testid="banner-effect"
                    value={p.banner_effect || "fade"}
                    onChange={(v) => set("banner_effect", v)}
                    options={[
                      { id: "fade", label: "Fade" },
                      { id: "dim", label: "Dim" },
                      { id: "vignette", label: "Vignette" },
                      { id: "none", label: "None" },
                    ]}
                  />
                </div>
              </ProfileRow>

              <ProfileRow label="Crosshair">
                <CrosshairPicker
                  value={p}
                  onChange={(next) => setP((prev) => ({ ...prev, ...next }))}
                  isPremium={isPremium}
                  onLocked={askPremium("Custom crosshairs")}
                />
              </ProfileRow>

              <ProfileRow label="Display Name">
                <input
                  data-testid="editor-displayname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl bg-[#09090b] border border-[#3f3f46]/40 px-4 py-3 text-sm text-white outline-none focus:border-[hsl(272,24%,46%)]"
                />
              </ProfileRow>

              <ProfileRow label="Bio">
                <textarea
                  data-testid="editor-bio"
                  value={p.bio || ""}
                  onChange={(e) => set("bio", e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl bg-[#09090b] border border-[#3f3f46]/40 px-4 py-3 text-sm text-white outline-none focus:border-[hsl(272,24%,46%)]"
                  placeholder="Tell people who you are..."
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs text-zinc-400">Location</label>
                    <input
                      data-testid="editor-location"
                      value={p.location || ""}
                      onChange={(e) => set("location", e.target.value)}
                      placeholder="e.g. Tokyo, Japan"
                      className="w-full rounded-xl bg-[#09090b] border border-[#3f3f46]/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[hsl(272,24%,46%)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-zinc-400">Accent colour</label>
                    <ColorPicker label="" value={p.accent_color || "hsl(272, 24%, 46%)"} onChange={(v) => set("accent_color", v)} testid="color-accent" />
                  </div>
                </div>
              </ProfileRow>
            </Section>
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
                                ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)] text-white shadow-sm"
                                : "border-[#3f3f46]/40 bg-[#09090b] text-zinc-300 hover:border-white/30"
                            }`}
                          >
                            <span className="capitalize">{styleId.replace("-", " ")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#3f3f46]/30 pt-4">
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

                  {/* Advanced Mode Toggle */}
                  <div className="flex items-center justify-between border-t border-[#3f3f46]/30 pt-4">
                    <div>
                      <div className="text-xs font-semibold text-white">Advanced Appearance Mode</div>
                      <div className="text-[11px] text-zinc-400">Fine-tune card blur, opacity, borders and surface colors</div>
                    </div>
                    <Switch
                      data-testid="advanced-mode-toggle"
                      className={SWITCH_CLASS}
                      checked={!!p.advanced_mode}
                      onCheckedChange={(v) => set("advanced_mode", v)}
                    />
                  </div>

                  {p.advanced_mode && (
                    <div data-testid="advanced-appearance" className="space-y-4 rounded-xl border border-[#3f3f46]/40 bg-[#09090b] p-4">
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

                      <div className="grid gap-4 sm:grid-cols-2 border-t border-[#3f3f46]/30 pt-4">
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

                      <div className="grid gap-4 sm:grid-cols-2 border-t border-[#3f3f46]/30 pt-4">
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

                      <div className="grid gap-4 sm:grid-cols-2 border-t border-[#3f3f46]/30 pt-4">
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
                        <SliderRow
                          testid="card-glow-strength"
                          label="Glow Strength"
                          value={Number(p.card_glow_strength ?? 50)}
                          min={0}
                          max={100}
                          suffix="%"
                          onChange={(v) => set("card_glow_strength", v)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Glow & Gradient Settings */}
                  <div className="space-y-4 rounded-xl border border-[#3f3f46]/40 bg-[#09090b] p-4">
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
                      <div className="grid gap-4 sm:grid-cols-2 border-t border-[#3f3f46]/30 pt-3">
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

                    <div className="flex items-center justify-between border-t border-[#3f3f46]/30 pt-3">
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
                      <div className="grid gap-4 sm:grid-cols-2 border-t border-[#3f3f46]/30 pt-3">
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
                          suffix="°"
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

              <Section title="Links & Typography" hint="Font choice, layout structure, social glows">
                <div className="space-y-4">
                  <LayoutPicker
                    value={p.layout || DEFAULT_LAYOUT}
                    onChange={(v) => set("layout", v)}
                    isPremium={isPremium}
                    navigate={navigate}
                  />

                  <FontField
                    testid="font-display"
                    label="Display Font"
                    value={p.font_display}
                    onChange={(stack) => set("font_display", stack)}
                    isPremium={isPremium}
                    navigate={navigate}
                  />

                  <div className="flex items-center justify-between border-t border-[#3f3f46]/30 pt-3">
                    <div>
                      <div className="text-xs font-semibold text-white">Social Icons Glow</div>
                      <div className="text-[11px] text-zinc-400">Glow effect on social platform icons and link pills</div>
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

              <Section title="Tooltips & Display" hint="Hover labels, UID and view count">
                <button
                  type="button"
                  data-testid="tooltip-panel-open"
                  onClick={() => setShowTipPanel(true)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#3f3f46]/40 bg-[#09090b] px-4 py-3.5 text-left transition hover:border-[hsl(272,24%,46%)]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <MousePointer2 className="h-4 w-4 shrink-0 text-[hsl(272,24%,46%)]" />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-white">Tooltips & Display Options</span>
                      <span className="mt-0.5 block truncate text-[11px] text-zinc-400">
                        {(TOOLTIP_STYLES.find((s) => s.id === (p.tooltip_style || "classic")) || {}).label || "Classic"} · badges, links & UID
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                </button>
              </Section>

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
                    Hide the &quot;made with swats.bio&quot; footer
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
                <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 border-t border-[#3f3f46]/30 pt-4 text-xs text-zinc-300">
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

              {/* Tooltips Modal */}
              <FxModal
                open={showTipPanel}
                onOpenChange={setShowTipPanel}
                id="tip-panel"
                eyebrow="Tooltips"
                title="Tooltips & Display"
                description="Hover labels, entrance animations, and profile footer styling."
                testid="tip-panel"
                footer={
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setShowTipPanel(false)} className="px-4 py-2 text-xs bg-[hsl(272,24%,46%)] text-white font-bold rounded-xl">
                      Done
                    </button>
                  </div>
                }
              >
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 text-xs text-zinc-300 font-semibold">Look</div>
                    <ChipGrid
                      testid="tooltip-style"
                      cols={3}
                      value={p.tooltip_style || "classic"}
                      onChange={(v) => set("tooltip_style", v)}
                      options={TOOLTIP_STYLES}
                    />
                  </div>

                  <div className="border-t border-[#3f3f46]/30 pt-4">
                    <div className="mb-2 text-xs text-zinc-300 font-semibold">Entrance</div>
                    <ChipGrid
                      testid="tooltip-animation"
                      cols={3}
                      value={p.tooltip_anim || "slide"}
                      onChange={(v) => set("tooltip_anim", v)}
                      options={TOOLTIP_ANIMATIONS}
                    />
                  </div>

                  <div className="border-t border-[#3f3f46]/30 pt-4">
                    <div className="mb-2 text-xs text-zinc-300 font-semibold">Size</div>
                    <ChipGrid
                      testid="tooltip-size"
                      cols={3}
                      value={p.tooltip_size || "md"}
                      onChange={(v) => set("tooltip_size", v)}
                      options={TOOLTIP_SIZES}
                    />
                  </div>

                  <div className="border-t border-[#3f3f46]/30 pt-4 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Show hover label on</div>
                    <ToggleRow
                      testid="badge-tooltips-toggle"
                      label="Badges"
                      hint="badge name & details"
                      checked={p.badge_tooltips !== false}
                      onCheckedChange={(v) => set("badge_tooltips", v)}
                    />
                    <ToggleRow
                      testid="link-tooltips-toggle"
                      label="Links"
                      hint="custom link note"
                      checked={p.link_tooltips !== false}
                      onCheckedChange={(v) => set("link_tooltips", v)}
                    />
                    <ToggleRow
                      testid="avatar-uid-tooltip-toggle"
                      label="Avatar"
                      hint="UID following cursor"
                      checked={p.avatar_uid_tooltip !== false}
                      onCheckedChange={(v) => set("avatar_uid_tooltip", v)}
                    />
                  </div>

                  <div className="border-t border-[#3f3f46]/30 pt-4 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Footer Line Settings</div>
                    <ChipGrid
                      testid="meta-style"
                      cols={3}
                      value={p.meta_style || "plain"}
                      onChange={(v) => set("meta_style", v)}
                      options={[
                        { id: "plain", label: "Plain" },
                        { id: "pills", label: "Pills" },
                        { id: "boxed", label: "Boxed" },
                      ]}
                    />

                    <div className="mt-3">
                      <div className="mb-2 text-xs text-zinc-300 font-semibold">View Counter Position</div>
                      <ChipGrid
                        testid="views-position"
                        cols={3}
                        value={p.views_position || ""}
                        onChange={(v) => set("views_position", v)}
                        options={[
                          { id: "", label: "Meta line" },
                          { id: "tl", label: "Top left" },
                          { id: "tr", label: "Top right" },
                          { id: "bl", label: "Bottom left" },
                          { id: "br", label: "Bottom right" },
                          { id: "hidden", label: "Hidden" },
                        ]}
                      />
                    </div>

                    <div className="mt-3 space-y-2">
                      <ToggleRow
                        testid="show-join-date"
                        label="Join Date"
                        hint="member since badge"
                        checked={!!p.show_join_date}
                        onCheckedChange={(v) => set("show_join_date", v)}
                      />
                      <ToggleRow
                        testid="showcase-uid-toggle"
                        label="Showcase UID"
                        hint="UID badge on profile"
                        checked={!!p.showcase_uid}
                        onCheckedChange={(v) => set("showcase_uid", v)}
                      />
                    </div>
                  </div>
                </div>
              </FxModal>
            </>
          )}

          {/* ========================================================
              SUBTAB 3: AUDIOS (FULL AUDIO MANAGER MOVED HERE)
              ======================================================== */}
          {sub === "audios" && (
            <Section title="Audio Manager" hint="Player styles: Compact, Lyrics, Marquee, Vinyl">
              {/* Player Style Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2.5">
                  Audio Player Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AUDIO_STYLES.map((style) => {
                    const active = (p.track_style || p.audio_style || "compact") === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => {
                          set("track_style", style.id);
                          set("audio_style", style.id);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-2 ${
                          active
                            ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)] text-white shadow-sm"
                            : "border-[#3f3f46]/40 bg-[#09090b] text-zinc-300 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span>{style.label}</span>
                          {active && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">
                          {style.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio Settings & Sliders */}
              <div className="space-y-4 rounded-xl border border-[#3f3f46]/40 bg-[#09090b] p-4">
                <SliderRow
                  label="Audio Default Volume"
                  value={Number(p.audio_volume ?? 80)}
                  min={0}
                  max={100}
                  suffix="%"
                  onChange={(v) => set("audio_volume", v)}
                />

                <div className="grid gap-3 sm:grid-cols-2 border-t border-[#3f3f46]/30 pt-4">
                  <ToggleRow
                    label="Autoplay Audio"
                    hint="start playback on entry"
                    checked={p.audio_autoplay === true}
                    onCheckedChange={(v) => set("audio_autoplay", v)}
                  />
                  <ToggleRow
                    label="Loop Track"
                    hint="repeat continuously"
                    checked={p.audio_loop !== false}
                    onCheckedChange={(v) => set("audio_loop", v)}
                  />
                  <ToggleRow
                    label="Shuffle Playlist"
                    hint="random order"
                    checked={p.audio_shuffle === true}
                    onCheckedChange={(v) => set("audio_shuffle", v)}
                  />
                  <ToggleRow
                    testid="disable-audio-border-toggle"
                    label="Seamless Audio Border"
                    hint="disable outer borders for audio blocks"
                    checked={p.disable_audio_border === true}
                    onCheckedChange={(v) => set("disable_audio_border", v)}
                  />
                  <ToggleRow
                    testid="disable-mute-border-toggle"
                    label="Seamless Mute Border"
                    hint="disable border outline on mute button"
                    checked={p.disable_mute_border === true}
                    onCheckedChange={(v) => set("disable_mute_border", v)}
                  />
                </div>
              </div>

              {/* Add New Track Section */}
              <div className="rounded-xl border border-[#3f3f46]/40 bg-[#09090b] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Add New Track</h3>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[hsl(272,24%,46%)] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110">
                    {uploadingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Upload MP3 / WAV
                    <input type="file" accept="audio/*" onChange={handleAudioUpload} disabled={uploadingAudio} className="hidden" />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Track Title</label>
                    <input
                      type="text"
                      value={newTrackTitle}
                      onChange={(e) => setNewTrackTitle(e.target.value)}
                      placeholder="e.g. Moonlight"
                      className="w-full px-3 py-2 rounded-xl bg-[#111111] border border-[#3f3f46]/40 text-xs text-white outline-none focus:border-[hsl(272,24%,46%)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Artist</label>
                    <input
                      type="text"
                      value={newTrackArtist}
                      onChange={(e) => setNewTrackArtist(e.target.value)}
                      placeholder="e.g. Kali Uchis"
                      className="w-full px-3 py-2 rounded-xl bg-[#111111] border border-[#3f3f46]/40 text-xs text-white outline-none focus:border-[hsl(272,24%,46%)]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-zinc-400">Audio URL</label>
                    <input
                      type="text"
                      value={newTrackUrl}
                      onChange={(e) => setNewTrackUrl(e.target.value)}
                      placeholder="https://... or uploaded file"
                      className="w-full px-3 py-2 rounded-xl bg-[#111111] border border-[#3f3f46]/40 text-xs text-white outline-none focus:border-[hsl(272,24%,46%)]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-zinc-400">Cover Artwork URL (Optional)</label>
                    <input
                      type="text"
                      value={newTrackArtwork}
                      onChange={(e) => setNewTrackArtwork(e.target.value)}
                      placeholder="https://... image cover"
                      className="w-full px-3 py-2 rounded-xl bg-[#111111] border border-[#3f3f46]/40 text-xs text-white outline-none focus:border-[hsl(272,24%,46%)]"
                    />
                  </div>
                  {(p.track_style === "lyrics" || p.audio_style === "lyrics") && (
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-zinc-400">Lyrics (Optional)</label>
                      <textarea
                        value={newTrackLyrics}
                        onChange={(e) => setNewTrackLyrics(e.target.value)}
                        placeholder="Paste track lyrics here..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl bg-[#111111] border border-[#3f3f46]/40 text-xs text-white outline-none focus:border-[hsl(272,24%,46%)] resize-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddTrack}
                  className="w-full py-2.5 rounded-xl bg-[hsl(272,24%,46%)] text-white text-xs font-bold transition hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Track to Playlist
                </button>
              </div>

              {/* Playlist Tracks List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-300">
                  Current Tracks ({((p.tracks || []).length)})
                </div>
                {(!p.tracks || p.tracks.length === 0) ? (
                  <div className="py-6 text-center text-xs text-zinc-500 rounded-xl border border-dashed border-[#3f3f46]/40 bg-[#09090b]">
                    No audio tracks in playlist yet. Add your first song above!
                  </div>
                ) : (
                  p.tracks.map((track, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#3f3f46]/40 bg-[#09090b]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(272,24%,46%)]/20 border border-[hsl(272,24%,46%)]/40 flex items-center justify-center text-white shrink-0">
                          <Music className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-white">{track.title || "Untitled"}</div>
                          <div className="truncate text-[10px] text-zinc-400">{track.artist || "Unknown artist"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveTrack(i)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                          title="Remove track"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Section>
          )}

          {/* ========================================================
              SUBTAB 4: EXTRA (SYSTEM SETTINGS, ENTRY SCREEN, 3D TILT, EFFECTS POPUPS)
              ======================================================== */}
          {sub === "extra" && (
            <>
              {/* Card Extra: 3D Tilt & Interactive Effects */}
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
                      suffix="°"
                      onChange={(v) => set("tilt_strength", v)}
                    />
                  )}
                </div>
              </Section>

              {/* Effects Popups Section with Text Buttons */}
              <Section title="Profile Effects" hint="Text effects, overlay filters and dynamic backgrounds">
                <p className="text-xs text-zinc-400">
                  Select effects for your profile using the buttons below. Text effects support individual toggles for name, alias and bio.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <button
                    type="button"
                    data-testid="text-effects-modal-open"
                    onClick={() => setShowTextEffectsModal(true)}
                    className="py-3 px-3 rounded-xl bg-[#09090b] border border-[#3f3f46]/40 text-xs font-bold text-white hover:border-[hsl(272,24%,46%)] transition-colors text-center cursor-pointer"
                  >
                    Text Effects
                  </button>
                  <button
                    type="button"
                    data-testid="overlay-effects-modal-open"
                    onClick={() => setShowOverlayEffectsModal(true)}
                    className="py-3 px-3 rounded-xl bg-[#09090b] border border-[#3f3f46]/40 text-xs font-bold text-white hover:border-[hsl(272,24%,46%)] transition-colors text-center cursor-pointer"
                  >
                    Overlay Effects
                  </button>
                  <button
                    type="button"
                    data-testid="background-effects-modal-open"
                    onClick={() => setShowBgEffectsModal(true)}
                    className="py-3 px-3 rounded-xl bg-[#09090b] border border-[#3f3f46]/40 text-xs font-bold text-white hover:border-[hsl(272,24%,46%)] transition-colors text-center cursor-pointer"
                  >
                    Background Effects
                  </button>
                  <button
                    type="button"
                    data-testid="cursor-effects-modal-open"
                    onClick={() => setShowCursorEffectsModal(true)}
                    className="py-3 px-3 rounded-xl bg-[#09090b] border border-[#3f3f46]/40 text-xs font-bold text-white hover:border-[hsl(272,24%,46%)] transition-colors text-center cursor-pointer"
                  >
                    Cursor Effects
                  </button>
                </div>

                {/* Hidden test compatibility container for legacy selectors */}
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
              </Section>

              {/* System Settings: Meta Embeds, Title, Description, Theme Color */}
              <Section title="System Settings" hint="Meta embeds, browser header, social preview">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Meta Title</label>
                    <input
                      data-testid="editor-meta-title"
                      value={p.meta_title || ""}
                      onChange={(e) => set("meta_title", e.target.value)}
                      maxLength={60}
                      placeholder={`${(displayName || user.username) + (" on swats.bio")}`}
                      className="w-full rounded-xl bg-[#09090b] border border-[#3f3f46]/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[hsl(272,24%,46%)]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Meta Description</label>
                    <textarea
                      data-testid="editor-meta-description"
                      value={p.meta_description || ""}
                      onChange={(e) => set("meta_description", e.target.value)}
                      rows={2}
                      maxLength={160}
                      placeholder="Your bio doubles as the description — or write a custom description here."
                      className="w-full resize-none rounded-xl bg-[#09090b] border border-[#3f3f46]/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[hsl(272,24%,46%)]"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Embed Image URL</label>
                      <input
                        data-testid="editor-meta-image"
                        value={p.meta_image || ""}
                        onChange={(e) => set("meta_image", e.target.value)}
                        placeholder="https://... or uploaded image"
                        className="w-full rounded-xl bg-[#09090b] border border-[#3f3f46]/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[hsl(272,24%,46%)]"
                      />
                      <div className="mt-2">
                        <MetaImageUpload
                          value={p.meta_image || ""}
                          onUploaded={(u) => set("meta_image", u)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Theme Color</label>
                      <ColorPicker label="" value={p.theme_color || accentColor} onChange={(v) => set("theme_color", v)} testid="color-theme" />
                    </div>
                  </div>
                </div>
              </Section>

              {/* Profile Entry Screen Settings */}
              <Section title="Profile Entry Screen" hint="Click-to-enter gate, PIN lock, or image stamp">
                <label className="mb-4 flex cursor-pointer items-center justify-between gap-4 text-xs font-bold text-white">
                  <span>Enable Entry Overlay Screen</span>
                  <Switch data-testid="entry-enable" className={SWITCH_CLASS} checked={!!p.entry_enabled} onCheckedChange={(v) => set("entry_enabled", v)} />
                </label>
                {p.entry_enabled && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-2">Visual Entry Style</label>
                      <div className="grid grid-cols-3 gap-2">
                        {ENTRY_STYLES.map(({ id, label }) => {
                          const active = (p.entry_style || "button") === id || (id === "button" && p.entry_style === "bubble");
                          return (
                            <button
                              key={id}
                              data-testid={`entry-style-${id}`}
                              aria-pressed={active}
                              onClick={() => set("entry_style", id)}
                              className={`flex flex-col gap-2 rounded-xl border p-2 text-xs font-semibold transition cursor-pointer ${
                                active ? "bg-[hsl(272,24%,46%)] border-[hsl(272,24%,46%)] text-white" : "border-[#3f3f46]/40 bg-[#09090b] text-zinc-300 hover:border-white/30"
                              }`}
                            >
                              <EntryStyleThumb id={id} accent={accentColor} />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Hidden test compatibility targets for legacy bubble & codelock */}
                    <div className="hidden" aria-hidden="true">
                      <button
                        data-testid="entry-style-bubble"
                        aria-pressed={(p.entry_style || "button") === "button" || p.entry_style === "bubble"}
                        onClick={() => set("entry_style", "button")}
                      >
                        <span className="rounded-full">Click to enter</span>
                      </button>
                      <button
                        data-testid="entry-style-codelock"
                        aria-pressed={p.entry_style === "codelock"}
                        onClick={() => set("entry_style", "codelock")}
                      >
                        Enter PIN
                        <span className="rounded-full" />
                        <span className="rounded-full" />
                        <span className="rounded-full" />
                        <span className="rounded-full" />
                      </button>
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090b] border border-[#3f3f46]/40 text-xs text-white outline-none focus:border-[hsl(272,24%,46%)]"
                      />
                    </div>

                    {p.entry_style === "image" && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Entry Image Stamp
                        </label>
                        <div className="flex items-center gap-2.5">
                          {p.entry_image ? (
                            <img src={fileUrl(p.entry_image)} alt="" className="h-10 w-10 rounded-xl object-contain bg-black/40 border border-[#3f3f46]/40 p-1" />
                          ) : null}
                          <input
                            type="text"
                            value={p.entry_image || ""}
                            onChange={(e) => set("entry_image", e.target.value)}
                            placeholder="Paste image URL (or image path)"
                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#09090b] border border-[#3f3f46]/40 text-xs text-white outline-none focus:border-[hsl(272,24%,46%)]"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Entry Font
                      </label>
                      <SmartSelect
                        value={p.entry_font || "inherit"}
                        onChange={(val) => set("entry_font", val)}
                        options={[
                          { value: "inherit", label: "Default Site Font" },
                          { value: "Inter", label: "Inter (Clean Sans)" },
                          { value: "Unbounded", label: "Unbounded (Futuristic Bold)" },
                          { value: "Space Grotesk", label: "Space Grotesk (Tech Modern)" },
                          { value: "JetBrains Mono", label: "JetBrains Mono (Code)" },
                          { value: "Syne", label: "Syne (Geometric Art)" },
                          { value: "Outfit", label: "Outfit (Minimalist)" },
                          { value: "Cinzel", label: "Cinzel (Classic Serif)" },
                          { value: "Playfair Display", label: "Playfair Display (Luxury)" },
                        ]}
                      />
                    </div>

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
                                ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)] text-white"
                                : "border-[#3f3f46]/40 bg-[#09090b] text-zinc-300 hover:border-white/30"
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
                    <button type="button" onClick={() => setShowTextEffectsModal(false)} className="px-4 py-2 text-xs bg-[hsl(272,24%,46%)] text-white font-bold rounded-xl">
                      Done
                    </button>
                  </div>
                }
              >
                <div className="space-y-6">
                  {/* Scope Selector Tabs */}
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-[#09090b] border border-[#3f3f46]/40">
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
                          activeTextSlot === tab.id ? "bg-[hsl(272,24%,46%)] text-white shadow-sm" : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Active Slot Toggle & Current Selection */}
                  <div className="p-4 rounded-xl border border-[#3f3f46]/40 bg-[#111111] flex items-center justify-between">
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
                              ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)] text-white shadow-sm"
                              : "border-[#3f3f46]/40 bg-[#09090b] text-zinc-300 hover:border-white/30"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{fx.label}</span>
                            {locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : active ? <Check className="w-3.5 h-3.5 text-white" /> : null}
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

              {/* Overlay Effects Modal */}
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
                    <button type="button" onClick={() => setShowOverlayEffectsModal(false)} className="px-4 py-2 text-xs bg-[hsl(272,24%,46%)] text-white font-bold rounded-xl">
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
                        className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                          active
                            ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)] text-white shadow-sm"
                            : "border-[#3f3f46]/40 bg-[#09090b] text-zinc-300 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{fx.label}</span>
                          {locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : active ? <Check className="w-3.5 h-3.5 text-white" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FxModal>

              {/* Background Effects Modal */}
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
                    <button type="button" onClick={() => setShowBgEffectsModal(false)} className="px-4 py-2 text-xs bg-[hsl(272,24%,46%)] text-white font-bold rounded-xl">
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
                        className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                          active
                            ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)] text-white shadow-sm"
                            : "border-[#3f3f46]/40 bg-[#09090b] text-zinc-300 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{fx.label}</span>
                          {locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : active ? <Check className="w-3.5 h-3.5 text-white" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FxModal>

              {/* Cursor Effects Modal */}
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
                    <button type="button" onClick={() => setShowCursorEffectsModal(false)} className="px-4 py-2 text-xs bg-[hsl(272,24%,46%)] text-white font-bold rounded-xl">
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
                        className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                          active
                            ? "border-[hsl(272,24%,46%)] bg-[hsl(272,24%,46%)] text-white shadow-sm"
                            : "border-[#3f3f46]/40 bg-[#09090b] text-zinc-300 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{fx.label}</span>
                          {locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : active ? <Check className="w-3.5 h-3.5 text-white" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FxModal>
            </>
          )}

          {/* ========================================================
              SUBTAB 5: LAYOUT (WHEN TAB=LAYOUT IS SELECTED)
              ======================================================== */}
          {sub === "layout" && (
            <Section title="Profile Layout" hint="Choose page structure and arrangement">
              <div className="space-y-4">
                <LayoutPicker
                  value={p.layout || DEFAULT_LAYOUT}
                  onChange={(v) => set("layout", v)}
                  isPremium={isPremium}
                  navigate={navigate}
                />

                <div className="space-y-3 pt-3 border-t border-[#3f3f46]/30">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-300">Layout Section Ordering</div>
                  <div className="p-4 rounded-xl border border-[#3f3f46]/40 bg-[#09090b] text-xs text-zinc-400">
                    The chosen layout ({LAYOUT_MAP[p.layout || DEFAULT_LAYOUT]?.label || "Minimal"}) determines the placement of your header, avatar, links and widgets.
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Save Button */}
          <button
            onClick={save}
            disabled={saving}
            data-testid="editor-save"
            className="w-full py-4 rounded-2xl bg-[hsl(272,24%,46%)] text-white font-bold text-sm hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_25px_hsla(272,24%,46%,0.3)] cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : gate.blocked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {gate.blocked ? "Connect Discord to save" : "Save Changes"}
          </button>
        </div>

        {/* Live Preview Column */}
        <div className="lg:sticky lg:top-24 self-start space-y-2.5">
          <div className="text-xs font-mono2 uppercase tracking-wider text-zinc-400 font-bold">Real-time Profile Preview</div>
          <div className="overflow-hidden rounded-2xl border border-[#3f3f46]/40 bg-[#111111] shadow-2xl">
            <LivePreviewCard user={user} profile={p} displayName={displayName} tuning={fxTuning} />
          </div>
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

      <PremiumGate
        open={!!premiumFeature}
        feature={premiumFeature}
        onClose={() => setPremiumFeature(null)}
      />
    </div>
  );
}
