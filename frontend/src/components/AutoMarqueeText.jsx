import { useState, useRef, useEffect, memo } from "react";

/**
 * AutoMarqueeText
 * Intelligently detects whether text exceeds its container's visible width.
 * If overflowing, smoothly animates horizontal marquee scrolling with a gentle pause
 * and seamless loop, without clipping, layout shifts, or jerky jumps.
 * Respects prefers-reduced-motion.
 */
export const AutoMarqueeText = memo(function AutoMarqueeText({
  children,
  className = "",
  style = {},
  speed = 30, // pixels per second
  pauseMs = 1500, // pause at start
  title,
  as: Component = "span",
  ...props
}) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const checkOverflow = () => {
      const containerWidth = container.clientWidth;
      const contentWidth = content.scrollWidth;
      const diff = contentWidth - containerWidth;
      if (diff > 2) {
        setIsOverflowing(true);
        setOverflowDistance(diff);
      } else {
        setIsOverflowing(false);
        setOverflowDistance(0);
      }
    };

    checkOverflow();

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(checkOverflow)
      : null;

    resizeObserver?.observe(container);
    window.addEventListener("resize", checkOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [children]);

  const duration = Math.max(3, (overflowDistance + 40) / speed);

  return (
    <Component
      ref={containerRef}
      className={`relative inline-block max-w-full overflow-hidden align-middle ${className}`}
      style={{
        ...style,
        maskImage: isOverflowing
          ? "linear-gradient(to right, transparent 0, black 8px, black calc(100% - 12px), transparent 100%)"
          : undefined,
        WebkitMaskImage: isOverflowing
          ? "linear-gradient(to right, transparent 0, black 8px, black calc(100% - 12px), transparent 100%)"
          : undefined,
      }}
      title={title || (typeof children === "string" ? children : undefined)}
      {...props}
    >
      <span
        ref={contentRef}
        className={`inline-block whitespace-nowrap ${isOverflowing ? "animate-auto-marquee" : ""}`}
        style={
          isOverflowing
            ? {
                "--overflow-dist": `-${overflowDistance + 16}px`,
                animationDuration: `${duration}s`,
                animationDelay: `${pauseMs}ms`,
              }
            : undefined
        }
      >
        {children}
      </span>
    </Component>
  );
});

export default AutoMarqueeText;
