import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { WidgetCard } from "@/components/WidgetCards";
import { Sparkles } from "lucide-react";

// The same accounts the site demonstrates with, rendered through the real
// widget components and the real backend proxy — no screenshots, no typed-out
// numbers.
const WIDGETS = [
  {
    accent: "#1DB954",
    w: { type: "spotify", title: "Spotify", url: "https://open.spotify.com/track/3P61wVXNlCuTa7zSnTN3Zv" },
  },
  {
    accent: "#ff5500",
    w: { type: "soundcloud", title: "SoundCloud", url: "https://soundcloud.com/bondages" },
  },
  {
    accent: "#ff0050",
    w: { type: "tiktok", title: "TikTok", url: "https://www.tiktok.com/@koniwtfs" },
  },
  {
    accent: "#5865F2",
    w: { type: "discord", subtype: "profile", title: "Discord", user_id: "1546745348020772915" },
  },
  {
    accent: "#5865F2",
    w: { type: "discord", subtype: "server", title: "tourn.lol", invite_url: "https://discord.gg/a9uwptuepD" },
  },
];

// A resting tilt, so the band reads as 3D even before anything is hovered (and
// on machines with reduced motion, where the pointer response is skipped).
const BASE_TILT = { x: 12, y: 8 };

const Tilt = ({ children, index, accent = "#b4bffa" }) => {
  const tiltRef = useRef(null);
  const glareRef = useRef(null);
  const reduce = useReducedMotion();
  const baseY = index % 2 === 0 ? -BASE_TILT.y : BASE_TILT.y;
  const rest = `rotateX(${BASE_TILT.x}deg) rotateY(${baseY}deg)`;

  const onMove = (e) => {
    if (reduce || !tiltRef.current) return;
    const box = tiltRef.current.getBoundingClientRect();
    if (!box) return;
    const px = (e.clientX - box.left) / box.width - 0.5;
    const py = (e.clientY - box.top) / box.height - 0.5;
    const rotX = BASE_TILT.x - py * 20;
    const rotY = baseY + px * 20;
    tiltRef.current.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03, 1.03, 1.03)`;

    if (glareRef.current) {
      const gx = ((e.clientX - box.left) / box.width) * 100;
      const gy = ((e.clientY - box.top) / box.height) * 100;
      glareRef.current.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 35%, transparent 70%)`;
      glareRef.current.style.opacity = "1";
    }
  };

  const reset = () => {
    if (tiltRef.current) tiltRef.current.style.transform = rest;
    if (glareRef.current) glareRef.current.style.opacity = "0";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="w-full sm:w-[340px]"
    >
      <motion.div whileHover={reduce ? undefined : { y: -8 }} className="group relative">
        <div
          ref={tiltRef}
          data-testid={`tilt-${index}`}
          onPointerMove={onMove}
          onPointerLeave={reset}
          style={{ transform: rest, transformStyle: "preserve-3d", transition: "transform .22s cubic-bezier(0.16, 1, 0.3, 1)" }}
          className="relative cursor-pointer"
        >
          {/* Specular glare overlay that follows mouse pointer */}
          <span
            ref={glareRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 rounded-2xl opacity-0 transition-opacity duration-300"
            style={{ mixBlendMode: "overlay" }}
          />

          {/* Dynamic colorful aura glow - subtle, not blurry */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-50"
            style={{ background: `radial-gradient(circle at 50% 30%, ${accent}30, transparent 60%)` }}
          />

          <div style={{ transform: "translateZ(34px)" }} className="relative z-10">
            {children}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const WidgetShowcase = () => (
  <section data-testid="widget-showcase" className="relative overflow-hidden border-t border-white/10 py-24">
    {/* Ambient background glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-30"
      style={{
        background: "radial-gradient(circle at 50% 20%, rgba(180, 191, 250,0.12), transparent 60%)",
      }}
    />

    <div className="mx-auto mb-14 max-w-2xl px-4 text-center relative z-10">
      <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-200 mb-4 backdrop-blur">
        <Sparkles className="h-3.5 w-3.5 text-brand-400" />
        <span>Live Interactive Widgets</span>
      </div>
      <h2 className="font-display text-3xl font-black text-zinc-50 sm:text-4xl tracking-tight">
        The widgets your page actually renders
      </h2>
      <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
        Live data directly from Spotify, SoundCloud, TikTok, and Discord. Real-time media feeds that live right on your profile.
      </p>
    </div>

    <div
      className="mx-auto flex max-w-5xl flex-wrap justify-center gap-8 px-4 relative z-10"
      style={{ perspective: "1100px" }}
      data-testid="widget-showcase-grid"
    >
      {WIDGETS.map((item, i) => (
        <Tilt
          key={`${item.w.type}-${item.w.subtype || item.w.url || item.w.user_id}`}
          index={i}
          accent={item.accent}
        >
          <div
            className="h-full rounded-2xl transition-shadow duration-300 group-hover:shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
            data-testid={`live-widget-${item.w.type}${item.w.subtype ? `-${item.w.subtype}` : ""}`}
          >
            <WidgetCard w={item.w} accent={item.accent} />
          </div>
        </Tilt>
      ))}
    </div>
  </section>
);

export default WidgetShowcase;
