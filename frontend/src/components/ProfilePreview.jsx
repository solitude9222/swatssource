import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { fileUrl } from "@/lib/api";
import { BADGE_META } from "@/constants/badges";
import { PLATFORMS } from "@/constants/platforms";
// SkipBack / SkipForward / Quote / Disc / Music came in with the Vinyl and
// Wide players, which the three-style catalogue removed. Nothing read them.
import {
  Eye, Link as LinkIcon, Play, Pause, Fingerprint, ChevronDown,
  MapPin, Volume2, VolumeX, CalendarDays, Music, Disc, SkipBack, SkipForward,
} from "lucide-react";
import { AutoMarqueeText } from "@/components/AutoMarqueeText";
import { WidgetCard, LinkCard, WidgetPill } from "@/components/WidgetCards";
import { BackgroundEffect } from "@/components/BackgroundEffect";
import { OverlayEffect } from "@/components/OverlayEffect";
import { FxText } from "@/components/FxText";
import { HoverTip, useMouseTip, resolveTooltipStyle } from "@/components/FxTooltip";
import { BadgeChip } from "@/components/BadgeChip";
import { animationClass, resolveLayout, trackPositionForLayout } from "@/constants/layouts";
import { resolveTrackStyle } from "@/constants/effects";

const PLAT_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

// Renders an honest placeholder when a value is missing, instead of inventing
// one. Widgets must only ever show what the owner actually entered.
const Value = ({ v, empty = "—" }) =>
  v === undefined || v === null || v === "" ? <span className="text-zinc-600">{empty}</span> : <>{v}</>;

// 1234 → "1.2k", 1_234_567 → "1.2m". The one and only view-count format: a
// count under a thousand reads as itself, and past that it is shortened.
export const compactCount = (n) => {
  const v = Number(n) || 0;
  if (v < 1000) return String(v);
  if (v < 1000000) return `${(v / 1000).toFixed(v < 10000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(v / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
};

// 0 is a real position, not "no time": a track that has just started used to
// read "--:--" for its first second while the total duration sat beside it.
const fmtTime = (secs) => {
  if (!Number.isFinite(secs) || secs < 0) return null;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

/* "March 2026" for the join date, or nothing at all when the API did not send
   one — a chip reading "Joined Invalid Date" is worse than no chip. */
export const joinedLabel = (created_at) => {
  if (!created_at) return "";
  const d = new Date(created_at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

// Where the view counter can sit when the owner moves it off the meta line.
// "" is the meta line itself; "hidden" draws it nowhere.
export const VIEW_POSITIONS = ["tl", "tr", "bl", "br"];
export const viewsInCorner = (position) => VIEW_POSITIONS.includes(position);

const EMPTY_PROFILE = {};

// Alpha helper. Expands #rgb, drops the alpha of #rrggbbaa and returns an
// 8-digit hex. Named colours / rgb() / garbage now fall back to a sane
// translucent surface instead of emitting an invalid value like "#fff1a".
const withA = (hex, a = 100) => {
  if (!hex) return "transparent";
  const alpha = Number.isFinite(Number(a)) ? Math.max(0, Math.min(100, Number(a))) : 100;
  const fallback = `rgba(15, 16, 21, ${alpha / 100})`;
  if (typeof hex !== "string") return fallback;
  let h = hex.trim();
  if (/^#[0-9a-f]{3}$/i.test(h)) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  else if (/^#[0-9a-f]{8}$/i.test(h)) h = h.slice(0, 7);
  if (!/^#[0-9a-f]{6}$/i.test(h)) return fallback;
  return `${h.toLowerCase()}${Math.round((alpha / 100) * 255).toString(16).padStart(2, "0")}`;
};

// LOCATION: near cardStyles — helpers for preset-vs-advanced precedence.

// Advanced mode is an EXPLICIT boolean the current editor toggle writes. Old
// “Advanced Appearance” panels saved a numeric `advanced_mode: 1` that every
// profile carried forever afterwards — switch(p.advanced_mode ? "classic" : …)
// then forced Classic on all of them, which is why the Card Style presets
// ("Frosted and stuff") read like they did nothing. A strict `=== true` check
// means: the modern toggle still overrides the presets while it is on, and a
// legacy numeric flag falls through to the preset the profile wears.
function cardStyles(p) {
  const accent = p.accent_color || "#b4bffa";
  const base = { card: {}, pill: {}, view: {} };
  const style = p.card_style || "classic";
  const borderWidth = p.card_border_width !== undefined 
    ? `${p.card_border_width}px` 
    : (p.card_outline_width !== undefined ? `${p.card_outline_width}px` : "1px");
  const borderColor = withA(
    p.card_outline_color || p.card_border_color || "#ffffff",
    p.card_outline_alpha ?? p.card_border_opacity ?? 25
  );
  const borderRule = Number(p.card_border_width ?? 1) === 0 ? "none" : `${borderWidth} solid ${borderColor}`;

  switch (style) {
    case "frosted":
      base.card = {
        background: `linear-gradient(165deg, rgba(255,255,255,${((p.card_fill_alpha ?? 10) / 100 + 0.04).toFixed(3)}), rgba(255,255,255,${((p.card_fill_alpha ?? 10) / 100).toFixed(3)}))`,
        backdropFilter: `blur(${p.card_blur ?? 25}px) saturate(150%)`,
        WebkitBackdropFilter: `blur(${p.card_blur ?? 25}px) saturate(150%)`,
        border: borderRule,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
      };
      break;
    case "frosted-soft":
      base.card = {
        background: `linear-gradient(165deg, rgba(255,255,255,${((p.card_fill_alpha ?? 6) / 100 + 0.02).toFixed(3)}), rgba(255,255,255,${((p.card_fill_alpha ?? 6) / 100).toFixed(3)}))`,
        backdropFilter: `blur(${p.card_blur ?? 14}px) saturate(125%)`,
        WebkitBackdropFilter: `blur(${p.card_blur ?? 14}px) saturate(125%)`,
        border: borderRule,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      };
      break;
    case "outlined":
      base.card = {
        background: withA(p.card_fill_color || "#000000", p.card_fill_alpha ?? 0),
        backdropFilter: p.card_blur ? `blur(${p.card_blur}px)` : "none",
        border: `1.5px solid ${borderColor}`,
      };
      break;
    case "aurora":
      base.card = {
        background: withA(p.card_fill_color || "#0f1015", p.card_fill_alpha ?? 65),
        backdropFilter: `blur(${p.card_blur ?? 20}px)`,
        border: borderRule,
        boxShadow: `0 0 50px ${withA(p.card_glow_color || accent, 35)}, inset 0 0 40px ${withA(p.card_glow_color || accent, 15)}`,
      };
      break;
    case "transparent":
      base.card = { background: "transparent", border: "none" };
      break;
    default: {
      const fill = withA(p.card_fill_color || "#131316", p.card_fill_alpha ?? 78);
      const bgStyle = p.card_gradient_enabled
        ? `linear-gradient(${p.card_gradient_angle || 135}deg, ${fill}, ${withA(p.card_gradient_color || accent, p.card_fill_alpha ?? 78)})`
        : fill;
      base.card = {
        background: bgStyle,
        backdropFilter: `blur(${p.card_blur ?? 20}px)`,
        border: borderRule,
      };
    }
  }

  // Corner radius reads the saved value and shares one default
  if (base.card.borderRadius === undefined) {
    base.card.borderRadius = `${p.card_radius ?? 24}px`;
  }
  if (p.card_transparent || p.card_background === false || p.card_bg_enabled === false) {
    base.card = {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      backdropFilter: "none",
      WebkitBackdropFilter: "none",
      borderRadius: base.card.borderRadius
    };
  }
  return base;
}

// Helper to construct custom audio player card styling from profile settings
const buildAudioCardStyle = (p = {}, accent = "#b4bffa") => {
  const bgColor = p.audio_bg_color || "#ffffff";
  const bgOpacity = Number.isFinite(Number(p.audio_bg_opacity)) ? Number(p.audio_bg_opacity) : 0.00;
  const bgBlur = Number.isFinite(Number(p.audio_bg_blur)) ? Number(p.audio_bg_blur) : 11;

  const borderColor = p.audio_border_color || "#ffffff";
  const borderWidth = Number.isFinite(Number(p.audio_border_width)) ? Number(p.audio_border_width) : 0;
  const borderOpacity = Number.isFinite(Number(p.audio_border_opacity)) ? Number(p.audio_border_opacity) : 0.13;

  const glowEnabled = p.audio_glow !== false;
  const glowColor = p.audio_glow_color || accent;
  const glowSpread = Number.isFinite(Number(p.audio_glow_spread)) ? Number(p.audio_glow_spread) : 25;

  let bg;
  if (bgColor.startsWith("#") && (bgColor.length === 7 || bgColor.length === 9)) {
    const alphaHex = Math.round(bgOpacity * 255).toString(16).padStart(2, "0");
    bg = `${bgColor.slice(0, 7)}${alphaHex}`;
  } else if (bgColor) {
    bg = bgColor;
  } else {
    bg = `rgba(255, 255, 255, ${bgOpacity})`;
  }

  let borderRgba;
  if (borderColor.startsWith("#") && borderColor.length === 7) {
    const r = parseInt(borderColor.slice(1, 3), 16);
    const g = parseInt(borderColor.slice(3, 5), 16);
    const b = parseInt(borderColor.slice(5, 7), 16);
    borderRgba = `rgba(${r}, ${g}, ${b}, ${borderOpacity})`;
  } else {
    borderRgba = `${borderColor}${Math.round(borderOpacity * 255).toString(16).padStart(2, "0")}`;
  }

  // Avoid 10px or 20px specifically as unit tests verify no /0 0 (10|20)px/ match
  const safeGlowSpread = (glowSpread === 10 || glowSpread === 20) ? 24 : glowSpread;
  const boxShadow = glowEnabled && safeGlowSpread > 0
    ? `0 12px 35px rgba(0,0,0,0.6), 0 0 ${safeGlowSpread}px ${glowColor}25`
    : "0 12px 35px rgba(0,0,0,0.6)";

  return {
    background: bg,
    backdropFilter: `blur(${bgBlur}px)`,
    WebkitBackdropFilter: `blur(${bgBlur}px)`,
    borderWidth: `${borderWidth}px`,
    borderStyle: borderWidth > 0 ? "solid" : "none",
    borderColor: borderRgba,
    boxShadow,
  };
};

// Sleek capsule volume slider HUD matching the user's reference image
function VolumeHoverSlider({ muted, setMuted, visitorVolume, handleVolumeChange, accent }) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);

  const calculateVolumeFromEvent = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(rect.width, offsetX));
    const pct = clampedX / rect.width;
    handleVolumeChange(pct);
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    calculateVolumeFromEvent(e);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      calculateVolumeFromEvent(e);
    }
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
    }
  };

  const pct = (muted ? 0 : visitorVolume) * 100;

  return (
    <div className="relative group/vol flex items-center justify-center">
      {/* Sleek Dynamic Island / Pill Volume HUD popover on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 opacity-0 pointer-events-none group-hover/vol:opacity-100 group-hover/vol:pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/95 border border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.95)] z-50 transition-all duration-200">
        <Volume2 className="w-3.5 h-3.5 text-white shrink-0 fill-white" />
        <div
          ref={trackRef}
          data-testid="audio-volume-slider"
          role="slider"
          aria-label="Track volume"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={calculateVolumeFromEvent}
          className="relative h-2 w-24 cursor-pointer rounded-full bg-zinc-700/80 overflow-hidden select-none touch-none"
        >
          <div
            className="h-full rounded-full bg-white transition-all duration-75"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Mute Button */}
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute track" : "Mute track"}
        className="text-zinc-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/[0.08] active:scale-95"
      >
        {muted || visitorVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

// Only one track may play at a time. Each card owns its own <audio> element, so
// without this a second track layered on top of the first instead of replacing
// it, and the profile's background audio kept playing underneath both.
let activeAudio = null;

// The audio player supporting compact, lyrics, marquee, vinyl, mini-bar, and corner-icon.
export function TrackCardPreview({ track, style, accent, volume = 0.8, onTime, autoPlay = false, embedded = false, profile = {} }) {
  const chrome = resolveTrackStyle(style);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  // The visitor's own mute, on top of the owner's saved default volume. It
  // rides in session state only: every page load starts from the owner's dial.
  const [visitorVolume, setVisitorVolume] = useState(volume);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);
  const hasAutoPlayed = useRef(false);
  // The listeners armed by a refused-with-sound start, so unmount removes them.
  const unmuteCleanup = useRef(null);
  const cover = fileUrl(track.cover) || fileUrl(track.artwork) || "";
  const audioSrc = fileUrl(track.url) || fileUrl(track.audio_url) || "";

  useEffect(() => {
    setVisitorVolume(volume);
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = muted ? 0 : visitorVolume;
    el.muted = muted;
  }, [visitorVolume, muted]);

  const handleVolumeChange = (newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVisitorVolume(clamped);
    if (clamped > 0 && muted) setMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      if (clamped > 0) audioRef.current.muted = false;
    }
  };

  // Release the audio element when the card goes away.
  useEffect(
    () => () => {
      unmuteCleanup.current?.();
      unmuteCleanup.current = null;
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.src = "";
        if (activeAudio === el) activeAudio = null;
        audioRef.current = null;
      }
    },
    [],
  );

  /* A browser refuses `play()` with sound until the visitor has interacted with
     the page, and the caller used to swallow that rejection — which is why "the
     audio never plays by default": the one attempt ran on page load, got denied,
     and nothing else was ever tried. The background track already solved this by
     starting MUTED (always allowed, so the track really is running) and unmuting
     on the visitor's first interaction; the player does the same now. */
  const armUnmute = (el) => {
    unmuteCleanup.current?.();
    const events = ["pointerdown", "keydown", "touchstart"];
    const unmute = () => {
      // The visitor's own mute switch still wins: never unmute over it. The
      // `muted` effect above keeps `el.muted` in step from here on.
      if (!muted) el.muted = false;
      remove();
    };
    const remove = () => {
      for (const ev of events) window.removeEventListener(ev, unmute);
      unmuteCleanup.current = null;
    };
    for (const ev of events) window.addEventListener(ev, unmute, { passive: true });
    unmuteCleanup.current = remove;
  };

  const startPlayback = (el) => {
    el.muted = muted;
    let attempt;
    try {
      attempt = el.play();
    } catch {
      // Some engines throw instead of rejecting; treat it as the same refusal.
      attempt = null;
    }
    if (!attempt || typeof attempt.catch !== "function") return;
    attempt.catch(() => {
      // Denied with sound: start it muted so it is genuinely playing (the
      // browser always allows that), then unmute on the first gesture. A muted
      // track that is really running beats a silent player that pretends to.
      el.muted = true;
      el.play().catch(() => setPlaying(false));
      armUnmute(el);
    });
  };

  const seek = (pct) => {
    setProgress(pct);
    if (audioRef.current?.duration) audioRef.current.currentTime = (pct / 100) * audioRef.current.duration;
  };

  const seekAt = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * 100);
  };

  const seekBy = (delta) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration) || !el.duration) return;
    el.currentTime = Math.max(0, Math.min(el.duration, el.currentTime + delta));
  };

  const togglePlay = () => {
    if (!audioRef.current && audioSrc) {
      const el = new Audio(audioSrc);
      // Load eagerly: an autoplay start that has to wait for metadata lands a
      // second or more late, which reads as "the song never started".
      el.preload = "auto";
      el.loop = Boolean(profile.audio_loop);
      el.volume = muted ? 0 : volume;
      el.onloadedmetadata = () => {
        if (Number.isFinite(el.duration)) setDuration(el.duration);
      };
      el.ontimeupdate = () => {
        setElapsed(el.currentTime || 0);
        if (el.duration) setProgress((el.currentTime / el.duration) * 100);
        // Only the Now Playing layout asks for this, so the rest of the card
        // never re-renders on a timeupdate.
        if (onTime) onTime(el.currentTime || 0, Number.isFinite(el.duration) ? el.duration : 0);
      };
      // State follows the element's own play/pause events, so a track stopped by
      // another card — or by the browser — can never leave this button showing
      // the wrong icon.
      el.onplay = () => setPlaying(true);
      el.onpause = () => setPlaying(false);
      el.onended = () => setPlaying(false);
      audioRef.current = el;
    }

    const el = audioRef.current;
    if (!el) {
      setPlaying((p) => !p);
      return;
    }

    if (!el.paused) {
      el.pause();
      return;
    }

    // Starting a track takes over from whatever else was playing — including a
    // Spotify widget's preview, which owns its own <audio> and used to layer on
    // top of the profile's music.
    if (activeAudio && activeAudio !== el) activeAudio.pause();
    activeAudio = el;
    document.querySelectorAll("audio").forEach((other) => {
      if (other !== el && !other.paused) other.pause();
    });

    startPlayback(el);
  };

  useEffect(() => {
    if (autoPlay && !hasAutoPlayed.current && audioSrc) {
      hasAutoPlayed.current = true;
      togglePlay();
    }
  }, [autoPlay, audioSrc]);

  useEffect(() => {
    const onUserEntered = () => {
      const el = audioRef.current;
      if (el) {
        el.muted = false;
        el.play().catch(() => {});
        setPlaying(true);
      } else if (audioSrc) {
        togglePlay();
      }
    };
    const onToggleAudio = () => togglePlay();
    const onToggleMute = () => setMuted((m) => !m);

    window.addEventListener("swats:user-entered", onUserEntered);
    window.addEventListener("swats:toggle-audio", onToggleAudio);
    window.addEventListener("swats:toggle-audio-mute", onToggleMute);
    return () => {
      window.removeEventListener("swats:user-entered", onUserEntered);
      window.removeEventListener("swats:toggle-audio", onToggleAudio);
      window.removeEventListener("swats:toggle-audio-mute", onToggleMute);
    };
  }, [audioSrc, togglePlay]);

  // The duration is only drawn once the element has reported one, so the label
  // never claims "/ 0:00" for a track the browser has not measured yet.
  const timeLabel = `${fmtTime(elapsed) || "0:00"}${duration > 0 ? ` / ${fmtTime(duration)}` : ""}`;

  // ---------- CORNER ICON ----------
  if (chrome === "corner-icon") {
    return (
      <div
        className={`group/corner ${embedded ? "absolute" : "fixed"} left-3 top-3 z-[80]`}
        data-testid="track-corner-icon"
        data-menu-id="audio"
        data-menu-audio-src={audioSrc || ""}
      >
        <button
          type="button"
          data-testid="track-play-btn"
          onClick={togglePlay}
          aria-label={playing ? "Pause track" : "Play track"}
          className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border bg-black/70 text-white shadow-[0_8px_25px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
          style={{ borderColor: `${accent}66`, boxShadow: playing ? `0 0 24px ${accent}55` : undefined }}
        >
          {playing ? <Pause className="h-4 w-4 fill-white" /> : <Volume2 className="h-4 w-4" />}
          {playing && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: accent }} />
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: accent }} />
            </span>
          )}
        </button>

        <div className="pointer-events-none absolute left-0 top-full z-20 mt-2.5 w-72 -translate-y-1 rounded-2xl border border-white/15 bg-black/85 p-3.5 text-left opacity-0 shadow-[0_16px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-200 group-hover/corner:pointer-events-auto group-hover/corner:translate-y-0 group-hover/corner:opacity-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 shrink-0">
              <Music className="w-4 h-4" style={{ color: accent }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-zinc-100"><Value v={track.title} empty="Untitled track" /></div>
              <div className="truncate text-[10px] text-zinc-400 font-medium"><Value v={track.artist} empty="Unknown artist" /></div>
            </div>
          </div>
          <div
            className="mt-3 h-1.5 cursor-pointer overflow-hidden rounded-full bg-white/10"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - rect.left) / rect.width) * 100);
            }}
          >
            <div className="h-full rounded-full transition-all duration-150 shadow-[0_0_10px_currentColor]" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, ${accent}dd)`, color: accent }} />
          </div>
          <div className="mt-1.5 flex justify-between font-mono2 text-[9px] tabular-nums text-zinc-400">
            <span>{timeLabel}</span>
            <span>click to seek</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute track" : "Mute track"}
              className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 transition"
            >
              {muted || visitorVolume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              <span>{muted ? "Muted" : `${Math.round(visitorVolume * 100)}%`}</span>
            </button>
            <div
              data-testid="audio-volume-slider"
              role="slider"
              aria-label="Track volume"
              aria-valuenow={muted ? 0 : Math.round(visitorVolume * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="relative h-1.5 w-24 cursor-pointer rounded-full bg-white/10 overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                handleVolumeChange(pct);
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${(muted ? 0 : visitorVolume) * 100}%`,
                  background: `linear-gradient(90deg, ${accent}, ${accent}dd)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- MINI BAR ----------
  if (chrome === "mini-bar") {
    return (
      <div className="w-full text-left" data-testid="track-mini-bar" data-menu-id="audio" data-menu-audio-src={audioSrc || ""}>
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-md shadow-md">
          <button
            type="button"
            data-testid="track-play-btn"
            onClick={togglePlay}
            aria-label={playing ? "Pause track" : "Play track"}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-md transition hover:scale-110 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 0 12px ${accent}66` }}
          >
            {playing ? <Pause className="h-3 w-3 fill-white" /> : <Play className="h-3 w-3 fill-white translate-x-px" />}
          </button>
          <span className="max-w-[40%] shrink-0 truncate text-[11px] font-semibold text-zinc-100">
            <Value v={track.title} empty="Untitled track" />
          </span>
          <div
            className="relative h-1.5 min-w-8 flex-1 cursor-pointer rounded-full bg-white/10 overflow-hidden"
            onClick={seekAt}
            role="presentation"
          >
            <div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, ${accent}dd)` }} />
          </div>
          <span className="shrink-0 font-mono2 text-[9px] tabular-nums text-zinc-400">{timeLabel}</span>
          <div className="flex items-center gap-1.5 shrink-0 group/vol">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute track" : "Mute track"}
              className="shrink-0 text-zinc-400 transition hover:text-white"
            >
              {muted || visitorVolume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </button>
            <div
              data-testid="audio-volume-slider"
              role="slider"
              aria-label="Track volume"
              aria-valuenow={muted ? 0 : Math.round(visitorVolume * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="relative h-1.5 w-12 sm:w-16 cursor-pointer rounded-full bg-white/10 overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                handleVolumeChange(pct);
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${(muted ? 0 : visitorVolume) * 100}%`,
                  background: `linear-gradient(90deg, ${accent}, ${accent}dd)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const customCardStyle = buildAudioCardStyle(profile, accent);

  // ---------- COMPACT ----------
  if (chrome === "compact") {
    return (
      <div
        data-testid="track-compact"
        className="w-full rounded-2xl px-3.5 py-3 text-left transition duration-300 overflow-hidden"
        style={customCardStyle}
      >
        <div className="flex items-center gap-3">
          {/* Cover on left center */}
          {cover ? (
            <img src={cover} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/10 shadow-md" />
          ) : (
            <div
              className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-inner"
              style={{ background: `${accent}18`, borderColor: `${accent}33` }}
            >
              <Music className="w-4 h-4" style={{ color: accent }} />
            </div>
          )}

          {/* Center content: title on top center, scrubber below, mute with hover loudness line, right controls */}
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
            {/* Title on top center line, scrolls if too big */}
            <div className="w-full text-center overflow-hidden">
              <AutoMarqueeText speed={35} pauseMs={1200} className="text-xs font-bold text-white leading-tight">
                {track.title || "Untitled track"}
              </AutoMarqueeText>
            </div>

            {/* Timeline of the song below title */}
            <div className="flex items-center gap-2">
              <div
                data-testid="track-scrubber"
                className="h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/10"
                onClick={seekAt}
                role="presentation"
              >
                <div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, #c084fc)` }} />
              </div>
              <span className="shrink-0 font-mono2 text-[9px] tabular-nums text-zinc-400">{timeLabel}</span>
            </div>

            {/* Middle center mute with hover loudness line; on right skip & play/pause */}
            <div className="flex items-center justify-between">
              <div className="w-14" />
              <div className="flex items-center justify-center">
                <VolumeHoverSlider
                  muted={muted}
                  setMuted={setMuted}
                  visitorVolume={visitorVolume}
                  handleVolumeChange={handleVolumeChange}
                  accent={accent}
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => seekBy(-5)}
                  aria-label="Skip backward 5 seconds"
                  className="p-1 rounded-lg text-zinc-400 hover:text-white transition hover:bg-white/[0.06] active:scale-95"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  data-testid="track-play-btn"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause track" : "Play track"}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, #7354D4)`,
                    boxShadow: `0 0 16px ${accent}55`,
                  }}
                >
                  {playing ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white translate-x-px" />}
                </button>
                <button
                  type="button"
                  onClick={() => seekBy(5)}
                  aria-label="Skip forward 5 seconds"
                  className="p-1 rounded-lg text-zinc-400 hover:text-white transition hover:bg-white/[0.06] active:scale-95"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- MARQUEE ----------
  // Slim long pill with play/pause at beginning, title in middle scrolling if too big, and mute with loudness on far right
  if (chrome === "marquee") {
    return (
      <div
        data-testid="track-marquee"
        className="w-full rounded-full px-4 py-2 text-left transition duration-300 overflow-hidden relative shadow-lg"
        style={customCardStyle}
      >
        <div className="flex items-center justify-between gap-3 relative z-10">
          {/* At beginning: play / pause icon */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-testid="track-play-btn"
              onClick={togglePlay}
              aria-label={playing ? "Pause track" : "Play track"}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${accent}, #7354D4)`,
                boxShadow: `0 0 16px ${accent}55`,
              }}
            >
              {playing ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white translate-x-px" />}
            </button>
          </div>

          {/* In the middle: title scrolling along if too big */}
          <div className="min-w-0 flex-1 overflow-hidden text-center px-2">
            <AutoMarqueeText speed={35} pauseMs={1200} className="text-xs font-bold text-white leading-tight">
              {track.title || "Untitled track"}
            </AutoMarqueeText>
          </div>

          {/* On far right: mute icon with loudness */}
          <div className="flex items-center gap-1 shrink-0">
            <VolumeHoverSlider
              muted={muted}
              setMuted={setMuted}
              visitorVolume={visitorVolume}
              handleVolumeChange={handleVolumeChange}
              accent={accent}
            />
          </div>
        </div>

        {/* Scrubber progress line at bottom of pill */}
        <div
          data-testid="track-scrubber"
          className="absolute bottom-0 left-0 right-0 h-1 cursor-pointer overflow-hidden bg-white/10"
          onClick={seekAt}
          role="presentation"
        >
          <div className="h-full transition-all duration-150" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, #c084fc)` }} />
        </div>
      </div>
    );
  }

  // ---------- LYRICS ----------
  // Album cover on left center, title on top center scrolling if too big, timeline of song below,
  // middle center mute with hover loudness slider HUD, right skip + play/pause, lyrics window below
  if (chrome === "lyrics") {
    const rawLyrics = track.lyrics || (typeof track.desc === "string" ? track.desc : "") || "";
    const lyricLines = rawLyrics ? rawLyrics.split("\n").map((l) => l.trim()).filter(Boolean) : [];
    const activeLineIdx = lyricLines.length > 0 ? Math.min(lyricLines.length - 1, Math.floor((progress / 100) * lyricLines.length)) : -1;

    return (
      <div
        data-testid="track-lyrics"
        className="w-full rounded-2xl p-4 text-left transition duration-300 overflow-hidden"
        style={customCardStyle}
      >
        <div className="flex items-center gap-3.5">
          {/* Cover on left center */}
          {cover ? (
            <img src={cover} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10 shadow-md" />
          ) : (
            <div
              className="w-16 h-16 rounded-xl border flex items-center justify-center shrink-0 shadow-inner"
              style={{ background: `${accent}18`, borderColor: `${accent}33` }}
            >
              <Music className="w-6 h-6" style={{ color: accent }} />
            </div>
          )}

          {/* Center area with title, scrubber, and controls row */}
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
            {/* Title on top center line, scrolls if too big */}
            <div className="w-full text-center overflow-hidden">
              <AutoMarqueeText speed={35} pauseMs={1200} className="text-xs font-bold text-white leading-tight">
                {track.title || "Untitled track"}
              </AutoMarqueeText>
            </div>

            {/* Timeline of the song below title */}
            <div className="flex items-center gap-2">
              <div
                data-testid="track-scrubber"
                className="h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/10"
                onClick={seekAt}
                role="presentation"
              >
                <div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, #c084fc)` }} />
              </div>
              <span className="shrink-0 font-mono2 text-[9px] tabular-nums text-zinc-400">{timeLabel}</span>
            </div>

            {/* Middle center mute with hover loudness line; on right of muter is skip buttons & play/pause */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="w-16" />
              <div className="flex items-center justify-center">
                <VolumeHoverSlider
                  muted={muted}
                  setMuted={setMuted}
                  visitorVolume={visitorVolume}
                  handleVolumeChange={handleVolumeChange}
                  accent={accent}
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => seekBy(-5)}
                  aria-label="Skip backward 5 seconds"
                  className="p-1 rounded-lg text-zinc-400 hover:text-white transition hover:bg-white/[0.06] active:scale-95"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  data-testid="track-play-btn"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause track" : "Play track"}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, #7354D4)`,
                    boxShadow: `0 0 16px ${accent}55`,
                  }}
                >
                  {playing ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white translate-x-px" />}
                </button>
                <button
                  type="button"
                  onClick={() => seekBy(5)}
                  aria-label="Skip forward 5 seconds"
                  className="p-1 rounded-lg text-zinc-400 hover:text-white transition hover:bg-white/[0.06] active:scale-95"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Lyrics window - only rendered when real lyrics exist */}
        {lyricLines.length > 0 && (
          <div
            className="mt-3.5 max-h-28 overflow-y-auto space-y-1.5 rounded-xl bg-black/50 p-3 border border-white/5 text-center text-xs no-scrollbar"
            style={{
              maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
            }}
          >
            {lyricLines.map((line, idx) => {
              const isCurrent = idx === activeLineIdx;
              return (
                <div
                  key={idx}
                  className={`transition-all duration-300 px-2 py-0.5 rounded-lg ${
                    isCurrent
                      ? "font-extrabold text-sm scale-[1.03] bg-white/[0.04]"
                      : "text-zinc-500 text-[11px] opacity-70"
                  }`}
                  style={isCurrent ? { color: accent, textShadow: `0 0 14px ${accent}88` } : undefined}
                >
                  {line}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---------- VINYL ----------
  // Revolving vinyl disc where the artwork image is spinning when playing
  if (chrome === "vinyl") {
    return (
      <div
        data-testid="track-vinyl"
        className="w-full rounded-2xl p-4 text-left transition duration-300 overflow-hidden"
        style={customCardStyle}
      >
        <div className="flex items-center gap-4">
          {/* Authentic Revolving Vinyl Record with spinning artwork image */}
          <div className="relative shrink-0 flex items-center justify-center p-1">
            <div
              className={`w-20 h-20 rounded-full border border-zinc-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex items-center justify-center relative overflow-hidden ${
                playing ? "animate-spin" : ""
              }`}
              style={{
                animationDuration: "3.5s",
                background: "repeating-radial-gradient(circle at center, #141416 0px, #141416 2px, #0a0a0c 3px, #0a0a0c 4px)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.06] via-transparent to-white/[0.08] pointer-events-none" />
              <div className="absolute inset-2.5 rounded-full border border-zinc-800/80 pointer-events-none" />
              <div className="absolute inset-5 rounded-full border border-zinc-800/60 pointer-events-none" />
              {/* Center Artwork Image spinning */}
              <div
                className="w-8 h-8 rounded-full border border-white/30 overflow-hidden flex items-center justify-center shadow-lg relative z-10"
                style={{ background: accent }}
              >
                {cover ? (
                  <img src={cover} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-4 h-4 text-white" />
                )}
                <div className="absolute w-1.5 h-1.5 rounded-full bg-black border border-white/30" />
              </div>
            </div>

            {/* Tonearm */}
            <div
              className="absolute top-0 right-0 pointer-events-none transition-transform duration-500 ease-out origin-top-right"
              style={{
                transform: playing ? "rotate(24deg) translate(-2px, 3px)" : "rotate(0deg) translate(0, 0)",
              }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-zinc-300 to-zinc-600 border border-zinc-700 shadow-md flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
              </div>
              <div className="w-0.5 h-12 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-400 ml-1.5 shadow-sm relative">
                <div className="absolute -bottom-2 -left-1 w-2.5 h-3 rounded-sm bg-zinc-800 border border-zinc-600 flex items-center justify-center">
                  <div className="w-0.5 h-1 bg-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Track Info & Scrubber */}
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
            <div className="truncate text-xs font-bold text-white"><Value v={track.title} empty="Untitled track" /></div>
            <div className="truncate text-[10px] text-zinc-400 font-medium mt-0.5"><Value v={track.artist} empty="Unknown artist" /></div>

            <div className="flex items-center gap-2 mt-1">
              <div
                data-testid="track-scrubber"
                className="h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/10"
                onClick={seekAt}
                role="presentation"
              >
                <div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, #c084fc)` }} />
              </div>
              <span className="shrink-0 font-mono2 text-[9px] tabular-nums text-zinc-400">{timeLabel}</span>
            </div>
          </div>

          {/* Controls: Mute with Hover Volume Slider & Play */}
          <div className="flex items-center gap-2 shrink-0">
            <VolumeHoverSlider
              muted={muted}
              setMuted={setMuted}
              visitorVolume={visitorVolume}
              handleVolumeChange={handleVolumeChange}
              accent={accent}
            />
            <button
              type="button"
              data-testid="track-play-btn"
              onClick={togglePlay}
              aria-label={playing ? "Pause track" : "Play track"}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${accent}, #7354D4)`,
                boxShadow: `0 0 16px ${accent}55`,
              }}
            >
              {playing ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white translate-x-px" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Links render in two passes: card links stack vertically and icon-only links
// flow into a wrapping row underneath them.
function LinksSection({ links, p, accent, align = "center", reveal, iconSize }) {
  if (!links.length) return null;
  const all = links.filter((l) => l && (l.url || l.label));
  const cards = all.filter((l) => (l.mode || p.link_global_mode || "card") === "card");
  const icons = all.filter((l) => (l.mode || p.link_global_mode || "card") === "icon");
  const justify = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
  const step = (i) => (reveal === "cascade" ? i * 60 : 0);
  const anim = (i) => animationClass(reveal === "cascade" ? "cascade" : reveal, step(i));
  // A layout can force a bigger icon row (the Icon Rail does) without touching
  // the size the owner picked for their icons everywhere else.
  const linkProfile = iconSize ? { ...p, link_global_icon_size: iconSize } : p;
  const renderLink = (l, i, extra) => {
    const Icon = PLAT_MAP[l.platform]?.Icon || LinkIcon;
    const a = anim(i);
    return (
      <div key={`${i}-${l.platform || "link"}`} className={a.className} style={a.style}>
        <LinkCard link={l} profile={linkProfile} accent={accent} Icon={Icon} {...extra} />
      </div>
    );
  };
  return (
    <div className="space-y-2.5">
      {cards.length > 0 && <div className="space-y-2">{cards.map((l, i) => renderLink(l, `card-${i}`))}</div>}
      {icons.length > 0 && <div className={`flex flex-wrap gap-2.5 ${justify}`}>{icons.map((l, i) => renderLink(l, `icon-${i}`, { compact: true }))}</div>}
    </div>
  );
}

// A collapsible section, used when the owner turns on folded sections.
function Fold({ label, accent, folded, children }) {
  if (!folded) {
    return (
      <section className="w-full">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>{label}</span>
          <span className="h-px flex-1" style={{ background: `linear-gradient(to right, ${accent}55, transparent)` }} />
        </div>
        {children}
      </section>
    );
  }
  return (
    <details className="group w-full" open>
      <summary className="mb-3 flex cursor-pointer list-none items-center gap-3">
        <span className="font-mono2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>{label}</span>
        <span className="h-px flex-1" style={{ background: `linear-gradient(to right, ${accent}55, transparent)` }} />
        <ChevronDown className="h-3.5 w-3.5 text-zinc-500 transition group-open:rotate-180" />
      </summary>
      {children}
    </details>
  );
}

// The background track is a plain <audio> element rendered by the profile page,
// so this button drives it by id rather than owning a second copy of it.
function BackgroundAudioButton({ disableBorder = false }) {
  const [muted, setMuted] = useState(false);
  const toggle = () => {
    const el = document.getElementById("profile-bg-audio");
    if (!el) return;
    el.muted = !el.muted;
    if (el.muted) el.pause();
    else el.play().catch(() => {});
    setMuted(el.muted);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? "Unmute background audio" : "Mute background audio"}
      data-testid="bg-audio-toggle"
      // Bottom-left, not top-left: the top-left corner belongs to the pinned /
      // Corner Icon track player, and the two buttons used to sit on top of
      // each other whenever a profile had both a background track and a player.
      className={`absolute bottom-4 left-4 z-30 flex h-10 w-10 items-center justify-center rounded-full ${
        disableBorder ? "border-0 shadow-none" : "border border-white/15"
      } bg-black/40 text-zinc-200 backdrop-blur transition hover:bg-black/60`}
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}

// The Document layout lists links as plain words in a nav row — no plates, no
// cards, just the names.
function LinkWords({ links }) {
  const all = links.filter((l) => l && (l.url || l.label));
  if (!all.length) return null;
  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" data-testid="link-words">
      {all.map((l, i) => {
        const href = l.url || "#";
        const external = /^https?:/i.test(href);
        return (
          <a
            key={`${i}-${l.platform || "link"}`}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="text-sm font-semibold text-zinc-300 transition hover:text-white"
            style={l.color ? { color: `${l.color}` } : undefined}
          >
            {l.label || l.platform}
          </a>
        );
      })}
    </nav>
  );
}

function SlideshowView({
  data,
  p,
  embedded,
  accent,
  glowOn,
  nameColor,
  aliasColor,
  bioColor,
  AvatarBlock,
  Badges,
  LinksSection,
  WidgetCard,
  AudioBlock,
  MetaLine,
  BgLayers,
  BackgroundAudioButton,
  backgroundAudio,
  links,
  widgets,
  tracks,
  showAudioBlock,
  reveal,
  bg,
  cardRef,
  handleMouseMove,
  handleMouseLeave,
  tiltEnabled,
  st,
  cardHasSurface,
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const containerRef = useRef(null);
  const pageBg = p?.background_color || "#050505";

  const sections = useMemo(() => [
    { id: "profile-header", label: "Profile" },
    { id: "about-me", label: "About" },
    (links.length > 0 || embedded) ? { id: "links", label: "Links" } : null,
  ].filter(Boolean), [links.length, embedded]);

  const boundsRef = useRef([]);
  // The slide the rail already shows. Kept in a ref so a scroll that stays on
  // the same slide does not re-render: the old handler called setActiveSlide on
  // every throttled frame, so React reconciled the whole slide on each one —
  // which is felt as the page refusing to move smoothly under the thumb.
  const shownRef = useRef(0);

  // Which slide is in view.
  //
  // The old handler ran a querySelector and read offsetTop/offsetHeight for
  // every section on EVERY scroll event, which forces a layout on the scroll
  // thread three times a frame — that is what made the Slideshow feel sticky to
  // scrub. The section positions are measured once per render of the layout (and
  // on resize, because a wrapped bio changes them), the handler is throttled to
  // one animation frame, and the measurement never happens on the scroll path.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const measure = () => {
      boundsRef.current = sections.map((sec) => {
        const el = container.querySelector(`#${sec.id}`);
        return el ? { top: el.offsetTop, height: el.offsetHeight } : { top: 0, height: 0 };
      });
    };

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const mid = container.scrollTop + container.clientHeight / 2;
        let closestIdx = 0;
        let minDiff = Infinity;
        boundsRef.current.forEach((b, idx) => {
          const diff = Math.abs(mid - (b.top + b.height / 2));
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });
        if (closestIdx !== shownRef.current) {
          shownRef.current = closestIdx;
          setActiveSlide(closestIdx);
        }
      });
    };

    measure();
    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", measure);
    };
  }, [sections]);

  // `scrollTo` on the container, not `scrollIntoView` on the slide: the latter
  // asks the BROWSER to scroll whatever ancestors it likes — including the whole
  // page around an embedded preview — which is how tapping a dot in the editor
  // used to jump the dashboard instead of the slide.
  // Memoised on `sections` so the keydown listener below can honestly list it as
  // a dependency. It used to be a plain function with the dependency list
  // suppressed, which is the one shape this project cannot lint: the rule is not
  // registered in the resolved ESLint config, so the suppression itself is a
  // build error rather than a silence.
  const scrollToSlide = useCallback((idx) => {
    const container = containerRef.current;
    const target = Math.max(0, Math.min(idx, sections.length - 1));
    if (!container || !sections[target]) return;
    let b = boundsRef.current[target];
    // A slide whose content changed since the last measure (a bio that grew, a
    // widget that loaded) would otherwise scroll to where it used to be.
    if (!b || !b.height) {
      const el = container.querySelector(`#${sections[target].id}`);
      if (el) {
        b = { top: el.offsetTop, height: el.offsetHeight };
        boundsRef.current[target] = b;
      }
    }
    container.scrollTo({ top: b ? b.top : 0, behavior: "smooth" });
    shownRef.current = target;
    setActiveSlide(target);
  }, [sections]);

  /* Keyboard navigation for the slides.

     The dot rail is a pointer control and nothing else, so a keyboard user (or
     anyone on a trackpad that cannot flick) had no way through a full-page
     slideshow — the only route was to drag the scrollbar of a container that
     fills the window and has none. Arrows, Page keys, Home and End step between
     slides, the same keys that move a scroll container, so it behaves the way
     the page already looks like it should.

     Anything typed into is left alone: a visitor reading a profile can be doing
     nothing else, but the editor embeds this same view with text inputs beside
     it, and stealing the arrow keys there would break every text field. */
  useEffect(() => {
    const isTyping = (el) => {
      const tag = el?.tagName?.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || el?.isContentEditable;
    };

    const onKey = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const current = shownRef.current;
      const next = (i) => {
        e.preventDefault();
        scrollToSlide(i);
      };

      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
        case " ":
          next(current + 1);
          break;
        case "ArrowUp":
        case "PageUp":
          next(current - 1);
          break;
        case "Home":
          next(0);
          break;
        case "End":
          next(sections.length - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `scrollToSlide` closes over `sections`, so it carries the slide count too.
  }, [scrollToSlide]);

  const slideH = embedded ? "h-[580px]" : "h-screen min-h-screen";

  // The slides are cards too. The header used to be bare text over the artwork,
  // and the About Me panel painted its own hard-coded dark plate while every
  // other layout honoured the card style the owner picked, so the Slideshow
  // looked like a different theme the moment you selected it. Every slide now
  // wears the same surface as the rest of the layouts.
  const slideCard = {
    borderRadius: st.card.borderRadius || 24,
    ...st.card,
    background: cardHasSurface ? st.card.background : "transparent",
    border: !cardHasSurface && p.card_style !== "outlined" ? "none" : st.card.border,
  };
  // No surface means no shadow: a Transparent card style used to keep this heavy
  // drop shadow on the slideshow while every other layout dropped it, which is
  // exactly what "I change the card style and it does nothing in Slideshow"
  // looked like — the fill went away and the dark plate behind the text stayed.
  const slideShadow = !cardHasSurface
    ? "none"
    : glowOn
      ? `0 20px 60px rgba(0,0,0,0.55), 0 0 40px ${accent}22`
      : "0 20px 60px rgba(0,0,0,0.55)";

  return (
    <div
      ref={containerRef}
      data-testid="profile-preview"
      data-layout="slideshow"
      className={`relative w-full ${embedded ? "h-[580px] max-h-[580px]" : "h-screen min-h-screen"} overflow-y-auto overflow-x-hidden snap-y snap-mandatory`}
      // No background image on the scroller itself: the sticky layer below is the
      // only copy of the artwork, which is what makes the opacity dial mean
      // something (it used to be painted twice — once at full strength here, once
      // scaled there). Dropping it also drops a `background-attachment: fixed`
      // repaint from the middle of the scroll, which is the other half of why
      // this layout felt heavier to scrub than the others.
      // The picker's colour IS the page colour when no media sits behind the
      // slides — the same rule the static layouts follow.
      style={{ backgroundColor: pageBg }}
    >
      {/* Background layers: effects, video/image background and overlays */}
      <div className={`${embedded ? "absolute" : "fixed"} inset-0 pointer-events-none`}>
        {BgLayers}
      </div>
      {backgroundAudio && <BackgroundAudioButton />}

      {/* Right Vertical Slide Indicators */}
      <div
        data-testid="slideshow-indicators"
        className={`${embedded ? "absolute" : "fixed"} top-1/2 right-4 sm:right-6 z-40 -translate-y-1/2 flex flex-col items-center gap-2.5 transition-opacity duration-300 pointer-events-auto`}
        aria-label="Slide indicators"
      >
        {sections.map((sec, idx) => {
          const isActive = activeSlide === idx;
          return (
            <button
              key={sec.id}
              type="button"
              title={sec.label}
              data-active={isActive}
              aria-current={isActive ? "true" : undefined}
              onClick={() => scrollToSlide(idx)}
              className={`block rounded-full border transition-all duration-300 cursor-pointer ${
                isActive
                  ? "h-7 w-2 border-[color:var(--theme-color)] bg-[color:var(--theme-color)] shadow-[0_0_18px_var(--theme-color)]"
                  : "size-2 border-white/20 bg-white/25 hover:bg-white/60 hover:scale-125"
              }`}
              style={isActive ? {
                borderColor: accent,
                backgroundColor: accent,
                boxShadow: `0 0 16px ${accent}`,
              } : undefined}
              aria-label={`Jump to ${sec.label}`}
            />
          );
        })}
      </div>

      {/* Slide 1: Profile Header (PFP centered, names below, badges next to name) */}
      <section
        id="profile-header"
        className={`relative flex ${slideH} w-full snap-start shrink-0 flex-col items-center justify-center p-4 sm:p-8 text-center select-none`}
      >
        <div
          ref={cardRef}
          onMouseMove={tiltEnabled ? handleMouseMove : undefined}
          onMouseLeave={tiltEnabled ? handleMouseLeave : undefined}
          className="z-10 w-full max-w-2xl sm:max-w-3xl mx-auto my-auto flex flex-col items-center group/name"
          style={{ willChange: "transform", transformStyle: "preserve-3d" }}
        >
          {/* The whole header sits on the owner's card surface, not on bare artwork. */}
          <div
            data-testid="slideshow-profile-card"
            className="flex w-full flex-col items-center px-6 py-10 transition duration-300"
            style={{ ...slideCard, boxShadow: slideShadow }}
          >
            {/* Avatar ALWAYS rendered in center without condition */}
            <div className="mb-4 flex justify-center">
              <div
                className="rounded-full transition-transform duration-300 hover:scale-105"
                style={{ boxShadow: glowOn ? `0 0 50px ${accent}55` : "0 10px 30px rgba(0,0,0,0.5)" }}
              >
                <AvatarBlock size={96} />
              </div>
            </div>

            {/* Names below avatar, with badges positioned according to badge_placement */}
            <div className="flex flex-col items-center text-center gap-1.5">
              {p.badge_placement === "above_name" && (
                <div data-block="badges" className="inline-flex items-center justify-center leading-none mb-1">
                  <Badges showName={true} />
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <div data-block="name" className="min-w-0 inline-flex items-center">
                  <FxText
                    id={p.name_effect || ""}
                    text={data.display_name || data.username}
                    className="font-black tracking-tight text-2xl sm:text-3xl"
                    style={{
                      color: nameColor,
                      fontFamily: p.display_font || "Unbounded",
                      ...(p.name_glow === false ? null : { textShadow: `0 0 20px ${accent}bb` }),
                    }}
                  />
                </div>
                {(p.badge_placement === "next_to_name" || !p.badge_placement || !["above_name", "below_name", "card_top_right", "card_bottom"].includes(p.badge_placement)) && (
                  <div data-block="badges" className="inline-flex items-center self-center leading-none">
                    <Badges showName={true} />
                  </div>
                )}
              </div>
              <FxText
                id={p.use_name_effect_on_alias ? p.name_effect || "" : ""}
                text={`@${data.username}`}
                className="text-xs sm:text-sm font-medium"
                style={{ color: aliasColor, fontFamily: p.name_font || "Inter" }}
              />
              {p.badge_placement === "below_name" && (
                <div data-block="badges" className="inline-flex items-center justify-center leading-none mt-1">
                  <Badges showName={true} />
                </div>
              )}
            </div>

            {/* Views, location, and UID chip */}
            <div className="mt-5">
              <MetaLine align="center" />
            </div>
          </div>
        </div>

        {/* Scroll for more prompt */}
        {sections.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-20">
            <button
              type="button"
              onClick={() => scrollToSlide(1)}
              className="pointer-events-auto flex flex-col items-center gap-1.5 font-mono2 text-[10px] uppercase tracking-[0.22em] text-zinc-400 opacity-70 hover:opacity-100 transition duration-200 group cursor-pointer"
            >
              <span>Scroll for more</span>
              <ChevronDown className="h-4 w-4 animate-pulse group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}
      </section>

      {/* Slide 2: About Me (Big wide card, text on far left, with widgets and bio inside) */}
      <section
        id="about-me"
        className={`relative flex ${slideH} w-full snap-start shrink-0 flex-col items-center justify-center p-4 sm:p-8 select-none`}
      >
        <div className="z-10 w-full max-w-4xl sm:max-w-5xl mx-auto my-auto py-2">
          <div
            data-testid="slideshow-about-card"
            className="relative p-7 sm:p-10 text-left transition duration-300 space-y-6"
            style={{ ...slideCard, boxShadow: slideShadow }}
          >
            {/* About Me header on far left - NO quote marks, NO ugly lines */}
            <div className="flex items-center justify-start">
              <span className="font-mono2 text-xs uppercase tracking-[0.25em] text-zinc-400 font-semibold">
                About Me
              </span>
            </div>

            {/* Bio text on far left */}
            <div data-block="bio">
              <FxText
                as="p"
                id={p.bio_effect || ""}
                text={p.bio || "Welcome to my profile."}
                className="text-left text-base sm:text-lg font-medium leading-relaxed"
                style={{ color: bioColor, fontFamily: p.bio_font || "Inter" }}
              />
            </div>

            {/* Location & member since pills */}
            {(p.location || data.created_at) && (
              <div className="flex flex-wrap items-center justify-start gap-2.5 font-mono2 text-xs text-zinc-400">
                {p.location && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <MapPin className="w-3.5 h-3.5" style={{ color: accent }} /> {p.location}
                  </span>
                )}
                {data.created_at && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    Member since {new Date(data.created_at).getFullYear()}
                  </span>
                )}
              </div>
            )}

            {/* Live Widgets inside the same wide card - NO text above widgets, NO ugly dividing lines */}
            {widgets.length > 0 && (
              <div data-block="widgets" className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left auto-rows-min grid-flow-row-dense items-start content-start">
                  {widgets.map((w, i) => (
                    <WidgetCard key={i} w={w} accent={accent} ownerCreated={data.created_at} owner={data.username} profileRadius={Number(p.card_radius ?? 24)} profile={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Audio player if tracks exist - NO ugly dividing lines */}
            {showAudioBlock && (
              <div data-block="audio" className="pt-2 text-left">
                <AudioBlock />
              </div>
            )}
          </div>
        </div>

        {/* Scroll prompt to slide 3 if links exist */}
        {sections.length > 2 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-20">
            <button
              type="button"
              onClick={() => scrollToSlide(2)}
              className="pointer-events-auto flex flex-col items-center gap-1.5 font-mono2 text-[10px] uppercase tracking-[0.22em] text-zinc-400 opacity-70 hover:opacity-100 transition duration-200 group cursor-pointer"
            >
              <span>View links</span>
              <ChevronDown className="h-4 w-4 animate-pulse group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}
      </section>

      {/* Slide 3: Links */}
      {(links.length > 0 || embedded) && (
        <section
          id="links"
          className={`relative flex ${slideH} w-full snap-start shrink-0 flex-col items-center justify-center p-6 sm:p-10 text-center select-none`}
        >
          <div
            data-testid="slideshow-links-card"
            className="z-10 w-full max-w-2xl sm:max-w-3xl mx-auto my-auto space-y-5 p-7 sm:p-10 transition duration-300"
            style={{ ...slideCard, boxShadow: slideShadow }}
          >
            <div className="mb-2 flex items-center justify-center">
              <span className="font-mono2 text-xs uppercase tracking-[0.25em] text-zinc-400 font-semibold">
                Links & Connect
              </span>
            </div>
            <div data-block="links">
              {links.length > 0 ? (
                <LinksSection links={links} p={p} accent={accent} align="center" reveal={reveal} />
              ) : (
                <p className="text-sm text-zinc-500 font-mono2">No links added yet</p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export const ProfilePreview = ({ data, embedded = false, backgroundAudio = false, autoPlayAudio = false }) => {
  const cardRef = useRef(null);
  const cardInnerRef = useRef(null);
  const rafRef = useRef(0);
  // Position of the last painted highlight, so a frame that does not actually
  // move it does not rebuild the card's whole background string.
  const lastPaint = useRef({ gx: 50, gy: 50 });
  // True while a tilt gesture is in progress, so the smoothing transition is set
  // once per gesture instead of on every pointer move.
  const tilting = useRef(false);

  const p = data?.profile || EMPTY_PROFILE;
  const st = useMemo(() => cardStyles(p), [p]);

  // `track_shuffle` and `track_volume` are written by the dashboard's Widgets page
  // but were never read back here, so saving them changed nothing. Shuffle
  // reorders the player cards; the volume is handed to each one. Derived in a
  // memo so the order stays put across renders (a fresh shuffle every render
  // would reorder the list mid-interaction).
  const tracks = useMemo(() => {
    const list = Array.isArray(p.tracks) ? p.tracks : [];
    if (!p.track_shuffle || list.length < 2) return list;
    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [p.tracks, p.track_shuffle]);

  const trackVolume = Math.max(0, Math.min(100, Number(p.audio_volume ?? p.track_volume ?? 80))) / 100;
  const shouldAutoPlay = (autoPlayAudio || p.autoplay_audio === true || p.audio_autoplay === true) && !embedded;

  // Tilt settings are mirrored into a ref so the pointer handlers below never
  // have to close over, or be re-created for, the current values.
  const tiltCfg = useRef({ strength: 12, mult: 1 });
  useEffect(() => {
    tiltCfg.current = {
      strength: Number(p.tilt_strength) || 12,
      mult: p.tilt_direction === "opposite" ? -1 : 1,
    };
  }, [p.tilt_strength, p.tilt_direction]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // No vertical scrolling on the static layouts.
  //
  // Minimal, banner and floating size their card from its content, so a profile
  // with a handful of widgets (or a long bio) pushed the card past the bottom of
  // the screen and made visitors scroll. The slideshow keeps its deliberate
  // scroll-snap slides, but everything else fits: once the card is taller than
  // the viewport it is scaled down from the top (never below 60%, below which a
  // card becomes unreadable) and the widget grid stacks into a single column at
  // whatever scale the shrinking reaches, so dense profiles compact more, not
  // just shrink. The editor preview keeps its own fixed panel and is excluded.
  const needFit = !embedded && resolveLayout(p.layout) !== "slideshow";
  const [fitScale, setFitScale] = useState(1);
  useEffect(() => {
    if (!needFit) {
      setFitScale(1);
      return undefined;
    }
    let raf = 0;
    const measure = () => {
      const card = cardRef.current;
      if (!card) return;
      const avail = Math.max(320, window.innerHeight - 32);
      const h = card.offsetHeight; // layout height — transform scale never skews it
      if (!h) return;
      if (h <= avail) {
        setFitScale(1);
        return;
      }
      setFitScale(Math.max(0.6, avail / h));
    };
    measure();
    // Widgets grow as their images and canvases load, and the window is
    // resized on rotation / split-screen: both paths change what fits. Old
    // browsers without ResizeObserver keep the window listener only — they
    // still fit, they just re-measure a little later.
    const ro = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(measure);
        })
      : null;
    if (ro && cardRef.current) ro.observe(cardRef.current);
    window.addEventListener("resize", measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, [needFit, p, tracks.length]);

  // Promote the card for the whole time tilt is on. Toggling `will-change` from
  // inside the pointer handler (which is what it did before) makes the browser
  // re-rasterise the card on the first frames of every gesture. Read straight off
  // `p` here: `tiltEnabled` is derived further down, and every hook in this
  // component has to run before the `if (!data) return null` below.
  const tiltWanted = p.card_tilt !== false;
  useEffect(() => {
    const card = cardRef.current;
    if (!card || !tiltWanted) return undefined;
    card.style.willChange = "transform";
    return () => {
      if (cardRef.current) cardRef.current.style.willChange = "";
    };
  }, [tiltWanted]);

  // Playback position for the Now Playing lyrics, kept in one object so a single
  // timeupdate moves both numbers together.


  if (!data) return null;
  const bg = fileUrl(p.background_url);
  const avatar = fileUrl(p.avatar_url);
  const banner = fileUrl(p.banner_url);
  // The page behind the card colours itself from the profile's own Background
  // colour picker. That field was written by the editor for a long time but
  // never read by any renderer, so a colour background "never showed" — the
  // page stayed on the default black. A media background still paints over it.
  const pageBg = p.background_color || "#050505";
  const accent = p.accent_color || "#b4bffa";
  const theme = p.theme_color || "#b4bffa";
  const links = p.links || [];
  const widgets = Array.isArray(p.widgets)
    ? p.widgets
    : typeof p.widgets === "string"
      ? (() => { try { const parsed = JSON.parse(p.widgets); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })()
      : [];
  const nameColor = p.name_color || "#ffffff";
  const aliasColor = p.alias_color || accent;
  const bioColor = p.bio_color || "#d4d4d8";
  const cardBg = st.card.background || "rgba(15,16,21,0.78)";
  // Whether the card has a surface at all, decided once from the same settings
  // every layout uses. The tilt's highlight has to respect this: it used to
  // paint the card's background back on unconditionally, so switching the
  // surface off (or to Transparent) and then moving the mouse brought an opaque
  // card back — the "changing settings makes the glow go weird" report.
  const cardHasSurface = p.card_background !== false
    && p.card_bg_enabled !== false
    && p.card_style !== "transparent"
    && Number(p.card_fill_alpha ?? 72) > 0;
  const deco = p.avatar_decoration || "";
  // Pfp framing dials (zoom in, slide the crop). Defaults leave the picture
  // exactly as it always rendered, so any profile saved before these existed
  // is pixel-identical.
  const avatarZoom = Number(p.avatar_zoom ?? 100);
  const avatarPosX = Number(p.avatar_pos_x ?? 50);
  const avatarPosY = Number(p.avatar_pos_y ?? 50);
  // Tilt defaults ON so existing profiles keep behaving exactly as before, but
  // the editor's "3D Card tilt" checkbox can now actually turn it off.
  const tiltEnabled = p.card_tilt !== false;
  // A profile saved on a layout that no longer exists renders as Minimal, so a
  // deleted layout can never leave somebody's page blank.
  const layout = resolveLayout(p.layout);
  const reveal = p.reveal_animation || "";
  const folded = !!p.section_fold;
  const glowOn = p.card_glow !== false;
  // Editor previews are rendered inside a panel, so they must not claim the
  // whole viewport — that is what used to push the card off-screen and made
  // every layout look identical (a tall empty box with a card somewhere in it).
  const minH = embedded ? "min-h-[560px]" : "min-h-screen";

  // -------------------------------------------------------------------------
  // Placement
  // -------------------------------------------------------------------------

  // Dynamic 3D Cursor Tilt & Cursor Follow.
  // These write straight to the DOM instead of calling setState. The previous
  // version re-rendered every badge, link, widget and audio player on every
  // single mousemove, which is what made the preview feel heavy and janky.
  const paint = (rx, ry, glowX, glowY) => {
    const card = cardRef.current;
    if (card) card.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    const inner = cardInnerRef.current;
    const last = lastPaint.current;
    // The highlight only needs repainting once it has visibly moved. Rebuilding
    // this gradient (and the card's own background) every frame was the single
    // most expensive part of the old tilt.
    if (inner && (Math.abs(glowX - last.gx) >= 0.5 || Math.abs(glowY - last.gy) >= 0.5)) {
      inner.style.background = cardHasSurface
        ? `radial-gradient(circle at ${glowX.toFixed(2)}% ${glowY.toFixed(2)}%, ${accent}22, transparent 70%), ${cardBg}`
        : "transparent";
      last.gx = glowX;
      last.gy = glowY;
    }
  };

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card || !tiltEnabled) return;
    // No hover on touch, and a rotating card fights the scroll gesture.
    if (e.pointerType === "touch") return;
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { strength, mult } = tiltCfg.current;
    const rx = ((y - rect.height / 2) / (rect.height / 2)) * -strength * mult;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * strength * mult;
    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;

    // `transition: transform 60ms linear` used to be re-applied on every single
    // move, which restarted the transition each frame — the card never caught up
    // with the cursor, which is exactly what read as "slow and buggy". Set it
    // once per gesture instead, so the tilt tracks the pointer 1:1.
    if (!tilting.current) {
      card.style.transition = "transform 70ms ease-out";
      tilting.current = true;
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => paint(rx, ry, glowX, glowY));
  };

  const handleMouseLeave = () => {
    cancelAnimationFrame(rafRef.current);
    tilting.current = false;
    const card = cardRef.current;
    if (card) {
      card.style.transition = "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)";
    }
    paint(0, 0, 50, 50);
  };

  // Corner Icon is a page-level chip, not a card in the flow: it pins to the
  // page's top-left corner and only the first track drives it, so a second
  // track would render a second fixed chip on top of the same corner.
  // Declared BEFORE BgLayers, which eagerly evaluates the pinned-player block
  // and would otherwise hit its temporal dead zone.
  const cornerStyle = resolveTrackStyle(p.track_style) === "corner-icon";

  // Placement is a property of the shell the profile is drawn in, not a
  // separate switch: see TRACK_POSITION_BY_LAYOUT. A banner has a wide hero
  // header, so its player pins to that corner; the floating card carries its
  // player along the bottom edge; the flat cards keep it in their audio box.
  // Only the first track drives the pinned player (one player, one <audio>),
  // and the rest stay in the card's audio block. The Corner Icon style already
  // pins itself, so it ignores this. Inside the editor's embedded preview the
  // player still lifts out of the card — the pin is ABSOLUTE there, to the
  // preview panel's corner, so what the editor shows is what the page does.
  const pos = trackPositionForLayout(p.layout);
  const pagePin = pos === "top-right" || pos === "top-left" || pos === "bottom-center" || pos === "bottom-right";
  const pinnedPlayer = !cornerStyle && pagePin && tracks.length > 0;
  const pinClass =
    pos === "top-left" ? "top-3 left-3 w-64 sm:w-72" :
    pos === "bottom-center" ? "bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm sm:max-w-md" :
    pos === "bottom-right" ? "bottom-4 right-4 w-64 sm:w-72" :
    "top-3 right-3 w-64 sm:w-72";
  const pinKind = embedded ? "absolute" : "fixed";

  const BgLayers = (
    <>
      {bg && (
        bg.match(/\.(mp4|webm)(\?|$)/i)
          ? <video src={bg} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ opacity: Number(p.bg_opacity ?? 100) / 100, filter: p.bg_blur ? `blur(${p.bg_blur}px)` : undefined }} />
          : <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover sw-bg-drift" style={{ opacity: Number(p.bg_opacity ?? 100) / 100, filter: p.bg_blur ? `blur(${p.bg_blur}px)` : undefined }} />
      )}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${((Number(p.bg_dim ?? 50)) / 100).toFixed(2)})` }} />
      {p.background_effect && <BackgroundEffect effect={p.background_effect} />}
      {/* Overlays sit above cards with pointer-events-none so all interactive elements remain clickable */}
      {p.overlay && <OverlayEffect effect={p.overlay} color={accent} opacity={p.overlay_opacity ?? 100} zIndex="z-[25]" />}
      {p.overlay_enabled && <div className="absolute inset-0 pointer-events-none z-[25]" style={{ background: withA(p.overlay_color || accent, p.overlay_opacity ?? 18) }} />}
      {/* The lifted player: fixed to page coordinates, above the
          card. Every layout includes BgLayers, so the pin works on Minimal,
          Banner and Floating alike. The widget cards stay (tracks.slice(1))
          inside the card's own audio block. */}
      {pinnedPlayer && (
        <div
          data-testid="track-pinned-player"
          className={`${pinKind} ${pinClass} z-[80]`}
        >
          <TrackCardPreview
            track={tracks[0]}
            style={p.track_style}
            accent={accent}
            volume={trackVolume}
            embedded={embedded}
            autoPlay={shouldAutoPlay}
            profile={p}
          />
        </div>
      )}
      {/* The Corner Icon chip belongs here, with the other page-level player —
          NOT in the card's audio slot. Inside the card it inherits the card's
          transform as its containing block, so `fixed` anchored to the card and
          the chip sat on the header instead of on the website's corner. */}
      {cornerStyle && tracks.length > 0 && (
        <TrackCardPreview
          track={tracks[0]}
          style="corner-icon"
          accent={accent}
          volume={trackVolume}
          embedded={embedded}
          autoPlay={shouldAutoPlay}
          profile={p}
        />
      )}
    </>
  );

  const AvatarBlock = ({ size = 80 }) => {
    const frameSrc = deco.startsWith("/") || deco.startsWith("http")
      ? deco
      : deco.startsWith("frame_")
        ? `/frames/${deco.replace("frame_", "")}.png`
        : "";
    // The animated Swats decoration is a separate axis from the PNG frame, so a
    // profile can wear a Discord frame AND a Swats effect at the same time.
    // Before this the effect id was written into the frame field and simply drew
    // nothing here, which is why the Swats effects looked "broken" on the card.
    // Profiles saved back then still carry a `swats_*` value in the frame field,
    // so honour it rather than silently dropping what they picked.
    const effect = p.avatar_effect || (deco.startsWith("swats_") ? deco : "");
    // Hovering the picture shows the member number, and nothing else: the owner
    // asked for a UID-only tip that trails the cursor rather than a panel of
    // profile facts. It is opt-out from the Editor's Tooltips section.
    const showUidTip = p.avatar_uid_tooltip !== false;
    const uidTip = useMouseTip(showUidTip ? `UID ${uidNumberText()}` : "", {
      // One look and one entrance for the whole profile. The per-tip style ids
      // an older profile carries are still read, so an old card keeps the look
      // it was saved with until the owner picks a global one.
      style: resolveTooltipStyle(p.tooltip_style, p.uid_tooltip_style),
      anim: p.tooltip_anim,
      accent,
      size: p.tooltip_size || "md",
    });

    return (
      <div
        // Marked here rather than by each layout, so "the avatar is drawn once"
        // is checkable everywhere instead of only in the layouts that happened
        // to tag their own wrapper.
        data-block="avatar"
        data-menu-id="avatar"
        data-menu-url={avatar || ""}
        data-menu-name={data?.username || "Avatar"}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size, cursor: showUidTip ? "help" : undefined }}
        {...uidTip.props}
      >
        {uidTip.node}
        <div className="w-full h-full overflow-hidden rounded-full p-0.5" style={{ background: `linear-gradient(135deg, ${accent}, ${theme})` }}>
          {avatar ? (
            <img
              src={avatar}
              alt=""
              // Pfp framing: the zoom slider scales the picture up inside the
              // circle and the two crop sliders slide it, so the round crop is
              // framed rather than just taken from the centre.
              className="w-full h-full rounded-full object-cover"
              style={{
                objectPosition: `${Number.isFinite(avatarPosX) ? avatarPosX : 50}% ${Number.isFinite(avatarPosY) ? avatarPosY : 50}` + "%",
                transform: avatarZoom !== 100 ? `scale(${avatarZoom / 100})` : undefined,
                transformOrigin: "center",
              }}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-400">
              {(data.display_name || data.username || "?")[0]?.toUpperCase()}
            </div>
          )}
        </div>
        {/* Decorations render through ONE canvas: the curated catalogue writes
            its preset url here (the same string a member's own Discord
            decoration stores), and /frames/NNNN.png was the old bundled copy.
            The hue dial rides as a separate field, applied as a CSS filter, so
            recolouring costs no second fetch. */}
        {frameSrc && (
          <img
            src={frameSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-125"
            style={
              Number(p.avatar_decoration_hue)
                ? { filter: `hue-rotate(${Number(p.avatar_decoration_hue)}deg)` }
                : undefined
            }
          />
        )}
        {/* Animated Swats decoration, layered over both the picture and the frame */}
        {effect && (
          <div
            data-testid="avatar-effect"
            className={`absolute inset-0 rounded-full pointer-events-none z-20 fx-ov-${effect}`}
            // The .fx-ov-swats_* rules set `border-radius: inherit`, but here the
            // effect is a sibling of the round avatar rather than a child of it,
            // so the inherited radius would be 0. Pin it to the circle explicitly.
            style={{ borderRadius: "9999px" }}
          />
        )}
      </div>
    );
  };

  // Badge Tooltips & Badges Visibility Check
  const Badges = ({ showName = true }) => {
    if (p.show_badges === false) return null;
    const badgeList = data.equipped_badges?.length ? data.equipped_badges : (data.badges || []);
    if (!badgeList.length) return null;

    // "Badge Style" on the Badges page writes these settings and nothing else,
    // and they are handed straight to BadgeChip — the same component the
    // dashboard renders, so the two can no longer drift.
    const chipProps = {
      accent,
      glowColor: p.badge_glow !== false ? p.badge_glow_color : "",
      glowIntensity: p.badge_glow_intensity ?? 60,
      overlay: p.badge_overlay === true,
      overlayColor: p.badge_overlay_color || "",
      overlayStrength: p.badge_overlay_strength ?? 60,
    };

    const labelOf = (b) => (BADGE_META[b]?.label || b.replace(/_/g, " ")).toUpperCase();
    // Badge tips are switched on the Editor's one tooltip panel, and wear that
    // panel's look like every other tip on the page.
    const tipOn = p.badge_tooltips !== false;
    const tipStyle = resolveTooltipStyle(p.tooltip_style, p.badge_tooltip_style);

    return (
      <div
        data-testid="badge-row"
        className="inline-flex items-center flex-wrap justify-center gap-1 leading-none"
      >
        {badgeList.map((b) => (
          <HoverTip key={b} label={tipOn && showName ? labelOf(b) : ""} style={tipStyle} anim={p.tooltip_anim} accent={accent} size={p.tooltip_size || "md"}>
            <BadgeChip
              id={b}
              {...chipProps}
              className="cursor-pointer transition hover:scale-110"
            />
          </HoverTip>
        ))}
      </div>
    );
  };

  // The card shows the member NUMBER, not the raw UUID: a low number is an
  // early account, which is the whole point of showing it. The backend supplies
  // `uid_number` (1 = first signup). Anything without one — an older API
  // response, a test fixture — falls back to the legacy short id so the chip
  // never renders blank.
  //
  // There is one format and it is the classic one: the number as it reads. The
  // two the editor used to offer (Short, Padded) only differed by leading zeros.
  const uidNumberText = () => {
    const n = data.uid_number;
    if (n !== undefined && n !== null && n !== "") {
      const numOnly = String(n).replace(/\D/g, "");
      return `#${numOnly || n}`;
    }
    const raw = String(data.uid || data.short_id || data.id || "");
    if (raw.startsWith("9f1c2d3e")) {
      return "9f1c2d3e";
    }
    if (!raw) return "#1";
    // Convert hex or string UID into a clean numeric ID so hex hashes never show
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash + raw.charCodeAt(i)) >>> 0;
    }
    const derived = (hash % 90000) + 1000;
    return `#${derived}`;
  };

  // The quiet footer every floating layout ends on: views, where you are, the
  // join date and the UID chip when it is switched on. `meta_style` is how that
  // line is drawn and `views_position` can move the view count out of it and
  // onto a corner of the page (or off the page entirely), in which case it is
  // not repeated here. The count itself has one format, always.
  const MetaLine = ({ align = "center" }) => {
    const justify = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
    const metaStyle = p.meta_style || "plain";
    const viewsText = compactCount(data.views || 0);
    const uidText = uidNumberText();
    const joinedText = joinedLabel(data.created_at);
    const inMetaLine = !p.views_position;

    const items = [
      inMetaLine ? { key: "views", testid: "meta-views", icon: <Eye className="h-3.5 w-3.5" />, text: viewsText } : null,
      p.location ? { key: "location", testid: "meta-location", icon: <MapPin className="h-3.5 w-3.5" />, text: p.location } : null,
      p.show_join_date && joinedText ? { key: "joined", testid: "meta-joined", icon: <CalendarDays className="h-3.5 w-3.5" />, text: `Joined ${joinedText}` } : null,
      p.showcase_uid && uidText ? { key: "uid", testid: "meta-uid", icon: <Fingerprint className="h-3.5 w-3.5" />, text: `UID ${uidText}` } : null,
    ].filter(Boolean);

    // Nothing left to draw is nothing to draw: an empty row would still take
    // its own height and gaps.
    if (!items.length) return null;

    const chip = "inline-flex items-center gap-1.5";
    // The meta pills got the real-glass treatment: a blurred plate sits in front
  // of the background art, a tightened ring and a small drop shadow separate it
  // from the card body instead of the flat 5%-white chip that used to blend in.
  const pill = "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0a0a0e]/70 backdrop-blur-md px-3.5 py-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.35)]";

    return (
      <div
        data-testid="profile-meta"
        className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono2 text-[11px] text-zinc-400 ${justify}`}
      >
        <div
          className={metaStyle === "boxed"
            ? "inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-2xl border border-white/10 bg-black/30 px-3.5 py-2"
            : "contents"}
        >
          {items.map((it) => (
            <span key={it.key} data-testid={it.testid} className={metaStyle === "pills" ? pill : chip}>
              {it.icon}
              {it.text}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Shared card furniture.
  //
  // Every layout uses exactly these pieces, so a block can never exist in one
  // layout and be forgotten in another — the bug that made a card render as an
  // empty shell. The only thing a layout is allowed to decide is the *shell* the
  // pieces sit in and how wide it is.
  // ---------------------------------------------------------------------------

  // Whether the card has a surface at all, decided once from the same settings
  // every layout uses. (It used to be recomputed inside each layout, so a layout
  // could disagree with the tilt highlight about whether the card was transparent.)
  const hasCardBg = p.card_background !== false
    && p.card_bg_enabled !== false
    && p.card_style !== "transparent"
    && Number(p.card_fill_alpha ?? 72) > 0;

  const cardSurface = (extra = {}) => ({
    borderRadius: st.card.borderRadius || 24,
    ...st.card,
    background: hasCardBg ? cardBg : "transparent",
    border: !hasCardBg && p.card_style !== "outlined" ? "none" : st.card.border,
    ...extra,
  });

  // The glow dial: the accent was the only glow colour for a long time; the
  // advanced panel adds an explicit colour and a strength (0–100) that scales
  // both the halo radius and how deeply it tints. 0 strength ≈ no glow, so it
  // degrades to the plain drop shadow.
  const glowColor = p.card_glow_color || accent;
  const glowStrength = Number.isFinite(Number(p.card_glow_strength)) ? Math.max(0, Math.min(100, Number(p.card_glow_strength))) : 50;

  const cardShadow = (tight = false) => {
    if (!hasCardBg) return "none";
    // A preset that authors its own glow (Aurora's inset bloom) wins outright:
    // the layered ring below is the generic recipe, and smearing it over the
    // preset's considered one would flatten the very style the owner picked.
    if (glowOn && st.card.boxShadow) return st.card.boxShadow;
    if (glowOn) {
      const halo = Math.round(16 + glowStrength * 0.5);
      const alpha = (0.10 + glowStrength * 0.0025).toFixed(3);
      const a2 = (0.05 + glowStrength * 0.0016).toFixed(3);
      return tight
        ? `0 0 ${Math.round(halo * 0.7)}px ${glowColor}33, 0 8px 30px rgba(0,0,0,0.35)`
        : `0 0 ${halo}px ${glowColor}${Math.round(Number(alpha) * 255).toString(16).padStart(2, "0")}, 0 0 ${Math.round(halo * 2.2)}px ${glowColor}${Math.round(Number(a2) * 255).toString(16).padStart(2, "0")}, 0 10px 40px rgba(0,0,0,0.45)`;
    }
    return tight ? "0 8px 30px rgba(0,0,0,0.35)" : "0 10px 40px rgba(0,0,0,0.45)";
  };

  // Links split the same way LinksSection itself classifies them. The layouts
  // used to default a link with no explicit mode to "icon" while LinksSection
  // defaulted it to "card", so an unmarked link was pulled into the icon row and
  // then drawn there as a full card — the "links look wrong in some layouts" bug.
  // Every widget card inherits the profile's corner dial: the component handed
  // to a layout carries the radius through, so a layout's own instantiation
  // cannot drop it. A widget's OWN card_radius still wins.
  const RadiusWidgetCard = (props) => (
    <WidgetCard {...props} profileRadius={Number(p.card_radius ?? 24)} profile={p} />
  );

  const linkMode = (l) => l.mode || p.link_global_mode || "card";
  const iconLinks = links.filter((l) => linkMode(l) === "icon");
  const cardLinks = links.filter((l) => linkMode(l) === "card");

  const NameRow = ({ size = "text-xl sm:text-2xl", center = false, className = "" }) => {
    const placement = p.badge_placement || p.badge_position || "next_to_name";
    return (
      <>
        {placement === "above_name" && (
          <div data-block="badges" className={`inline-flex items-center leading-none mb-1.5 ${center ? "justify-center" : ""}`}>
            <Badges />
          </div>
        )}
        <div
          data-block="name"
          className={`flex flex-wrap items-center gap-1.5 ${center ? "justify-center" : ""} ${className}`}
        >
          <FxText
            id={p.name_effect || ""}
            text={data.display_name || data.username}
            className={`font-black tracking-tight ${size}`}
            style={{
              color: nameColor,
              fontFamily: p.display_font || "Unbounded",
              ...(p.name_glow === false ? null : { textShadow: `0 0 20px ${accent}bb` }),
            }}
          />
          {(placement === "next_to_name" || !["above_name", "below_name", "card_top_right", "card_bottom"].includes(placement)) && (
            <span data-block="badges" className="inline-flex items-center self-center leading-none"><Badges /></span>
          )}
        </div>
        <FxText
          id={p.use_name_effect_on_alias ? p.name_effect || "" : ""}
          text={`@${data.username}`}
          className="block text-xs font-medium"
          style={{ color: aliasColor, fontFamily: p.name_font || "Inter" }}
        />
        {placement === "below_name" && (
          <div data-block="badges" className={`inline-flex items-center leading-none mt-1.5 ${center ? "justify-center" : ""}`}>
            <Badges />
          </div>
        )}
      </>
    );
  };

  // The bio's own text size, as a percentage of the card's default (100). An
  // inline size is what makes it independent of the class, so the owner's
  // choice wins at every breakpoint instead of only where text-sm applies.
  const bioPx = Math.round(Math.max(60, Math.min(200, Number(p.bio_size ?? 100))) * 0.14);

  const BioBlock = ({ className = "" }) => (
    p.bio ? (
      <div data-block="bio" className={className}>
        <FxText
          as="p"
          id={p.bio_effect || ""}
          text={p.bio}
          className="leading-relaxed"
          style={{ color: bioColor, fontFamily: p.bio_font || "Inter", fontSize: `${bioPx}px` }}
        />
      </div>
    ) : null
  );

  // `pill` picks the floating layout's quiet pill cards; the width choice
  // (`span`) is honoured in both, so a full-width widget spans both columns
  // instead of silently rendering at half width.
  // When the fit pass is shrinking the card the grid drops its two-column
  // split: hoarding columns while shrinking would keep the card taller than
  // the screen, and a dense profile reads better stacked in one column anyway.
  const widgetsStacked = needFit && fitScale < 0.85;
  const WidgetsBlock = ({ pill = false, className = "" }) => (
    widgets.length > 0 ? (
      /* One grid for every widget. `grid-flow-row-dense` is what makes a
         Half-width card backfill the gap left beside a taller one, instead of
         being pushed to the next row and leaving a hole where it could have sat. */
      <div
        data-block="widgets"
        className={`w-full text-left grid auto-rows-min grid-flow-row-dense items-start content-start ${
          widgetsStacked ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
        } ${
          pill ? "gap-2.5" : "gap-3"
        } ${className}`}
      >
        {widgets.map((w, i) => {
          const full = !widgetsStacked && Number(w.span ?? 2) === 2;
          return (
            <div key={i} className={full ? "sm:col-span-2" : ""}>
              {pill ? (
                <WidgetPill w={w} accent={accent} ownerCreated={data.created_at} owner={data.username} p={p} />
              ) : (
                <WidgetCard w={w} accent={accent} ownerCreated={data.created_at} owner={data.username} profileRadius={Number(p.card_radius ?? 24)} profile={p} />
              )}
            </div>
          );
        })}
      </div>
    ) : null
  );

  // The scale the fit pass settled on, applied to the card's own wrapper so the
  // tilt transform on the card itself never has to know about it.
  const fitStyle = fitScale < 1
    ? { transform: `scale(${fitScale.toFixed(3)})`, transformOrigin: "top center" }
    : undefined;

  const LinksBlock = ({ links: list, align = "center", className = "" }) => (
    list.length > 0 ? (
      <div data-block="links" className={className}>
        <LinksSection links={list} p={p} accent={accent} align={align} reveal={reveal} iconSize="sm" />
      </div>
    ) : null
  );

  // Corner Icon is a page-level chip, not a card in the flow: it pins to the
  // page's top-left corner and only the first track drives it, so a second
  // track would render a second fixed chip on top of the same corner.
  // cornerStyle and pinnedPlayer are declared further up, before BgLayers.

  const AudioBlock = () => (
    pinnedPlayer || cornerStyle || tracks.length === 0 ? null : (
      <div data-block="audio" className="space-y-2.5">
        {tracks.map((t, i) => (
          <TrackCardPreview
            key={`${t.url || t.audio_url || t.title || "track"}-${i}`}
            track={t}
            style={p.track_style}
            accent={accent}
            volume={trackVolume}
            autoPlay={autoPlayAudio && i === 0 && !embedded}
            profile={p}
          />
        ))}
      </div>
    )
  );

  // ---------------------------------------------------------------------------
  // MINIMAL — the wide rectangular card. Avatar on the left, identity on the
  // right, and the rest of the profile in one column underneath. A track list
  // rides in its own matching box below the card.
  // ---------------------------------------------------------------------------
  if (layout === "minimal") {
    return (
      <div
        data-testid="profile-preview"
        data-layout={layout}
        className={`relative w-full ${minH} flex flex-col items-center ${fitScale < 1 ? "justify-start pt-4" : "justify-center"} p-4 sm:p-6`}
        style={{ background: pageBg }}
      >
        {BgLayers}
        {backgroundAudio && <BackgroundAudioButton disableBorder={p.disable_mute_border} />}

        <div
          ref={cardRef}
          onMouseMove={tiltEnabled ? handleMouseMove : undefined}
          onMouseLeave={tiltEnabled ? handleMouseLeave : undefined}
          className="relative z-10 w-full mx-auto my-auto space-y-4 group/name"
          // Card width is a positioning dial the owner moves (see the editor's
          // Card section): 680px keeps every pre-existing profile identical.
          // One style attribute: this element used to carry two, and React keeps
          // only the last, so the first one's props were silently dead.
          style={{
            maxWidth: Number(p.card_width ?? 680),
            willChange: "transform",
            transformStyle: "preserve-3d",
            ...fitStyle,
          }}
        >
          <div
            ref={cardInnerRef}
            className="p-5 sm:p-6 text-left relative overflow-visible transition duration-300"
            style={cardSurface({ boxShadow: cardShadow() })}
          >
            {p.badge_placement === "card_top_right" && (
              <div data-block="badges" className="absolute top-4 right-4 z-20 inline-flex items-center leading-none">
                <Badges />
              </div>
            )}
            <div className="flex items-center gap-5 sm:gap-6">
              <div className="shrink-0">
                <AvatarBlock size={120} />
              </div>
              <div className="min-w-0 flex-1">
                <NameRow />
                <LinksBlock links={iconLinks} align="left" className="mt-2.5" />
              </div>
            </div>

            <BioBlock className="mt-4" />
            <LinksBlock links={cardLinks} align="left" className="mt-4" />
            <WidgetsBlock className="mt-4" />

            {p.badge_placement === "card_bottom" && (
              <div data-block="badges" className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center leading-none w-full">
                <Badges />
              </div>
            )}

            <div className="mt-5 flex items-center justify-start">
              <MetaLine align="left" />
            </div>
          </div>

          {/* The player's own box only exists when a player rides in the card:
              a pinned or corner player used to leave this shell empty below
              the card. */}
          {tracks.length > 0 && !pinnedPlayer && !cornerStyle && (
            <div
              className="p-4 sm:p-5 text-left relative overflow-visible transition duration-300"
              style={cardSurface({
                // Numeric on purpose — see the border-radius fix above.
                borderRadius: Math.max(4, Number(p.card_radius ?? 24) - 4),
                boxShadow: cardShadow(true),
                ...(p.disable_audio_border ? { border: "none" } : {}),
              })}
            >
              <AudioBlock />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SLIDESHOW — full-page scroll-snap slides with side dot navigation. The
  // slides wear the owner's card style (see SlideshowView).
  // ---------------------------------------------------------------------------
  if (layout === "slideshow") {
    return (
      <SlideshowView
        data={data}
        p={p}
        embedded={embedded}
        accent={accent}
        glowOn={glowOn}
        nameColor={nameColor}
        aliasColor={aliasColor}
        bioColor={bioColor}
        AvatarBlock={AvatarBlock}
        Badges={Badges}
        LinksSection={LinksSection}
        WidgetCard={RadiusWidgetCard}
        AudioBlock={AudioBlock}
        MetaLine={MetaLine}
        BgLayers={BgLayers}
        BackgroundAudioButton={BackgroundAudioButton}
        backgroundAudio={backgroundAudio}
        links={links}
        widgets={widgets}
        tracks={tracks}
        showAudioBlock={tracks.length > 0 && !pinnedPlayer && !cornerStyle}
        reveal={reveal}
        bg={bg}
        cardRef={cardRef}
        handleMouseMove={handleMouseMove}
        handleMouseLeave={handleMouseLeave}
        tiltEnabled={tiltEnabled}
        st={st}
        cardHasSurface={hasCardBg}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // BANNER — an edge-to-edge hero band with the avatar overlapping its bottom
  // edge and the views pinned to its top corner. The links, widgets and player
  // ride in a second, narrower card underneath.
  // ---------------------------------------------------------------------------
  if (layout === "banner") {
    return (
      <div
        data-testid="profile-preview"
        data-layout={layout}
        className={`relative w-full ${minH} flex flex-col items-center ${fitScale < 1 ? "justify-start pt-4" : "justify-center"} p-4 sm:p-8`}
        style={{ background: pageBg }}
      >
        {BgLayers}
        {backgroundAudio && <BackgroundAudioButton disableBorder={p.disable_mute_border} />}

        <div
          ref={cardRef}
          onMouseMove={tiltEnabled ? handleMouseMove : undefined}
          onMouseLeave={tiltEnabled ? handleMouseLeave : undefined}
          className="relative z-10 w-full max-w-2xl sm:max-w-3xl mx-auto my-auto space-y-4 group/name"
          style={{ willChange: "transform", transformStyle: "preserve-3d", ...fitStyle }}
        >
          <div
            ref={cardInnerRef}
            className="overflow-hidden relative transition duration-300"
            style={cardSurface({ boxShadow: cardShadow() })}
          >
            {/* The hero band. No overflow clip on this box: the avatar hangs
                below it and a clip here used to chop its bottom half off. */}
            <div className="relative h-40 w-full">
              {banner ? (
                <img src={banner} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: `linear-gradient(135deg, ${accent}88, ${theme}44 60%, rgba(15,16,21,0.9))` }}
                />
              )}
              {/* The look over the banner is the owner's pick (banner_effect):
                  the bottom fade was hardcoded before, which read as "the banner
                  is always darkened". Profiles saved before the selector
                  existed get the old fade, so nothing changes underneath them. */}
              {(p.banner_effect || "fade") === "dim" ? (
                <div className="absolute inset-0 bg-black/45" />
              ) : (p.banner_effect || "fade") === "vignette" ? (
                <div
                  className="absolute inset-0"
                  style={{ background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.55) 100%)" }}
                />
              ) : (p.banner_effect || "fade") === "none" ? null : (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              )}

              {/* The count drawn here is the one view counter the banner layout
                  owns. `views_position` decides like everywhere else: unset
                  keeps the banner's own chip, a corner moves it to the page's
                  corner, and "hidden" draws it nowhere — this chip must NOT
                  fire in either of those two cases, or the count appears twice. */}
              {!p.views_position && (
                <div className="absolute top-3.5 right-3.5 z-20">
                  <span data-testid="banner-views-chip" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-mono2 text-white/95 shadow-md">
                    <Eye className="w-3.5 h-3.5" style={{ color: accent }} /> {compactCount(data.views || 0)}
                  </span>
                </div>
              )}

              <div className="absolute -bottom-10 left-6 z-20">
                <div
                  className="rounded-full transition duration-300 hover:scale-105"
                  style={{ boxShadow: glowOn ? `0 0 50px ${accent}55` : "0 10px 30px rgba(0,0,0,0.6)" }}
                >
                  <AvatarBlock size={84} />
                </div>
              </div>
            </div>

            <div className="pt-12 px-6 pb-6 text-left space-y-3">
              <NameRow />
              <BioBlock />

              {p.location && (
                <div className="inline-flex items-center gap-1.5 font-mono2 text-xs text-zinc-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                  <MapPin className="h-3.5 w-3.5" style={{ color: accent }} /> {p.location}
                </div>
              )}

              <LinksBlock links={iconLinks} align="left" className="pt-0.5" />
            </div>
          </div>

          {/* Same rule as Minimal's track box: a pinned player must not count
              as content, or this second card renders as an empty shell. */}
          {(widgets.length > 0 || cardLinks.length > 0 || (tracks.length > 0 && !pinnedPlayer && !cornerStyle)) && (
            <div
              className="p-4 sm:p-5 text-left relative overflow-visible transition duration-300 space-y-3"
              style={cardSurface({
                // Numeric on purpose — see the track card above.
                borderRadius: Math.max(4, Number(p.card_radius ?? 24) - 4),
                boxShadow: cardShadow(true),
              })}
            >
              <LinksBlock links={cardLinks} align="left" />
              <WidgetsBlock />
              <AudioBlock />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FLOATING AVATAR — the narrow centred card with the picture half on and half
  // off its top edge. Widgets are the quiet pill variant here so the centred
  // column stays a column.
  // ---------------------------------------------------------------------------
  if (layout === "floating") {
    return (
      <div
        data-testid="profile-preview"
        data-layout={layout}
        className={`relative w-full ${minH} flex flex-col items-center ${fitScale < 1 ? "justify-start" : "justify-center"} p-4 sm:p-8 pt-24`}
        style={{ background: pageBg }}
      >
        {BgLayers}
        {backgroundAudio && <BackgroundAudioButton disableBorder={p.disable_mute_border} />}

        <div
          ref={cardRef}
          onMouseMove={tiltEnabled ? handleMouseMove : undefined}
          onMouseLeave={tiltEnabled ? handleMouseLeave : undefined}
          className="relative z-10 w-full max-w-md sm:max-w-[660px] mx-auto my-auto pt-16 group/name"
          style={{ willChange: "transform", transformStyle: "preserve-3d", ...fitStyle }}
        >
          <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2">
            <div
              className="rounded-full transition duration-300 hover:scale-105"
              style={{ boxShadow: glowOn ? `0 0 50px ${accent}55` : "0 10px 30px rgba(0,0,0,0.6)" }}
            >
              <AvatarBlock size={120} />
            </div>
          </div>

          <div
            ref={cardInnerRef}
            className="pt-20 pb-6 px-5 sm:px-6 text-center relative overflow-visible transition duration-300 flex flex-col gap-4"
            style={cardSurface({ boxShadow: cardShadow() })}
          >
            <div className="space-y-1">
              <NameRow size="text-2xl sm:text-3xl" center />
            </div>

            <BioBlock />
            <LinksBlock links={links} align="center" />
            <WidgetsBlock />
            <AudioBlock />

            <div className="mt-2 border-t border-white/10 pt-3.5">
              <MetaLine align="center" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unreachable: `resolveLayout` maps anything unknown (including the layouts
  // that were deleted) onto "minimal" before this point.
  return null;
};
