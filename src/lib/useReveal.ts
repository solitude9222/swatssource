import { useEffect } from "react";

/**
 * Reveals `[data-reveal]` elements as they enter the viewport. Elements that
 * are already on screen animate in with their `data-reveal-delay`, which gives
 * the page a composed entrance without a blocking loading screen.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (nodes.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-revealed"));
      return;
    }

    const timers: number[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.06 },
    );

    nodes.forEach((node) => {
      const delay = Number(node.dataset.revealDelay ?? 0) || 0;
      node.style.setProperty("--reveal-delay", `${delay}ms`);

      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.08) {
        const timer = window.setTimeout(() => node.classList.add("is-revealed"), delay);
        timers.push(timer);
      } else {
        observer.observe(node);
      }
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      observer.disconnect();
    };
  }, deps);
}
