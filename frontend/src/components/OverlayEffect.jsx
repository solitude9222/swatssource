import { useEffect, useRef } from "react";
import { createGhostOverlayPainter } from "@/lib/ghostFx";
import { resolveOverlay } from "@/constants/effects";

/* ---------------------------------------------------------------------------
   OverlayEffect — the layer above the profile card: snow, rain, VHS, grain,
   spotlight and dotters (lib/ghostFx).

   ghost runs every overlay as a canvas painter (there is no CSS half in the
   ghost page and there is none here either): one canvas, one painter, one clear
   per frame, painter rebuilt on resize exactly like ghost's setOv().

   The Editor's Transparency slider still works: below 100 the whole layer fades.
   z-70 keeps it above the card (the profile card paints at z-10), and
   pointer-events-none keeps everything underneath clickable.
   --------------------------------------------------------------------------- */

export function OverlayEffect({ effect, color, opacity, zIndex, className = "", thumbnail = false }) {
  const canvasRef = useRef(null);
  const id = resolveOverlay(effect);
  void color;

  useEffect(() => {
    if (!id) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let ctx = null;
    try {
      ctx = canvas.getContext ? canvas.getContext("2d") : null;
    } catch {
      ctx = null;
    }
    if (!ctx) return undefined;

    let raf = 0;
    let w = 0;
    let h = 0;
    let painter = null;
    const pointer = { current: { x: -99, y: -99 } };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = e.clientX - rect.left;
      pointer.current.y = e.clientY - rect.top;
    };

    const isSmall = Boolean(thumbnail);

    const resize = () => {
      const parent = canvas.parentElement;
      const dpr = isSmall ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      w = Math.min(4096, Math.max(1, parent ? parent.clientWidth : window.innerWidth));
      h = Math.min(4096, Math.max(1, parent ? parent.clientHeight : window.innerHeight));
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Rebuild the painter for the new box
      painter = createGhostOverlayPainter(id, w, h, pointer);
      ctx.clearRect(0, 0, w, h);
    };

    let active = true;
    let lastTime = 0;
    const frameInterval = isSmall ? 35 : 0; // ~28fps throttle for small preview tiles
    const frame = (now) => {
      if (!active) return;
      if (!frameInterval || now - lastTime >= frameInterval) {
        lastTime = now;
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, w, h);
        if (painter) painter(ctx, now);
      }
      raf = requestAnimationFrame(frame);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (active) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (id === "spotlight" && typeof window !== "undefined") {
      window.addEventListener("pointermove", onMove, { passive: true });
    }
    window.addEventListener("resize", resize);
    const observer =
      typeof ResizeObserver === "function" && canvas.parentElement
        ? new ResizeObserver(() => resize())
        : null;
    observer?.observe(canvas.parentElement);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", resize);
      if (id === "spotlight" && typeof window !== "undefined") {
        window.removeEventListener("pointermove", onMove);
      }
      observer?.disconnect();
    };
  }, [id]);

  if (!id) return null;

  // The Editor's Transparency slider. 100% keeps the overlay exactly as
  // authored (ghost shows it at full strength); anything lower fades the layer.
  const raw = opacity === undefined || opacity === null || opacity === "" ? 100 : Number(opacity);
  const alpha = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) / 100 : 1;
  const layerStyle = alpha === 1 ? undefined : { opacity: alpha };

  const z = zIndex !== undefined ? zIndex : "z-[70]";

  return (
    <canvas
      ref={canvasRef}
      data-testid="overlay-canvas"
      data-effect={id}
      className={`absolute inset-0 w-full h-full pointer-events-none ${z} ${className}`}
      style={layerStyle}
    />
  );
}

export default OverlayEffect;
