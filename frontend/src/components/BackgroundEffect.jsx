import { useEffect, useRef } from "react";
import { createGhostBgPainter } from "@/lib/ghostFx";
import { resolveBackground } from "@/constants/effects";

/* ---------------------------------------------------------------------------
   BackgroundEffect — the background layer: rain, snow v1, snow v2, shooting
   stars, thunder, constellation, galaxy, rain fall, love fall, bleeding, TV,
   snow flake and frosted (lib/ghostFx).

   One canvas, one painter instance, one clear per frame — no DOM star fields, no
   double-painted CSS copy, no per-frame layout reads. The painters fill their
   own backdrops (that IS the look of the ghost page: window rain paints its
   #0b0e13 plate, vhs tape paints its tape plate), so the canvas carries the
   effect at full strength and the old per-effect opacity dial is gone.

   ghost rebuilds its painter on resize so the particle field re-seeds for the
   new box; the same happens here, driven by a ResizeObserver on the layer's
   parent (the URL-bar-resize case) plus the usual window listener.
   --------------------------------------------------------------------------- */

export function BackgroundEffect({ effect, thumbnail = false }) {
  const canvasRef = useRef(null);
  // Resolved once per value: legacy ids saved before the ghost swap map to the
  // closest ghost background (or to nothing, when nothing was close).
  const id = resolveBackground(effect);

  useEffect(() => {
    if (!id) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let raf = 0;
    let w = 0;
    let h = 0;
    let painter = null;

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
      // Rebuild the painter for the new box, exactly like ghost's setBg().
      painter = createGhostBgPainter(id, w, h);
      ctx.clearRect(0, 0, w, h);
    };

    let active = true;
    let lastTime = 0;
    const frameInterval = isSmall ? 35 : 0; // ~28fps throttle for small preview tiles
    const frame = (now) => {
      if (!active) return;
      if (!frameInterval || now - lastTime >= frameInterval) {
        lastTime = now;
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
      observer?.disconnect();
    };
  }, [id]);

  if (!id) return null;

  return (
    <canvas
      ref={canvasRef}
      data-testid="bg-canvas"
      data-effect={id}
      /* Which blend mode this layer gets is decided in effects.css per effect
         (.sw-bg-canvas). Screen keeps a particle layer from burying the owner's
         background; it also renders a PLATE-based effect (a rain-streaked
         window, a VHS tape, a thunderstorm, a spotlight) invisible, because
         screen drops dark pixels and those effects ARE mostly their dark plate.
         Half the catalogue looked like it did nothing because of that. */
      className="sw-bg-canvas absolute inset-0 w-full h-full pointer-events-none z-[1]"
    />
  );
}

export default BackgroundEffect;
