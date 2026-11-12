import { ExternalLink, Clock, CalendarDays, Disc3, Star, Swords, Gamepad2, Monitor, Sparkles, Trophy } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";
import { SectionPill } from "./SectionPill";
import { PLATFORMS } from "@/constants/platforms";

/* "Your profile, live." — the widgets band.

   Four compact specimens, drawn at the size the reference uses so the row reads
   as a stack of real cards rather than four full-size widgets. The presence
   card is pinned to the same user id the site demos with; the Spotify card is a
   real embed of the track the owner supplied, so the title/artwork are Spotify's
   own rather than a hand-typed guess. */

const DEMO_UID = "1546745348020772915";
const SPOTIFY_TRACK = "https://open.spotify.com/track/2t6Z0vjOUQsy3FkBstdvUw?si=d374682914f8456a";
const SPOTIFY_EMBED = "https://open.spotify.com/embed/track/2t6Z0vjOUQsy3FkBstdvUw?utm_source=generator&theme=0";

const CardLabel = ({ children, dot }) => (
  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b8496]">
    {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
    {children}
  </span>
);

const Specimen = ({ children, label, labelDot, className = "" }) => (
  <article
    className={`relative flex h-[78px] w-full items-center gap-3 overflow-hidden rounded-[16px] border border-[#2e2e2e] bg-[#161616] px-3 ${className}`}
    style={{ transition: "border-color .2s ease, transform .2s ease" }}
  >
    {label && <span className="absolute right-3 top-2"><CardLabel dot={labelDot}>{label}</CardLabel></span>}
    {children}
  </article>
);

const PresenceCard = () => (
  <Specimen>
    <div className="relative h-11 w-11 shrink-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#1d2438] text-sm font-bold text-white/80">t</div>
      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#161616] bg-[#6b7280]" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        <span className="truncate text-[13px] font-bold text-white">tourn</span>
        <span className="rounded-[5px] border border-[#2e2e2e] bg-[#121212] px-1 py-px text-[9px] font-bold uppercase tracking-wider text-[#9fa2af]">
          FIB
        </span>
        <span className="flex items-center gap-0.5">
          {[Gamepad2, Swords, Monitor, Sparkles, Trophy, Star, Disc3].map((Icon, i) => (
            <Icon
              key={i}
              className="h-2.5 w-2.5"
              style={{ color: ["#f472b6", "#fbbf24", "#60a5fa", "#a78bfa", "#34d399", "#f97316", "#22d3ee"][i] }}
            />
          ))}
        </span>
      </div>
      <div className="mt-0.5 truncate font-mono2 text-[10px] text-[#7b8496]" title={`ID ${DEMO_UID}`}>
        ID {DEMO_UID}
      </div>
    </div>
    <span className="shrink-0 self-end pb-2 text-[10px] text-[#5e7191]">last seen 9 hours ago</span>
  </Specimen>
);

const ServerCard = () => (
  <Specimen label="Discord" labelDot="#5865F2">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-white/10 bg-[#1b2140] text-[#8ea1ff]">
      <FaDiscord className="h-5 w-5" />
    </span>
    <div className="min-w-0 flex-1">
      <div className="truncate text-[13px] font-bold text-white">tourn.lol</div>
      <div className="mt-0.5 overflow-hidden">
        <div className="animate-marquee-left whitespace-nowrap text-[10px] text-[#7b8496]">
          <span className="pr-6">The official tourn.lol community — support, updates and showcase.</span>
          <span className="pr-6">The official tourn.lol community — support, updates and showcase.</span>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-2 font-mono2 text-[9.5px] text-[#9fa2af]">
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />32 Online</span>
        <span className="text-[#4c5568]">●</span>
        <span>482 Members</span>
        <span className="text-[#4c5568]">★</span>
        <span>Level 3</span>
      </div>
    </div>
  </Specimen>
);

const SpotifyCard = () => (
  <Specimen label="Spotify" labelDot="#1DB954">
    <div className="relative w-full overflow-hidden rounded-[10px]">
      <iframe
        title="Spotify track"
        src={SPOTIFY_EMBED}
        width="100%"
        height="80"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block h-[68px] w-full rounded-[10px]"
        style={{ border: 0 }}
      />
    </div>
    <a
      href={SPOTIFY_TRACK}
      target="_blank"
      rel="noreferrer"
      aria-label="Open the track on Spotify"
      className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-md border border-[#2e2e2e] bg-[#121212] text-[#9fa2af] transition-colors hover:text-white"
    >
      <ExternalLink className="h-3 w-3" />
    </a>
  </Specimen>
);

const ValorantCard = () => (
  <Specimen label="Valorant" labelDot="#ff4655">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#ff4655]/30 bg-[#2a1216]">
      <Swords className="h-5 w-5 text-[#ff4655]" />
    </span>
    <div className="min-w-0 flex-1">
      <div className="truncate text-[13px] font-bold text-white">psyduck#huh</div>
      <div className="mt-0.5 text-[10px] text-[#7b8496]">Platinum 1</div>
      <div className="mt-1 flex items-center gap-2.5 font-mono2 text-[9.5px] text-[#9fa2af]">
        <span className="inline-flex items-center gap-1"><Gamepad2 className="h-2.5 w-2.5" /> 412</span>
        <span className="inline-flex items-center gap-1"><Trophy className="h-2.5 w-2.5" /> 18</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> 240h</span>
        <span className="inline-flex items-center gap-1"><CalendarDays className="h-2.5 w-2.5" /> 2021</span>
      </div>
    </div>
  </Specimen>
);

export const HomeWidgets = () => (
  <section data-testid="home-widgets" className="relative px-4 py-24">
    <div className="mx-auto grid max-w-[1024px] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16">
      <div>
        <SectionPill>Widgets</SectionPill>
        <h2 className="mt-5 font-display text-[34px] font-bold leading-tight tracking-tight text-white sm:text-[36px]">
          Your profile, <span className="text-[#4a73ee]">live.</span>
        </h2>
        <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-[#9fa2af]">
          Discord status, what is playing, game stats. Connect once, the widgets keep
          themselves current after that.
        </p>

        <div className="mt-7 flex max-w-[420px] flex-wrap items-center gap-2">
          {PLATFORMS.slice(0, 15).map(({ id, name, Icon, color }) => (
            <span
              key={id}
              title={name}
              className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#1f1f1f] bg-[#121212]"
            >
              <Icon className="h-3.5 w-3.5" style={{ color }} />
            </span>
          ))}
        </div>
        <div className="mt-3 font-mono2 text-[11px] uppercase tracking-[0.18em] text-[#5e7191]">15 platforms</div>
      </div>

      <div className="space-y-[18px]">
        <PresenceCard />
        <div className="sm:translate-x-12"><ServerCard /></div>
        <SpotifyCard />
        <div className="sm:translate-x-12"><ValorantCard /></div>
      </div>
    </div>
  </section>
);

export default HomeWidgets;
