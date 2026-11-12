import { useEffect, useState } from "react";
import { MapPin, ThumbsUp, ThumbsDown, Eye } from "lucide-react";
import { FaDiscord, FaSpotify } from "react-icons/fa6";
import { Link as LinkIcon } from "lucide-react";
import { SectionPill } from "./SectionPill";

/* "Three looks. One editor."

   Three example pages, not live accounts: a big framed preview and two
   thumbnails that swap with it. It rotates on its own and obeys a click, so the
   section still proves the variety on a page nobody touches. */

const LOOKS = [
  {
    handle: "@eivoran",
    name: "Eivoran",
    accent: "#7c9cff",
    handleColor: "#93b4ff",
    bg: "linear-gradient(160deg, #223a5e 0%, #101a2c 55%, #070a12 100%)",
    location: "trust in god",
    bio: ["Building the quiet part of the internet.", "Photos, links and a little noise."],
    joined: "Joined 187 years ago",
    views: 18400,
    likes: 214,
    dislikes: 6,
  },
  {
    handle: "@monty",
    name: "Monty",
    accent: "#f2a9c4",
    handleColor: "#ffc3d8",
    bg: "linear-gradient(160deg, #5a2b3c 0%, #2a1620 55%, #0d0709 100%)",
    location: "sunset chaser",
    bio: ["Ocean air, palm trees, bad sleep.", "Everything I make lives here."],
    joined: "Joined 9 years ago",
    views: 9300,
    likes: 156,
    dislikes: 2,
  },
  {
    handle: "@parrot",
    name: "Parrot",
    accent: "#8be0b4",
    handleColor: "#b6f2d1",
    bg: "linear-gradient(160deg, #1f4b3c 0%, #102a22 55%, #060d0a 100%)",
    location: "somewhere warm",
    bio: ["Loud colours, louder playlists.", "Say hi in the Discord."],
    joined: "Joined 4 years ago",
    views: 22100,
    likes: 341,
    dislikes: 11,
  },
];

const Glyph = ({ look, big = false }) => (
  <span
    className={`flex items-center justify-center rounded-full border border-white/25 font-display font-black text-white/90 ${big ? "h-[86px] w-[86px] text-3xl" : "h-8 w-8 text-[11px]"}`}
    style={{ background: `linear-gradient(135deg, ${look.accent}, rgba(0,0,0,0.4))` }}
  >
    {look.name[0]}
  </span>
);

const PageMock = ({ look }) => (
  <div
    data-testid="profile-pages-big"
    className="relative h-full w-full overflow-hidden rounded-[16px] border border-[#1f1f1f]"
    style={{ background: look.bg }}
  >
    <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 0%, transparent 20%, rgba(0,0,0,0.75) 100%)" }} />

    <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
      <MapPin className="h-3 w-3" style={{ color: look.accent }} />
      {look.location}
    </span>

    <div className="absolute left-1/2 top-1/2 w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-white/15 bg-black/35 p-5 text-center backdrop-blur-xl">
      <div className="flex justify-center"><Glyph look={look} big /></div>
      <div className="mt-3 font-display text-[19px] font-extrabold text-white">{look.name}</div>
      <div className="text-[11px] font-semibold" style={{ color: look.handleColor }}>{look.handle}</div>
      <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-white/70">
        {look.bio.map((line) => <p key={line}>{line}</p>)}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        {[FaDiscord, FaSpotify, LinkIcon].map((Icon, i) => (
          <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/80">
            <Icon className="h-3 w-3" />
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-3 text-[10px] font-semibold text-white/55">
        <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{look.likes}</span>
        <span className="inline-flex items-center gap-1"><ThumbsDown className="h-3 w-3" />{look.dislikes}</span>
      </div>
    </div>

    <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 font-mono2 text-[10px] text-white/70 backdrop-blur">
      <span style={{ color: look.handleColor }}>{look.handle}</span>
      <span className="text-white/25">·</span>
      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{look.views.toLocaleString()}</span>
      <span className="text-white/25">·</span>
      <span>{look.joined}</span>
    </div>
  </div>
);

const Thumb = ({ look, active, onClick, testid }) => (
  <button
    type="button"
    data-testid={testid}
    onClick={onClick}
    className={`relative h-[265px] w-full overflow-hidden rounded-[16px] border text-left transition-all duration-300 ${active ? "border-[#3965e6] opacity-100" : "border-[#1f1f1f] opacity-70 hover:opacity-100"}`}
    style={{ background: look.bg }}
  >
    <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.8))" }} />
    <div className="absolute left-4 top-4 flex items-center gap-2">
      <Glyph look={look} />
      <span className="font-mono2 text-[11px] font-bold" style={{ color: look.handleColor }}>{look.handle}</span>
    </div>
    <div className="absolute bottom-4 left-4 right-4">
      <div className="font-display text-[20px] font-extrabold text-white">{look.name}</div>
      <div className="mt-1 truncate text-[11px] text-white/60">{look.bio[0]}</div>
    </div>
  </button>
);

export const HomeProfiles = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % LOOKS.length), 5200);
    return () => clearInterval(t);
  }, []);

  const look = LOOKS[active];

  return (
    <section data-testid="home-profile-pages" className="relative px-4 py-24">
      <div className="mx-auto max-w-[1150px]">
        <SectionPill>Profile Pages</SectionPill>
        <h2 className="mt-5 font-display text-[34px] font-bold tracking-tight text-white sm:text-[36px]">
          Three looks. One editor.
        </h2>
        <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-[#9fa2af]">
          Switch between live profile previews and see how different a tourn.lol page can feel.
        </p>

        <div className="mt-9 grid gap-5 lg:grid-cols-[minmax(0,810px)_minmax(0,320px)]">
          <div key={active} className="h-[560px] animate-[sw-fade-up_0.35s_ease-out]">
            <PageMock look={look} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {[1, 2].map((offset) => {
              const index = (active + offset) % LOOKS.length;
              return (
                <Thumb
                  key={LOOKS[index].handle}
                  look={LOOKS[index]}
                  active={false}
                  testid={`profile-pages-thumb-${offset}`}
                  onClick={() => setActive(index)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeProfiles;
