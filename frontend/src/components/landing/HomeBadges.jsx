import { useEffect, useRef, useState } from "react";
import {
  Crown, BadgeCheck, Gift, Heart, Rocket, Medal, Bug, Sprout, Flame, Star,
  Zap, Trophy, Swords, Gamepad2, Music, Camera, Palette, Globe, Shield,
  Sparkles, Clock, CalendarDays, Eye, ThumbsUp, MessageSquare, Users,
  Diamond, Gem, Feather, Moon, Sun, Bell, Award,
} from "lucide-react";
import { SectionPill } from "./SectionPill";
import { useTooltip } from "@/components/FxTooltip";

/* "33 badges total, 27 of them earnable."

   A 16-per-row grid of badge tiles. Tiles sharpen in, one after another, when
   the section scrolls into view; the first four are staff-only, so they sit dim
   and desaturated. Hovering a tile tints its border with the badge's own colour
   and opens the same black tooltip the rest of the site uses. */

const BADGES = [
  { name: "Owner", color: "#fbbf24", Icon: Crown, staff: true },
  { name: "Admin", color: "#ef4444", Icon: Shield, staff: true },
  { name: "Team", color: "#38bdf8", Icon: Users, staff: true },
  { name: "Media", color: "#ec4899", Icon: Camera, staff: true },
  { name: "Verified", color: "#74a0f8", Icon: BadgeCheck },
  { name: "OG", color: "#f59e0b", Icon: Star },
  { name: "Gifter", color: "#f97316", Icon: Gift },
  { name: "First Place", color: "#facc15", Icon: Trophy },
  { name: "Second Place", color: "#cbd5e1", Icon: Medal },
  { name: "Third Place", color: "#d97706", Icon: Award },
  { name: "Booster", color: "#f472b6", Icon: Rocket },
  { name: "Premium", color: "#a78bfa", Icon: Diamond },
  { name: "Partner", color: "#60a5fa", Icon: Gem },
  { name: "Bug Hunter", color: "#22c55e", Icon: Bug },
  { name: "Sprout", color: "#4ade80", Icon: Sprout },
  { name: "Flame", color: "#fb923c", Icon: Flame },
  { name: "Candy Cane", color: "#f87171", Icon: Gift },
  { name: "Heart", color: "#f472b6", Icon: Heart },
  { name: "Rockstar", color: "#e879f9", Icon: Music },
  { name: "Artist", color: "#fb7185", Icon: Palette },
  { name: "Globetrotter", color: "#38bdf8", Icon: Globe },
  { name: "Spark", color: "#fde047", Icon: Sparkles },
  { name: "Early Bird", color: "#fbbf24", Icon: Sun },
  { name: "Night Owl", color: "#818cf8", Icon: Moon },
  { name: "On Time", color: "#34d399", Icon: Clock },
  { name: "Anniversary", color: "#f59e0b", Icon: CalendarDays },
  { name: "Watched", color: "#74a0f8", Icon: Eye },
  { name: "Liked", color: "#34d399", Icon: ThumbsUp },
  { name: "Talkative", color: "#a78bfa", Icon: MessageSquare },
  { name: "Duo", color: "#f472b6", Icon: Swords },
  { name: "Gamer", color: "#22d3ee", Icon: Gamepad2 },
  { name: "Hype", color: "#fb7185", Icon: Zap },
  { name: "Notifier", color: "#93c5fd", Icon: Bell },
  { name: "Feather", color: "#e2e8f0", Icon: Feather },
];

const Tile = ({ badge, index, visible }) => {
  // The tip attaches to the tile itself (useTooltip, not HoverTip) so the tile
  // keeps its full grid-cell width instead of shrinking to an inline wrapper.
  const { tipProps, tipNode } = useTooltip(`${badge.name} - unlockable`, { size: "sm" });

  return (
    <span
      {...tipProps}
      data-testid={`home-badge-${index}`}
      className={`group flex h-[53px] w-full items-center justify-center rounded-[14px] border border-[#1f1f1f] bg-[#121212] transition-colors duration-200 ${visible ? "sw-badge-in" : "opacity-0"} ${badge.staff ? "opacity-40 saturate-50" : ""}`}
      style={{
        animationDelay: visible ? `${Math.min(index * 34, 900)}ms` : undefined,
        boxShadow: `inset 0 0 22px ${badge.color}14`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = badge.color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#1f1f1f";
      }}
    >
      {tipNode}
      <badge.Icon className="h-[22px] w-[22px]" style={{ color: badge.color }} />
    </span>
  );
};

export const HomeBadges = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} data-testid="home-badges" className="relative px-4 py-24">
      <div className="mx-auto max-w-[1024px]">
        <SectionPill>Badges</SectionPill>
        <h2 className="mt-5 max-w-[560px] font-display text-[34px] font-bold leading-[1.15] tracking-tight text-white sm:text-[38px]">
          33 badges total, 27 of them earnable.
        </h2>
        <p className="mt-3 text-[15px] text-[#9fa2af]">4 are staff-only, 2 are no longer available.</p>

        <div
          className="mt-9 grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))" }}
          data-testid="home-badge-grid"
        >
          {BADGES.map((badge, i) => (
            <Tile key={`${badge.name}-${i}`} badge={badge} index={i} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeBadges;
