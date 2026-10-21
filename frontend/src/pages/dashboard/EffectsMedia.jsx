import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import { useEditGate } from "@/hooks/useEditGate";
import {
  BACKGROUND_EFFECTS, OVERLAYS, TEXT_EFFECTS, CURSOR_EFFECTS,
} from "@/constants/effects";
import { ColorPicker } from "@/components/ColorPicker";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ProfilePreview } from "@/components/ProfilePreview";
import {
  Sparkles, Layers, Type, MousePointer2, Music, Save,
  Upload, Trash2, Check, Lock, Loader2, Eye, Volume2,
} from "lucide-react";

const TABS = [
  { id: "background", label: "Background", icon: Layers },
  { id: "overlays", label: "Overlays", icon: Sparkles },
  { id: "text", label: "Text FX", icon: Type },
  { id: "cursor", label: "Cursor & Audio", icon: MousePointer2 },
];

export default function EffectsMedia() {
  const { user, setUser } = useAuth();
  const gate = useEditGate();
  const isPremium = user?.tier === "premium" || user?.tier === "admin" || user?.is_owner;

  const [activeTab, setActiveTab] = useState("background");
  const [profile, setProfile] = useState(() => user?.profile || {});
  const [saving, setSaving] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const [cursorUploading, setCursorUploading] = useState(false);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);

  const audioInputRef = useRef(null);
  const cursorInputRef = useRef(null);

  useEffect(() => {
    if (user?.profile) {
      setProfile((prev) => ({ ...user.profile, ...prev }));
    }
  }, [user?.profile]);

  const updateProfile = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (gate.blocked) return;
    setSaving(true);
    try {
      const { data } = await api.put("/me/profile", profile);
      if (data?.user) setUser(data.user);
      else if (data?.profile) setUser((u) => ({ ...u, profile: data.profile }));
      toast.success("Effects & media settings saved successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save effects settings");
    } finally {
      setSaving(false);
    }
  };

  const uploadBackgroundAudio = async (file) => {
    if (!file) return;
    if (gate.blocked) return;
    setAudioUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "audio");
      const { data } = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateProfile("audio_url", data.url);
      toast.success("Background audio track uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Audio upload failed");
    } finally {
      setAudioUploading(false);
    }
  };

  const uploadCustomCursor = async (file) => {
    if (!file) return;
    if (gate.blocked) return;
    if (!isPremium) {
      toast.error("Custom cursor images are a Premium feature");
      return;
    }
    setCursorUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "asset");
      const { data } = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateProfile("cursor_image", data.url);
      toast.success("Custom cursor image uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Cursor upload failed");
    } finally {
      setCursorUploading(false);
    }
  };

  const previewData = {
    ...user,
    profile: {
      ...profile,
    },
  };

  return (
    <div className="space-y-6 pb-24" data-testid="effects-media-page">
      {/* Compact Header Bar */}
      <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 border border-brand-400/25 text-brand-300 shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              Effects & Media
            </h1>
            <p className="text-xs text-zinc-400">
              Customize ambient particles, overlays, and audio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreviewMobile((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] xl:hidden cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-brand-300" />
            {showPreviewMobile ? "Hide Preview" : "Preview"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-testid="save-effects-btn"
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95 disabled:opacity-50 transition cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Controls Left, Live Preview Right */}
      <div className="grid gap-6 xl:grid-cols-[1fr_420px] 2xl:grid-cols-[1fr_450px]">
        {/* Controls Column */}
        <div className="space-y-4">
          {/* Streamlined Tab Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((t) => {
              const active = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  data-testid={`effects-tab-${t.id}`}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                    active
                      ? "bg-brand-500/20 text-brand-200 border border-brand-500/40 shadow-[0_0_15px_rgba(180, 191, 250,0.15)]"
                      : "bg-white/[0.03] text-zinc-400 hover:text-zinc-200 border border-white/5 hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: BACKGROUND EFFECTS */}
          {activeTab === "background" && (
            <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Background Effect</h3>
                <span className="text-[11px] text-zinc-400">Ambient canvas effects</span>
              </div>

              {/* Simplified compact chips grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BACKGROUND_EFFECTS.map((eff) => {
                  const active = (profile.background_effect || "") === eff.id;
                  const locked = eff.premium && !isPremium;
                  return (
                    <button
                      key={eff.id || "none"}
                      type="button"
                      onClick={() => !locked && updateProfile("background_effect", eff.id)}
                      data-testid={`bg-effect-${eff.id || "none"}`}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition cursor-pointer text-xs font-semibold ${
                        active
                          ? "border-brand-500/60 bg-brand-500/20 text-white shadow-sm"
                          : locked
                            ? "border-white/[0.04] bg-black/30 text-zinc-600 cursor-not-allowed"
                            : "border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:border-brand-500/40 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="truncate">{eff.label}</span>
                      {locked ? (
                        <Lock className="h-3 w-3 text-amber-500/80 shrink-0 ml-1.5" />
                      ) : active ? (
                        <Check className="h-3 w-3 text-brand-400 shrink-0 ml-1.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Inline Tuning Controls */}
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-zinc-300 shrink-0">Dim (Darkness)</span>
                  <div className="flex items-center gap-3 w-48 sm:w-64">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[Number(profile.bg_dim ?? 50)]}
                      onValueChange={([v]) => updateProfile("bg_dim", v)}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono text-brand-300 w-10 text-right">{profile.bg_dim ?? 50}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-zinc-300 shrink-0">Media Opacity</span>
                  <div className="flex items-center gap-3 w-48 sm:w-64">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[Number(profile.bg_opacity ?? 100)]}
                      onValueChange={([v]) => updateProfile("bg_opacity", v)}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono text-brand-300 w-10 text-right">{profile.bg_opacity ?? 100}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-zinc-300">Base Color</span>
                  <ColorPicker
                    value={profile.background_color || "#050505"}
                    onChange={(hex) => updateProfile("background_color", hex)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OVERLAYS */}
          {activeTab === "overlays" && (
            <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Screen Overlays</h3>
                <span className="text-[11px] text-zinc-400">Scanlines, noise & grain</span>
              </div>

              {/* Simplified compact chips grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OVERLAYS.map((ov) => {
                  const active = (profile.overlay || "") === ov.id;
                  const locked = ov.premium && !isPremium;
                  return (
                    <button
                      key={ov.id || "none"}
                      type="button"
                      onClick={() => !locked && updateProfile("overlay", ov.id)}
                      data-testid={`overlay-opt-${ov.id || "none"}`}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition cursor-pointer text-xs font-semibold ${
                        active
                          ? "border-brand-500/60 bg-brand-500/20 text-white shadow-sm"
                          : locked
                            ? "border-white/[0.04] bg-black/30 text-zinc-600 cursor-not-allowed"
                            : "border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:border-brand-500/40 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="truncate">{ov.label}</span>
                      {locked ? (
                        <Lock className="h-3 w-3 text-amber-500/80 shrink-0 ml-1.5" />
                      ) : active ? (
                        <Check className="h-3 w-3 text-brand-400 shrink-0 ml-1.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Inline Tuning Controls */}
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-zinc-300 shrink-0">Overlay Opacity</span>
                  <div className="flex items-center gap-3 w-48 sm:w-64">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[Number(profile.overlay_opacity ?? 100)]}
                      onValueChange={([v]) => updateProfile("overlay_opacity", v)}
                      className="flex-1"
                    />
                    <span className="text-[11px] font-mono text-brand-300 w-10 text-right">{profile.overlay_opacity ?? 100}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-semibold text-zinc-200">Color Wash Tint</span>
                    <p className="text-[11px] text-zinc-500">Overlay an ambient tint across the profile</p>
                  </div>
                  <Switch
                    checked={profile.overlay_enabled === true}
                    onCheckedChange={(c) => updateProfile("overlay_enabled", c)}
                  />
                </div>

                {profile.overlay_enabled && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-zinc-300">Tint Color</span>
                    <ColorPicker
                      value={profile.overlay_color || profile.accent_color || "#b4bffa"}
                      onChange={(hex) => updateProfile("overlay_color", hex)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TEXT EFFECTS */}
          {activeTab === "text" && (
            <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Typography & Text FX</h3>
                <span className="text-[11px] text-zinc-400">Display name animations</span>
              </div>

              {/* Simplified compact chips grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TEXT_EFFECTS.map((tf) => {
                  const active = (profile.name_effect || "") === tf.id;
                  const locked = tf.premium && !isPremium;
                  return (
                    <button
                      key={tf.id || "none"}
                      type="button"
                      onClick={() => !locked && updateProfile("name_effect", tf.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition cursor-pointer text-xs font-semibold ${
                        active
                          ? "border-brand-500/60 bg-brand-500/20 text-white shadow-sm"
                          : locked
                            ? "border-white/[0.04] bg-black/30 text-zinc-600 cursor-not-allowed"
                            : "border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:border-brand-500/40 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="truncate">{tf.label}</span>
                      {locked ? (
                        <Lock className="h-3 w-3 text-amber-500/80 shrink-0 ml-1.5" />
                      ) : active ? (
                        <Check className="h-3 w-3 text-brand-400 shrink-0 ml-1.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Inline Text Options */}
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-200">Name Glow Halo</span>
                    <p className="text-[11px] text-zinc-500">Luminescent glow on your display name</p>
                  </div>
                  <Switch
                    checked={profile.name_glow !== false}
                    onCheckedChange={(c) => updateProfile("name_glow", c)}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-semibold text-zinc-200">Apply to @username</span>
                    <p className="text-[11px] text-zinc-500">Also mirror effect onto your username handle</p>
                  </div>
                  <Switch
                    checked={profile.use_name_effect_on_alias === true}
                    onCheckedChange={(c) => updateProfile("use_name_effect_on_alias", c)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CURSOR & MEDIA */}
          {activeTab === "cursor" && (
            <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cursor Trails</h3>
                <span className="text-[11px] text-zinc-400">Mouse follower particles</span>
              </div>

              {/* Simplified compact chips grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CURSOR_EFFECTS.map((cf) => {
                  const active = (profile.cursor_effect || "") === cf.id;
                  const locked = cf.premium && !isPremium;
                  return (
                    <button
                      key={cf.id || "none"}
                      type="button"
                      onClick={() => !locked && updateProfile("cursor_effect", cf.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition cursor-pointer text-xs font-semibold ${
                        active
                          ? "border-brand-500/60 bg-brand-500/20 text-white shadow-sm"
                          : locked
                            ? "border-white/[0.04] bg-black/30 text-zinc-600 cursor-not-allowed"
                            : "border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:border-brand-500/40 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="truncate">{cf.label}</span>
                      {locked ? (
                        <Lock className="h-3 w-3 text-amber-500/80 shrink-0 ml-1.5" />
                      ) : active ? (
                        <Check className="h-3 w-3 text-brand-400 shrink-0 ml-1.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Simplified Media & Audio Controls */}
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                {/* Background Audio */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-zinc-200 block truncate">
                        {profile.audio_url ? "Background Audio Active" : "Background Music Track"}
                      </span>
                      <span className="text-[11px] text-zinc-500 block truncate">
                        {profile.audio_url ? "Loops when visitor enters profile" : "Upload an MP3/WAV background file"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadBackgroundAudio(file);
                        e.target.value = "";
                      }}
                    />
                    {profile.audio_url ? (
                      <button
                        type="button"
                        onClick={() => updateProfile("audio_url", "")}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-semibold transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => audioInputRef.current?.click()}
                        disabled={audioUploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition"
                      >
                        {audioUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>Upload Audio</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Custom Cursor Image */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 shrink-0">
                      <MousePointer2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-200 truncate">Custom Cursor Asset</span>
                        {!isPremium && <Lock className="w-3 h-3 text-amber-500/80" />}
                      </div>
                      <span className="text-[11px] text-zinc-500 block truncate">
                        {profile.cursor_image ? "Custom 32x32 image active" : "PNG / Animated GIF cursor image"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={cursorInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadCustomCursor(file);
                        e.target.value = "";
                      }}
                    />
                    {profile.cursor_image ? (
                      <button
                        type="button"
                        onClick={() => updateProfile("cursor_image", "")}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-semibold transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => cursorInputRef.current?.click()}
                        disabled={cursorUploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition"
                      >
                        {cursorUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>Upload Cursor</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Column */}
        <div className={`space-y-2.5 ${showPreviewMobile ? "block" : "hidden xl:block"}`}>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Live Preview</h3>
            <span className="text-[10px] text-zinc-500">Real-time simulation</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d14] shadow-2xl">
            <ProfilePreview data={previewData} embedded={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
