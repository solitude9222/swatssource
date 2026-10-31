import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { TooltipStyle } from "../lib/links";

/**
 * A cursor tooltip: floats ABOVE THE POINTER and follows it while hovering.
 * Rendered through a portal with position:fixed so page transforms (tilt
 * cards, parallax, zoom effects) can never displace or clip it.
 *
 * While visible it also watches the document: the moment the pointer moves
 * off the wrapped element — or the page scrolls, or the pointer is pressed —
 * the tooltip hides. That guarantees tooltips can never get "stuck" on
 * screen when React swaps the hovered node out from under the cursor
 * (polling widgets, virtualised lists, HMR) and pointerleave never fires.
 */
export function Tooltip({
  text,
  style = "default",
  children,
}: {
  text: string;
  style?: TooltipStyle;
  children: ReactNode;
}) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!show) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onDocMove = (event: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const inside =
        event.clientX >= r.left - 6 &&
        event.clientX <= r.right + 6 &&
        event.clientY >= r.top - 6 &&
        event.clientY <= r.bottom + 6;
      if (!inside) setShow(false);
    };
    const hide = () => setShow(false);

    document.addEventListener("pointermove", onDocMove, { passive: true });
    window.addEventListener("scroll", hide, true);
    window.addEventListener("pointerdown", hide, true);
    window.addEventListener("blur", hide);
    return () => {
      document.removeEventListener("pointermove", onDocMove);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("pointerdown", hide, true);
      window.removeEventListener("blur", hide);
    };
  }, [show]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (!text) return <>{children}</>;

  const track = (event: ReactPointerEvent) => {
    setPos({ x: event.clientX, y: event.clientY });
  };

  const enter = (event: ReactPointerEvent) => {
    track(event);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(true), 120);
  };

  const leave = () => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  };

  // Keep the bubble on screen: ~half a wide tooltip plus a margin.
  const clampX = (x: number) => Math.min(Math.max(x, 90), Math.max(90, window.innerWidth - 90));

  return (
    <span ref={wrapRef} className="tt-wrap" onPointerEnter={enter} onPointerMove={track} onPointerLeave={leave}>
      {children}
      {show && pos
        ? createPortal(
            <span
              className={`tt tt--fixed tt--${style}`}
              role="tooltip"
              style={{ left: clampX(pos.x), top: Math.max(28, pos.y - 12) }}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
