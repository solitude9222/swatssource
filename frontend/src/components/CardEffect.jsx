import { useEffect, useRef, useState, useMemo } from "react";
import { resolveCardEffect } from "@/constants/effects";

/**
 * Helper to convert any CSS color string (hex, rgb, rgba, hsl, hsla)
 * into an rgba string with custom alpha.
 */
function toRgba(input, alphaPct = 100) {
  if (!input || typeof input !== "string") return `rgba(180, 191, 250, ${alphaPct / 100})`;
  const s = input.trim();
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length === 4) h = h.split("").map((c) => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16) || 0;
    const g = parseInt(h.slice(2, 4), 16) || 0;
    const b = parseInt(h.slice(4, 6), 16) || 0;
    const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, (alphaPct / 100) * a)).toFixed(3)})`;
  }
  const rgbMatch = s.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (rgbMatch) {
    const a = rgbMatch[4] != null ? Number(rgbMatch[4]) : 1;
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${Math.max(0, Math.min(1, (alphaPct / 100) * a)).toFixed(3)})`;
  }
  const hslMatch = s.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (hslMatch) {
    const h = Number(hslMatch[1]) / 360, sat = Number(hslMatch[2]) / 100, l = Number(hslMatch[3]) / 100;
    let r, g, b;
    if (sat === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const a = hslMatch[4] != null ? Number(hslMatch[4]) : 1;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.max(0, Math.min(1, (alphaPct / 100) * a)).toFixed(3)})`;
  }
  return `rgba(180, 191, 250, ${alphaPct / 100})`;
}

/**
 * CardEffect component — renders smooth, GPU-accelerated effects for profile cards:
 *   - shine: Diagonal light sheen sweeping across
 *   - shimmer: Smooth holographic dual-gradient ribbon flow
 *   - spotlight: Interactive mouse-following or sweeping radial light
 *   - border_beam: Continuous luminescent beam orbiting card border
 *   - glow: Ambient breathing colored aura
 *   - reflection: Angled glassmorphic light sheen
 *   - aurora: Soft shifting chromatic mesh wave
 *
 * Supports full color harmonization: seamlessly blends with the user's
 * accent color and card gradient.
 */
export function CardEffect({
  effect,
  color = "#b4bffa",
  gradientColor = null,
  gradientEnabled = false,
  borderRadius = "24px",
  className = "",
  style = {},
}) {
  const id = resolveCardEffect(effect);
  const containerRef = useRef(null);
  const spotlightRef = useRef(null);

  // Compute harmonized colors
  const primaryRgba = useMemo(() => toRgba(color, 85), [color]);
  const primarySoft = useMemo(() => toRgba(color, 25), [color]);
  const primaryGlow = useMemo(() => toRgba(color, 45), [color]);
  const secondaryColor = gradientEnabled && gradientColor ? gradientColor : color;
  const secondaryRgba = useMemo(() => toRgba(secondaryColor, 80), [secondaryColor]);
  const secondarySoft = useMemo(() => toRgba(secondaryColor, 20), [secondaryColor]);

  // Spotlight mouse tracking on parent card via RAF and CSS variables (zero React re-renders)
  useEffect(() => {
    if (id !== "spotlight") return undefined;
    const parent = containerRef.current?.parentElement;
    if (!parent) return undefined;

    let rafId = null;
    let pendingX = 50;
    let pendingY = 50;

    const updateSpotlight = () => {
      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty("--spot-x", `${pendingX.toFixed(2)}%`);
        spotlightRef.current.style.setProperty("--spot-y", `${pendingY.toFixed(2)}%`);
        spotlightRef.current.style.opacity = "1";
      }
      rafId = null;
    };

    const onPointerMove = (e) => {
      const rect = parent.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pendingX = ((e.clientX - rect.left) / rect.width) * 100;
      pendingY = ((e.clientY - rect.top) / rect.height) * 100;
      if (!rafId) {
        rafId = requestAnimationFrame(updateSpotlight);
      }
    };

    const onPointerLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty("--spot-x", "50%");
        spotlightRef.current.style.setProperty("--spot-y", "30%");
        spotlightRef.current.style.opacity = "0.65";
      }
    };

    parent.addEventListener("pointermove", onPointerMove, { passive: true });
    parent.addEventListener("pointerleave", onPointerLeave, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      parent.removeEventListener("pointermove", onPointerMove);
      parent.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [id]);

  if (!id) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-card-effect={id}
      className={`absolute inset-0 pointer-events-none z-10 overflow-hidden ${className}`}
      style={{ borderRadius, ...style }}
    >
      {/* 1. SHINE: Diagonal light sheen sweep */}
      {id === "shine" && (
        <div
          className="absolute inset-0 -translate-x-full animate-[card-shine_3.5s_cubic-bezier(0.4,0,0.2,1)_infinite]"
          style={{
            background: `linear-gradient(115deg, transparent 20%, ${primarySoft} 42%, ${primaryRgba} 50%, ${secondarySoft} 58%, transparent 80%)`,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* 2. SHIMMER: Flowing dual-gradient prismatic wave */}
      {id === "shimmer" && (
        <div
          className="absolute inset-0 animate-[card-shimmer_4s_linear_infinite]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${primarySoft} 30%, ${secondarySoft} 50%, ${primarySoft} 70%, transparent 100%)`,
            backgroundSize: "200% 100%",
            mixBlendMode: "screen",
            opacity: 0.9,
          }}
        />
      )}

      {/* 3. SPOTLIGHT: Mouse-following radial beam (or idle sweep) */}
      {id === "spotlight" && (
        <div
          ref={spotlightRef}
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            "--spot-x": "50%",
            "--spot-y": "30%",
            background: `radial-gradient(circle 320px at var(--spot-x, 50%) var(--spot-y, 30%), ${primaryGlow} 0%, ${secondarySoft} 40%, transparent 80%)`,
            mixBlendMode: "screen",
            opacity: 0.65,
          }}
        />
      )}

      {/* 4. BORDER BEAM: Traveling light beam tracing along the border */}
      {id === "border_beam" && (
        <div className="absolute inset-0 rounded-[inherit] p-[1.5px] overflow-hidden">
          <div
            className="absolute inset-[-100%] animate-[spin_6s_linear_infinite]"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${primaryRgba} 60deg, ${secondaryRgba} 120deg, transparent 180deg)`,
            }}
          />
          <div
            className="absolute inset-[1.5px] rounded-[inherit] bg-transparent pointer-events-none"
            style={{ backdropFilter: "none" }}
          />
        </div>
      )}

      {/* 5. GLOW: Soft ambient breathing aura */}
      {id === "glow" && (
        <div
          className="absolute inset-0 rounded-[inherit] animate-[card-pulse_3s_ease-in-out_infinite]"
          style={{
            boxShadow: `inset 0 0 30px ${primarySoft}, 0 0 40px ${secondarySoft}`,
            opacity: 0.85,
          }}
        />
      )}

      {/* 6. REFLECTION: Crisp angled glassmorphic sheen */}
      {id === "reflection" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${primarySoft} 0%, transparent 45%, ${secondarySoft} 85%, transparent 100%)`,
            mixBlendMode: "screen",
            opacity: 0.7,
          }}
        />
      )}

      {/* 7. AURORA: Chromatic fluid drifting wave */}
      {id === "aurora" && (
        <div
          className="absolute inset-0 animate-[card-aurora_8s_ease-in-out_infinite_alternate]"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${primarySoft} 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${secondarySoft} 0%, transparent 50%)`,
            filter: "blur(18px)",
            mixBlendMode: "screen",
            opacity: 0.75,
          }}
        />
      )}
    </div>
  );
}

export default CardEffect;
