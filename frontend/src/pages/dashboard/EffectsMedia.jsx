import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import { useEditGate } from "@/hooks/useEditGate";
import {
  BACKGROUND_EFFECTS, OVERLAYS, TEXT_EFFECTS, CURSOR_EFFECTS, AVATAR_EFFECTS
} from "@/constants/effects";
import { ColorPicker } from "@/components/ColorPicker";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ProfilePreview } from "@/components/ProfilePreview";
import { BackgroundEffect } from "@/components/BackgroundEffect";
import { OverlayEffect } from "@/components/OverlayEffect";
import { FxText } from "@/components/FxText";
import {
  Sparkles, Layers, Type, MousePointer2, Music, Save, RotateCcw,
  Upload, Trash2, Check, Lock, Loader2, Eye
} from "lucide-react";

const TABS = [
  { id: "background", label: "Background", icon: Layers },
  { id: "overlays", label: "Overlays", icon: Sparkles },
  { id: "text", label: "Text Effects", icon: Type },
  { id: "cursor", label: "Cursor & Media", icon: MousePointer2 },
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
        headers: { "Content-Type": "multipart/form-data" }
      });
      updateProfile("background_audio_url", data.url);
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
        headers: { "Content-Type": "multipart/form-data" }
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
    <div className="space-y-6 pb-20" data-testid="effects-media-page">
      {/* Header bar */}
      <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/15 border border-brand-400/25 text-brand-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Effects / Media
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Refined background dynamics, particle overlays, typographic effects, and audio ambience.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPreviewMobile((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] lg:hidden cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-brand-300" />
            {showPreviewMobile ? "Hide Preview" : "Show Preview"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-testid="save-effects-btn"
            className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 px-5 sm:px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/20 active:scale-95 disabled:opacity-50 transition cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Live Preview on Right */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Controls Column */}
        <div className="space-y-5">
          {/* Tabs navigation */}
          <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-1.5 scrollbar-none shadow-lg">
            {TABS.map((t) => {
              const active = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  data-testid={`effects-tab-${t.id}`}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                    active
                      ? "bg-brand-500/20 text-white border border-brand-500/40 shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
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
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-7 space-y-6 shadow-2xl">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight uppercase">Background Effect</h3>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Select a smooth, hardware-accelerated ambient effect running behind your profile.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {BACKGROUND_EFFECTS.map((eff) => {
                  const active = (profile.background_effect || "") === eff.id;
                  const locked = eff.premium && !isPremium;
                  return (
                    <button
                      key={eff.id || "none"}
                      type="button"
                      onClick={() => !locked && updateProfile("background_effect", eff.id)}
                      data-testid={`bg-effect-${eff.id || "none"}`}
                      className={`relative flex items-center justify-between rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                        active
                          ? "border-brand-500/60 bg-brand-500/15 text-white shadow-[0_0_20px_rgba(164,141,244,0.25)]"
                          : locked
                            ? "border-white/[0.04] bg-black/30 text-zinc-600 cursor-not-allowed"
                            : "border-white/[0.07] bg-white/[0.02] text-zinc-300 hover:border-brand-500/40 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="truncate text-xs font-semibold">{eff.label}</span>
                      {locked ? (
                        <Lock className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
                      ) : active ? (
                        <Check className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-300 font-semibold">
                    <span>Background Dim (Darkness)</span>
                    <span className="font-mono text-brand-400 font-bold">{profile.bg_dim ?? 50}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[Number(profile.bg_dim ?? 50)]}
                    onValueChange={([v]) => updateProfile("bg_dim", v)}
                    className="[&_[role=slider]]:border-brand-400/60 [&_[role=slider]]:bg-brand-500 [&_.absolute]:bg-brand-500"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-300 font-semibold">
                    <span>Background Media Opacity</span>
                    <span className="font-mono text-brand-400 font-bold">{profile.bg_opacity ?? 100}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[Number(profile.bg_opacity ?? 100)]}
                    onValueChange={([v]) => updateProfile("bg_opacity", v)}
                    className="[&_[role=slider]]:border-brand-400/60 [&_[role=slider]]:bg-brand-500 [&_.absolute]:bg-brand-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="text-xs font-semibold text-zinc-300">Background Base Color</span>
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
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-7 space-y-6 shadow-2xl">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight uppercase">Screen Overlays</h3>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Subtle film grain, scanlines, weather, and spotlight effects layered over your canvas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {OVERLAYS.map((ov) => {
                  const active = (profile.overlay || "") === ov.id;
                  const locked = ov.premium && !isPremium;
                  return (
                    <button
                      key={ov.id || "none"}
                      type="button"
                      onClick={() => !locked && updateProfile("overlay", ov.id)}
                      data-testid={`overlay-opt-${ov.id || "none"}`}
                      className={`relative flex items-center justify-between rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                        active
                          ? "border-brand-500/60 bg-brand-500/15 text-white shadow-[0_0_20px_rgba(164,141,244,0.25)]"
                          : locked
                            ? "border-white/[0.04] bg-black/30 text-zinc-600 cursor-not-allowed"
                            : "border-white/[0.07] bg-white/[0.02] text-zinc-300 hover:border-brand-500/40 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="truncate text-xs font-semibold">{ov.label}</span>
                      {locked ? (
                        <Lock className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
                      ) : active ? (
                        <Check className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-300 font-semibold">
                    <span>Overlay Opacity</span>
                    <span className="font-mono text-brand-400 font-bold">{profile.overlay_opacity ?? 100}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[Number(profile.overlay_opacity ?? 100)]}
                    onValueChange={([v]) => updateProfile("overlay_opacity", v)}
                    className="[&_[role=slider]]:border-brand-400/60 [&_[role=slider]]:bg-brand-500 [&_.absolute]:bg-brand-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">Color Overlay Tint</div>
                    <div className="text-[11px] text-zinc-500">Apply an ambient color wash over the whole profile</div>
                  </div>
                  <Switch
                    checked={profile.overlay_enabled === true}
                    onCheckedChange={(c) => updateProfile("overlay_enabled", c)}
                    className="data-[state=checked]:bg-brand-500"
                  />
                </div>

                {profile.overlay_enabled && (
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                    <span className="text-xs font-semibold text-zinc-300">Overlay Tint Color</span>
                    <ColorPicker
                      value={profile.overlay_color || profile.accent_color || "#A48DF4"}
                      onChange={(hex) => updateProfile("overlay_color", hex)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TEXT EFFECTS */}
          {activeTab === "text" && (
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-7 space-y-6 shadow-2xl">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight uppercase">Typography & Text FX</h3>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Select smooth text animations and glow effects for your display name and bio.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-white tracking-tight uppercase">Display Name Effect</label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 max-h-56 overflow-y-auto pr-1">
                  {TEXT_EFFECTS.map((tf) => {
                    const active = (profile.name_effect || "") === tf.id;
                    const locked = tf.premium && !isPremium;
                    return (
                      <button
                        key={tf.id || "none"}
                        type="button"
                        onClick={() => !locked && updateProfile("name_effect", tf.id)}
                        className={`flex items-center justify-between rounded-2xl border p-3 text-xs font-medium transition cursor-pointer ${
                          active
                            ? "border-brand-500/60 bg-brand-500/15 text-white shadow-[0_0_20px_rgba(164,141,244,0.25)]"
                            : locked
                              ? "border-white/[0.04] bg-black/30 text-zinc-600 cursor-not-allowed"
                              : "border-white/[0.07] bg-white/[0.02] text-zinc-300 hover:border-brand-500/40 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <span className="truncate">{tf.label}</span>
                        {locked ? <Lock className="h-3 w-3 text-amber-500/80" /> : active ? <Check className="h-3 w-3 text-brand-400" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">Name Glow Effect</div>
                    <div className="text-[11px] text-zinc-500">Luminescent halo around your display name</div>
                  </div>
                  <Switch
                    checked={profile.name_glow !== false}
                    onCheckedChange={(c) => updateProfile("name_glow", c)}
                    className="data-[state=checked]:bg-brand-500"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">Apply Effect to @username</div>
                    <div className="text-[11px] text-zinc-500">Mirror the name effect onto your handle</div>
                  </div>
                  <Switch
                    checked={profile.use_name_effect_on_alias === true}
                    onCheckedChange={(c) => updateProfile("use_name_effect_on_alias", c)}
                    className="data-[state=checked]:bg-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CURSOR & MEDIA */}
          {activeTab === "cursor" && (
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-7 space-y-6 shadow-2xl">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight uppercase">Cursor Particles & Trail</h3>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Select particle trails that follow the visitor's cursor across your profile.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {CURSOR_EFFECTS.map((cf) => {
                  const active = (profile.cursor_effect || "") === cf.id;
                  const locked = cf.premium && !isPremium;
                  return (
                    <button
                      key={cf.id || "none"}
                      type="button"
                      onClick={() => !locked && updateProfile("cursor_effect", cf.id)}
                      className={`flex items-center justify-between rounded-2xl border p-3 text-xs font-medium transition cursor-pointer ${
                        active
                          ? "border-brand-500/60 bg-brand-500/15 text-white shadow-[0_0_20px_rgba(164,141,244,0.25)]"
                          : locked
                            ? "border-white/[0.04] bg-black/30 text-zinc-600 cursor-not-allowed"
                            : "border-white/[0.07] bg-white/[0.02] text-zinc-300 hover:border-brand-500/40 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="truncate">{cf.label}</span>
                      {locked ? <Lock className="h-3 w-3 text-amber-500/80" /> : active ? <Check className="h-3 w-3 text-brand-400" /> : null}
                    </button>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* Live Preview Column */}
        <div className={`space-y-3 ${showPreviewMobile ? "block" : "hidden lg:block"}`}>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Live Preview</h3>
            <span className="font-mono text-[10px] text-zinc-500">Real-time simulation</span>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c0d14] shadow-[0_25px_80px_rgba(0,0,0,0.9)]">
            <ProfilePreview data={previewData} embedded={true} />
      </div>
    </div>
  );
}
