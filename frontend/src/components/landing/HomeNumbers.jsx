import { useEffect, useRef, useState } from "react";
import { Users, Eye, LayoutGrid, ShieldCheck, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { SectionPill } from "./SectionPill";

/* "The numbers so far" — the bento of real figures.

   Only what the API actually sends is printed: the account count and the total
   profile views. The two fixed figures (15 widget platforms, 33 badges) are
   facts of the product, not invented usage. Every number counts up once, when
   the grid first scrolls into view. */

const useCountUp = (target, active, duration = 3200) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || !target) return undefined;
    let frame;
    let start;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * target));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);
  return value;
};

const fmt = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K+`;
  return `${n}`;
};

const StatTile = ({ icon: Icon, label, value, tall = false, testid }) => (
  <div
    data-testid={testid}
    className={`group relative overflow-hidden rounded-[24px] border border-[#1f1f1f] bg-[#111111] p-6 transition-colors duration-200 hover:border-[#3965e6] ${tall ? "h-full min-h-[290px]" : ""}`}
  >
    <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#1f1f1f] bg-[#151515]">
      <Icon className="h-4 w-4 text-[#74a0f8]" />
    </span>
    <div className={`mt-6 font-display font-extrabold leading-none tracking-tight text-white ${tall ? "text-[60px]" : "text-[44px]"}`}>
      {value}
    </div>
    <div className="mt-3 text-[13px] font-semibold text-[#9fa2af]">{label}</div>
    <Icon
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 text-white opacity-[0.03]"
    />
  </div>
);

export const HomeNumbers = () => {
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let alive = true;
    api.get("/stats")
      .then(({ data }) => {
        if (alive) setStats(data && typeof data === "object" ? data : {});
      })
      .catch(() => {
        if (alive) setStats({});
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(([entry]) => entry.isIntersecting && setActive(true), { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const users = Number(stats?.bio_links) || 0;
  const views = Number(stats?.total_views) || 0;
  const shownUsers = useCountUp(users, active);
  const shownViews = useCountUp(views, active);

  return (
    <section ref={ref} data-testid="home-numbers" className="relative px-4 py-24">
      <div className="mx-auto max-w-[1150px]">
        <SectionPill>Community</SectionPill>
        <h2 className="mt-5 font-display text-[34px] font-bold tracking-tight text-white sm:text-[36px]">
          The numbers so far
        </h2>
        <p className="mt-3 text-[15px] text-[#9fa2af]">A quick look at how the platform is being used.</p>

        <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:row-span-2 lg:col-span-4">
            <StatTile icon={Users} label="Registered Users" value={stats ? fmt(shownUsers) : "—"} tall testid="home-stat-users" />
          </div>

          <div className="lg:col-span-4">
            <StatTile icon={Eye} label="Profile Views" value={stats ? fmt(shownViews) : "—"} testid="home-stat-views" />
          </div>
          <div className="lg:col-span-4">
            <StatTile icon={LayoutGrid} label="Widget Platforms" value="15" testid="home-stat-platforms" />
          </div>

          <div className="lg:col-span-4">
            <StatTile icon={ShieldCheck} label="Badges In The Catalogue" value="33" testid="home-stat-badges" />
          </div>

          <div className="sm:col-span-2 lg:col-span-8">
            <ClaimCard users={stats ? shownUsers : null} />
          </div>
        </div>
      </div>
    </section>
  );
};

const ClaimCard = ({ users }) => {
  const [alias, setAlias] = useState("");
  const name = alias.replace(/\s/g, "").toLowerCase();

  return (
    <div
      data-testid="home-numbers-cta"
      className="relative flex h-full min-h-[180px] flex-col justify-center overflow-hidden rounded-[24px] border border-[#1f1f1f] bg-[#111111] p-6 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "radial-gradient(90% 120% at 90% 0%, rgba(57,101,230,0.24), transparent 60%)" }}
      />
      <h3 className="relative max-w-[420px] font-display text-[24px] font-bold leading-snug tracking-tight text-white">
        Already <span className="text-[#74a0f8]">{users == null ? "many" : users.toLocaleString()}</span> people have a tourn.lol profile.
      </h3>
      <form
        className="relative mt-5 flex flex-col gap-2.5 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (name) window.location.assign(`/!/register?claim=${encodeURIComponent(name)}`);
        }}
      >
        <label className="flex h-[46px] flex-1 items-center rounded-[10px] border border-[#1f1f1f] bg-[#0b0c0f] px-3.5">
          <span className="font-mono2 text-[13px] text-[#5e7191]">tourn.lol/</span>
          <input
            data-testid="home-claim-input"
            value={alias}
            onChange={(e) => setAlias(e.target.value.replace(/\s/g, ""))}
            placeholder="username"
            className="min-w-0 flex-1 bg-transparent px-1 text-[13px] text-white outline-none placeholder:text-[#4c5568]"
          />
        </label>
        <button
          type="submit"
          data-testid="home-claim-btn"
          disabled={!name}
          className="inline-flex h-[46px] items-center justify-center gap-2 rounded-[10px] bg-[#3965e6] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#4a73ee] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Claim Your Username
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};

export default HomeNumbers;
