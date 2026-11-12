import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, ThumbsUp, ThumbsDown, Crown, BadgeCheck, Landmark, Award, Tag } from "lucide-react";
import { FaDiscord, FaSpotify } from "react-icons/fa6";
import { Link as LinkIcon } from "lucide-react";
import { BoltField } from "./Bolts";
import { HoverTip } from "@/components/FxTooltip";

/* The hero, rebuilt to the reference.

   Left: the wordmark drawn as type, the promise, and the two real ways in
   (create an account / look at pricing). Right: a demo profile card wearing the
   border beam, a typewriter line, a badge pill and its three round links — the
   card is the argument, so it is built at full fidelity rather than described.

   The demo card is deliberately self-contained: no API, no owner data. Its one
   identifier is the presence preview's user id, shown in the meta line and on
   the name's hover tip, so the page has something concrete to demo without
   asking the backend for a stranger's profile. */

const DEMO_UID = "1546745348020772915";

const PHRASES = ["owner @ tourn.lol", "discord.gg/tourn", "highlights & links"];

/* Types forward at ~6 chars/s, holds, deletes twice as fast, next phrase. One
   interval, cleared on unmount, so the caret never keeps typing after the
   section is gone. */
const useTypewriter = (phrases, typeMs = 160, holdMs = 2500, deleteMs = 80) => {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[index % phrases.length];
    if (!deleting && text === phrase) {
      const hold = setTimeout(() => setDeleting(true), holdMs);
      return () => clearTimeout(hold);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
      return undefined;
    }
    const step = setTimeout(() => {
      setText((t) => (deleting ? phrase.slice(0, Math.max(0, t.length - 1)) : phrase.slice(0, t.length + 1)));
    }, deleting ? deleteMs : typeMs);
    return () => clearTimeout(step);
  }, [text, deleting, index, phrases, typeMs, holdMs, deleteMs]);

  return text;
};

const DemoBadges = () => {
  const badges = [
    { id: "owner", label: "Owner", Icon: Crown, color: "#fbbf24" },
    { id: "verified", label: "Verified", Icon: BadgeCheck, color: "#74a0f8" },
    { id: "bank", label: "Gifter", Icon: Landmark, color: "#34d399" },
    { id: "ribbon", label: "First Place", Icon: Award, color: "#f472b6" },
  ];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2 py-1 backdrop-blur">
      {badges.map(({ id, label, Icon, color }) => (
        <HoverTip key={id} label={label} size="sm">
          <span
            title={label}
            className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] border border-white/10 bg-black/40"
            style={{ boxShadow: `0 0 10px ${color}44` }}
          >
            <Icon className="h-3 w-3" style={{ color }} />
          </span>
        </HoverTip>
      ))}
    </span>
  );
};

const DemoCard = () => {
  const typed = useTypewriter(PHRASES);
  return (
    <div className="relative mx-auto w-full max-w-[720px]">
      <div
        data-testid="hero-demo-card"
        className="sw-beam relative overflow-hidden rounded-[38px] border border-white/15 bg-[#0d1226]/55 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:p-8"
      >
        {/* Glass sheen, kept off the content layer. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[38px]"
          style={{ background: "radial-gradient(120% 90% at 20% 0%, rgba(255,255,255,0.10), transparent 55%)" }}
        />

        <div className="relative flex items-start gap-5">
          {/* Avatar with an animated sparkle ring */}
          <div className="relative h-[100px] w-[100px] shrink-0">
            <span className="absolute -inset-1.5 rounded-full opacity-80 blur-[6px]" style={{ background: "conic-gradient(from 0deg, #3965e6, #7c5cf0, #74a0f8, #3965e6)" }} />
            <div className="relative flex h-full w-full items-center justify-center rounded-full border border-white/25 bg-[#151b33] text-3xl font-black text-white/85">
              t
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <HoverTip label={`ID ${DEMO_UID}`}>
                <span className="cursor-help font-display text-2xl font-extrabold tracking-tight text-white sm:text-[26px]">
                  tourn
                </span>
              </HoverTip>
              <DemoBadges />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-[#9fa2af]">
              <span className="font-mono2">ID {DEMO_UID}</span>
              <span className="text-[#4c5568]">·</span>
              <span>Joined 57 years ago</span>
            </div>

            <p className="mt-3 h-6 font-mono2 text-[13px] text-[#c7d0e0]">
              {typed}
              <span className="sw-caret ml-0.5 inline-block h-[14px] w-[7px] translate-y-[2px] bg-[#74a0f8]" />
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[12px] font-semibold text-white/90">
            <Eye className="h-3.5 w-3.5 text-[#74a0f8]" />
            77
          </div>
        </div>

        <div className="relative mt-6 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {[
              { id: "discord", Icon: FaDiscord, label: "Discord", color: "#8ea1ff" },
              { id: "spotify", Icon: FaSpotify, label: "Spotify", color: "#1DB954" },
              { id: "link", Icon: LinkIcon, label: "All links", color: "#74a0f8" },
            ].map(({ id, Icon, label, color }) => (
              <HoverTip key={id} label={label} size="sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/90 backdrop-blur transition-colors hover:border-white/30">
                  <Icon className="h-4 w-4" style={{ color }} />
                </span>
              </HoverTip>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[12px] font-semibold text-[#9fa2af]">
            <span className="inline-flex items-center gap-1.5">
              <ThumbsUp className="h-3.5 w-3.5 text-[#74a0f8]" /> 128
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ThumbsDown className="h-3.5 w-3.5 text-[#7b8496]" /> 3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Hero = () => (
  <section
    data-testid="hero-section"
    className="relative overflow-hidden px-4 pb-24 pt-32 sm:pt-36 lg:pb-28"
    style={{
      background:
        "linear-gradient(180deg, #010101 0px, #0b0f26 60px, #15204c 150px, #161f4b 200px, #141d47 320px, #121c40 480px, #0f1735 640px, #0b1021 800px, #080910 960px, #09080b 1040px)",
    }}
  >
    <BoltField rows={9} cols={9} color="rgba(30,45,101,0.9)" />

    <div className="relative z-10 mx-auto grid max-w-[1260px] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,720px)] lg:gap-10">
      <div className="max-w-[560px]">
        <h1 className="font-display text-[64px] font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-[96px] xl:text-[128px]">
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #ffffff 20%, #d7dce4 55%, #bfc5cd 100%)" }}
          >
            tourn
          </span>
          <span className="text-[#5381f2]">.</span>
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #ffffff 20%, #d7dce4 55%, #bfc5cd 100%)" }}
          >
            lol
          </span>
        </h1>

        <p className="mt-6 max-w-[470px] text-[17px] leading-relaxed text-[#9fa2af]">
          The all-in-one biolink platform for creators, influencers &amp; professionals.
          Customize everything, track analytics, and grow your audience.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            to="/!/register"
            className="inline-flex h-[51px] items-center justify-center rounded-[10px] bg-[#3965e6] px-7 text-[15px] font-bold text-white transition hover:bg-[#4a73ee]"
          >
            Create account
          </Link>
          <Link
            to="/!/pricing"
            className="inline-flex h-[51px] items-center justify-center gap-2 rounded-[10px] border border-[#1f1f1f] bg-[#111111] px-6 text-[15px] font-bold text-white transition hover:border-[#27397c]"
          >
            <Tag className="h-4 w-4 text-[#74a0f8]" />
            View pricing
          </Link>
        </div>
      </div>

      <DemoCard />
    </div>
  </section>
);

export default Hero;
