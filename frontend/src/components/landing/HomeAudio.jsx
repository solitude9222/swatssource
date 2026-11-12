import { useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { SectionPill } from "./SectionPill";

/* "Music on your profile." — the four player styles.

   A segmented control switches between stand-in players drawn at the reference's
   own proportions: Compact, Lyrics (cover-coloured, blurred), Marquee (one slim
   strip) and Vinyl (a spinning record). These are specimens, not the dashboard
   player, so they carry their own small markup and no audio engine. */

const STYLES = [
  { id: "compact", label: "Compact", caption: "One row: cover, title, transport, progress." },
  { id: "lyrics", label: "Lyrics", caption: "Lyrics that follow playback line by line." },
  { id: "marquee", label: "Marquee", caption: "A slim strip, the title runs through it. No transport." },
  { id: "vinyl", label: "Vinyl", caption: "A record in the card edge, spinning while it plays." },
];

const Cover = ({ className = "" }) => (
  <span
    className={`block shrink-0 rounded-[8px] ${className}`}
    style={{ background: "linear-gradient(135deg, #f2a9c4, #8b5cf6 55%, #1f2937)" }}
  />
);

const Equalizer = () => (
  <span className="flex items-end gap-[2px]">
    {[6, 11, 7, 12].map((h, i) => (
      <span
        key={i}
        className="w-[2px] rounded-full bg-[#74a0f8]"
        style={{ height: h, animation: `sw-float ${1.1 + i * 0.2}s ease-in-out infinite` }}
      />
    ))}
  </span>
);

const CompactPlayer = () => (
  <div data-testid="audio-style-compact" className="w-full max-w-[508px] overflow-hidden rounded-[14px] border border-[#2e2e2e] bg-[#161616] p-3">
    <div className="flex items-center gap-3">
      <Cover className="h-[66px] w-[66px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Equalizer />
          <div className="truncate text-[13px] font-bold text-white">Blinding Lights</div>
        </div>
        <div className="truncate text-[11px] text-[#9fa2af]">The Weeknd · After Hours</div>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="font-mono2 text-[10px] text-[#9fa2af]">1:18</span>
          <span className="relative h-[3px] flex-1 rounded-full bg-[#52565e]">
            <span className="absolute inset-y-0 left-0 w-[41%] rounded-full bg-white" />
          </span>
          <span className="font-mono2 text-[10px] text-[#5e7191]">3:10</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[#9fa2af]">
        <Volume2 className="h-3.5 w-3.5" />
        <SkipBack className="h-3.5 w-3.5" />
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6a6b70] text-white">
          <Pause className="h-4 w-4" />
        </span>
        <SkipForward className="h-3.5 w-3.5" />
      </div>
    </div>
  </div>
);

const LyricsPlayer = () => (
  <div className="relative w-full max-w-[508px] overflow-hidden rounded-[14px] border border-[#3a2b35] p-4" data-testid="audio-style-lyrics">
    <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(140deg, #4a2130, #2b1620 55%, #161018)", filter: "blur(2px)" }} />
    <div className="relative">
      <div className="flex items-center gap-3">
        <Cover className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold text-white">Blinding Lights</div>
          <div className="truncate text-[11px] text-[#d9c3cc]">The Weeknd</div>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
          <Pause className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 space-y-1.5 text-center">
        <div className="text-[11px] text-white/35 blur-[1px]">I said, ooh, I'm blinded by the lights</div>
        <div className="text-[14px] font-bold text-white">No, I can't sleep until I feel your touch</div>
        <div className="text-[11px] text-white/35 blur-[1px]">I said, ooh, I'm drowning in the night</div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="font-mono2 text-[10px] text-white/60">1:18</span>
        <span className="relative h-[3px] flex-1 rounded-full bg-white/20">
          <span className="absolute inset-y-0 left-0 w-[41%] rounded-full bg-white" />
        </span>
        <span className="font-mono2 text-[10px] text-white/45">3:10</span>
      </div>
    </div>
  </div>
);

const MarqueePlayer = () => (
  <div className="w-full max-w-[508px]" data-testid="audio-style-marquee">
    <div className="flex items-center gap-3 px-1 py-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black">
        <Play className="h-3.5 w-3.5" />
      </span>
      <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="animate-marquee-left whitespace-nowrap text-[13px] font-semibold text-white">
          <span className="pr-10">Tyler, The Creator · EARFQUAKE</span>
          <span className="pr-10">Tyler, The Creator · EARFQUAKE</span>
        </div>
      </div>
      <Volume2 className="h-4 w-4 text-[#9fa2af]" />
    </div>
  </div>
);

const VinylPlayer = () => (
  <div className="w-full max-w-[508px] overflow-hidden rounded-[14px] border border-[#2e2e2e] bg-[#141416] p-4" data-testid="audio-style-vinyl">
    <div className="flex items-start gap-4">
      <div className="relative h-[90px] w-[90px] shrink-0">
        <div className="absolute inset-0 rounded-full border border-[#2e2e2e] bg-[radial-gradient(circle,#2a2a2e_0%,#101012_55%,#050506_100%)]">
          {[12, 20, 28, 36, 44].map((inset) => (
            <span key={inset} className="absolute rounded-full border border-white/[0.06]" style={{ inset }} />
          ))}
          <span className="absolute inset-[28px] rounded-full border border-black/60 bg-[linear-gradient(135deg,#f2a9c4,#8b5cf6)]" />
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0b0d]" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[14px] font-bold text-white">Blinding Lights</div>
            <div className="truncate text-[11px] text-[#9fa2af]">The Weeknd</div>
          </div>
          <div className="flex items-center gap-1.5 text-[#9fa2af]">
            <VolumeMute />
            <SkipBack className="h-3.5 w-3.5" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6a6b70] text-white">
              <Pause className="h-3.5 w-3.5" />
            </span>
            <SkipForward className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 truncate text-[11px] font-semibold italic text-[#c7d0e0]">
          I'm blinded by the lights
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="font-mono2 text-[10px] text-[#9fa2af]">1:18</span>
          <span className="relative h-[3px] flex-1 rounded-full bg-[#52565e]">
            <span className="absolute inset-y-0 left-0 w-[41%] rounded-full bg-white" />
          </span>
          <span className="font-mono2 text-[10px] text-[#5e7191]">3:10</span>
        </div>
      </div>
    </div>
  </div>
);

const VolumeMute = () => <VolumeX className="h-3.5 w-3.5" />;

export const HomeAudio = () => {
  const [style, setStyle] = useState("compact");
  const active = STYLES.find((s) => s.id === style) || STYLES[0];

  return (
    <section data-testid="home-audio" className="relative px-4 py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 50% at 50% 55%, rgba(8,16,32,0.9), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-[900px] text-center">
        <SectionPill>Audio player</SectionPill>
        <h2 className="mt-5 font-display text-[34px] font-bold tracking-tight text-white sm:text-[36px]">
          Music on your profile.
        </h2>
        <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-relaxed text-[#9fa2af]">
          Upload a track, pick a style, done. Two of the four styles show lyrics as well.
        </p>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-[#1f1f1f] bg-[#111111] p-1">
            {STYLES.map((s) => {
              const on = s.id === style;
              return (
                <button
                  key={s.id}
                  type="button"
                  data-testid={`audio-tab-${s.id}`}
                  onClick={() => setStyle(s.id)}
                  aria-pressed={on}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors ${
                    on ? "border border-[#3965e6] bg-[#0d1428] text-white" : "border border-transparent text-[#7b8496] hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-3 min-h-[18px] text-[12px] text-[#5e7191]" data-testid="audio-caption">
          {active.caption}
        </p>

        <div key={style} className="mt-7 flex justify-center animate-[sw-fade-up_0.28s_ease-out]">
          {style === "compact" && <CompactPlayer />}
          {style === "lyrics" && <LyricsPlayer />}
          {style === "marquee" && <MarqueePlayer />}
          {style === "vinyl" && <VinylPlayer />}
        </div>
      </div>
    </section>
  );
};

export default HomeAudio;
