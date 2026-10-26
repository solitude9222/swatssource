import { useEffect, useRef } from "react";
import { fileUrl } from "@/lib/api";
import { crosshairSettings } from "@/lib/crosshair";

/**
 * CustomCursor
 * Renders a high-performance custom cursor follower supporting:
 * - Full animated GIF playback (real <img> element, 60-144fps)
 * - Normal small cursor sizing (24-32px default, scaled cleanly)
 * - Perfectly centered hotspot (translate(-50%, -50%))
 * - Zero React re-renders on mouse movement (direct DOM transform in RAF)
 * - Zero CSS transform transition to eliminate motion jitter
 * - Automatic suppression on touch/mobile devices
 */
export function CustomCursor({ profile }) {
  const settings = crosshairSettings(profile || {});
  const cursorRef = useRef(null);
  const posRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef(0);
  const clickableRef = useRef(false);

  const imgSrc = settings.image ? fileUrl(settings.image) : "";

  useEffect(() => {
    if (!imgSrc || typeof window === "undefined") {
      if (typeof document !== "undefined") {
        document.body.classList.remove("custom-cursor-active");
      }
      return undefined;
    }

    // Only run on fine pointer devices (mouse / trackpad)
    const isFinePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return undefined;

    // Hide default cursor across the page
    document.body.classList.add("custom-cursor-active");

    const onPointerMove = (e) => {
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;

      const target = e.target;
      clickableRef.current = !!(
        target &&
        typeof target.closest === "function" &&
        target.closest("a, button, [role=button], input, textarea, select, label, .cursor-pointer")
      );

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (cursorRef.current) {
            cursorRef.current.style.opacity = "1";
            cursorRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%) scale(${
              clickableRef.current ? 1.15 : 1
            })`;
          }
          rafRef.current = 0;
        });
      }
    };

    const onPointerLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "0";
    };

    const onPointerEnter = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "1";
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);
    document.addEventListener("mouseenter", onPointerEnter);

    return () => {
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      document.removeEventListener("mouseenter", onPointerEnter);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [imgSrc, settings.scale]);

  if (!imgSrc) return null;

  // Don't render on touch/coarse devices
  if (typeof window !== "undefined" && window.matchMedia && !window.matchMedia("(pointer: fine)").matches) {
    return null;
  }

  // Normal cursor base dimension: 28px, scaled cleanly
  const baseSize = 28;
  const currentScale = settings.scale || 1;
  const sizePx = Math.round(Math.max(16, Math.min(64, baseSize * currentScale)));

  return (
    <div
      ref={cursorRef}
      data-testid="custom-cursor-follower"
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[999999] select-none will-change-transform"
      style={{
        opacity: 0,
        transition: "opacity 120ms ease-out",
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)",
      }}
    >
      <img
        src={imgSrc}
        alt=""
        className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}

export default CustomCursor;
