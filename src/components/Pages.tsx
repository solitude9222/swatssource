import { useEffect, useState } from "react";
import { api } from "../lib/backend";
import { useAuth, type Account } from "../lib/auth";
import { formatJoined } from "../lib/format";
import { ArrowRight, BoltIcon, CheckIcon, ChevronIcon, ExternalIcon, TrophyIcon } from "./Icons";
export function LeaderboardPage({ onSignUp }: { onSignUp: () => void }) {
  const { first } = useAuth();
  const [rows, setRows] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const result = await api<{ profiles: Account[] }>("/api/profiles?limit=25");
      if (!active) return;
      if (result.ok && result.data.profiles.length) {
        setRows(result.data.profiles);
      } else {
        setRows(first ? [first] : []);
      }
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [first]);

  return (
    <section className="page">
      <div className="wrap page-head" data-reveal>
        <span className="eyebrow eyebrow--sm">leaderboard</span>
        <h1 className="page-title">The board.</h1>
        <p className="page-sub">
          Everyone who claimed a link, in the order they showed up. Ranked play opens with the first
          tournament — until then, being early is the whole flex.
        </p>
      </div>

      <div className="wrap">
        {loading ? (
          <div className="board">
            {[0, 1, 2].map((index) => (
              <div className="board-row" key={index}>
                <span className="skeleton" style={{ width: 34, height: 14 }} />
                <span className="skeleton" style={{ width: 38, height: 38, borderRadius: 12 }} />
                <span className="skeleton" style={{ width: 140, height: 12 }} />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-card" data-reveal>
            <span className="empty-icon">
              <TrophyIcon size={22} />
            </span>
            <h2>No links claimed yet.</h2>
            <p>The first account takes the top of the board — permanently.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={onSignUp}>
              Claim #1
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="board">
            {rows.map((row, index) => (
              <div
                className="board-row"
                key={row.id}
                data-reveal
                data-reveal-delay={index * 35}
              >
                <span className="board-rank">{String(index + 1).padStart(2, "0")}</span>
                {row.avatarUrl ? (
                  <img className="avatar avatar--sm" src={row.avatarUrl} alt="" />
                ) : (
                  <span className="avatar avatar--sm avatar--initial">
                    {row.username.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="board-id">
                  <p>{row.username}</p>
                  <span>tourn.lol/{row.username}</span>
                </div>
                <span className="board-joined">Joined {formatJoined(new Date(row.joinedAt))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const SHOP_ITEMS = [
  {
    name: "Bolt frame",
    desc: "An animated ring around your avatar, visible on your bio and the board.",
    price: "250",
    icon: <BoltIcon size={18} />,
    tone: "accent",
  },
  {
    name: "Verified mark",
    desc: "A quiet check next to your handle. Manually reviewed, never sold in bulk.",
    price: "500",
    icon: <CheckIcon size={18} />,
    tone: "green",
  },
  {
    name: "Custom domain",
    desc: "Point yourname.gg at the same bio instead of the tourn.lol path.",
    price: "900",
    icon: <ExternalIcon size={18} />,
    tone: "violet",
  },
];

export function ShopPage({ onSignUp }: { onSignUp: () => void }) {
  return (
    <section className="page">
      <div className="wrap page-head" data-reveal>
        <span className="eyebrow eyebrow--sm">shop</span>
        <h1 className="page-title">Cosmetics, nothing else.</h1>
        <p className="page-sub">
          No pay-to-rank, no boosts, no ads on other people's pages. Just a few things that make
          your link look like yours.
        </p>
      </div>

      <div className="wrap">
        <a className="premium-banner" href="#/premium" data-reveal data-reveal-delay="40">
          <span className="premium-banner-icon" aria-hidden="true">
            <BoltIcon size={20} />
          </span>
          <span className="premium-banner-copy">
            <b>tourn.lol Premium</b>
            <small>Every effect, every audio style, a second claim on swats.bio — one plan.</small>
          </span>
          <span className="premium-banner-cta">
            See Premium
            <ArrowRight size={14} />
          </span>
        </a>

        <div className="shop-grid" data-reveal data-reveal-delay="80">
          {SHOP_ITEMS.map((item, index) => (
            <article
              className="shop-card"
              key={item.name}
              data-reveal
              data-reveal-delay={index * 70}
            >
              <span className={`shop-icon shop-icon--${item.tone}`}>{item.icon}</span>
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
              <div className="shop-foot">
                <span className="shop-price">
                  {item.price}
                  <small>credits</small>
                </span>
                <button type="button" className="mini-btn" disabled>
                  Coming soon
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="shop-note" data-reveal data-reveal-delay="220">
          <p>
            Checkout isn't live during the beta. Create an account now and anything you unlock later
            attaches to the same handle.
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={onSignUp}>
            Create your account
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- premium */

const PREMIUM_PRICE = "$3";

const PREMIUM_COMPARE: { label: string; free: boolean }[] = [
  { label: "Bio page with your handle", free: true },
  { label: "Widget stack (all platforms)", free: true },
  { label: "Links with custom icons", free: true },
  { label: "Badges & badge styling", free: true },
  { label: "Live Discord / Roblox / Steam / Spotify widgets", free: true },
  { label: "Background & overlay effects beyond None", free: false },
  { label: "Marquee, vinyl & lyrics audio styles", free: false },
  { label: "File-upload audio with full transport", free: false },
  { label: "Glass & Glow link card styles", free: false },
  { label: "Primary claim — tourn.lol/you", free: true },
  { label: "Second claim — swats.bio/you", free: false },
];

const PREMIUM_PERKS = [
  {
    icon: <BoltIcon size={16} />,
    title: "Every effect, unlocked",
    desc: "Rain, snow, shooting stars, aurora and spotlights behind your card — plus VHS, grain and dotters over it. Text effects too: RGB flow, glitch, neon, typewriter.",
  },
  {
    icon: <TrophyIcon size={16} />,
    title: "A second handle, kept forever",
    desc: "Premium claims yourname on swats.bio as well as tourn.lol. Both links stay live, and your claim is checked against every taken handle first.",
  },
  {
    icon: <ExternalIcon size={16} />,
    title: "Audio that actually plays",
    desc: "Marquee strips, a spinning vinyl and lyrics that follow the track line by line. Upload your own file and visitors get real transport controls, not a dead link.",
  },
];

const PREMIUM_FAQ = [
  {
    q: "How much is it?",
    a: `Premium is ${PREMIUM_PRICE}/month once checkout goes live. While tourn.lol is in beta it costs nothing — early accounts keep the perks they've been granted.`,
  },
  {
    q: "How do I get it during the beta?",
    a: "Create an account and you're in the running — Premium is granted to beta supporters and reviewers. Everything else stays free either way.",
  },
  {
    q: "What happens to my second claim if I cancel?",
    a: "Nothing dramatic. The swats.bio claim is released after a grace period so someone else can take it, and every other part of your page keeps working.",
  },
];

export function PremiumPage({ onSignUp }: { onSignUp: () => void }) {
  const { user, isPremiumUser } = useAuth();

  return (
    <section className="page">
      <div className="wrap page-head" data-reveal>
        <span className="eyebrow eyebrow--sm">premium</span>
        <h1 className="page-title">
          Everything, <span className="accent">unlocked.</span>
        </h1>
        <p className="page-sub">
          The core bio link stays free forever. Premium is one plan that turns on every effect,
          every audio style and a second claim on swats.bio — {PREMIUM_PRICE}/month when checkout
          opens, free while the beta runs.
        </p>
      </div>

      <div className="wrap">
        <div className="premium-hero" data-reveal>
          <div className="premium-hero-plan">
            <span className="premium-hero-badge">
              <BoltIcon size={13} />
              {isPremiumUser ? "Active on your account" : "Free while in beta"}
            </span>
            <div className="premium-hero-price">
              <b>{PREMIUM_PRICE}</b>
              <span>/month</span>
            </div>
            <p>
              One plan. No tiers, no credits, no per-effect upsells — the whole platform, every
              future effect included.
            </p>
            {isPremiumUser ? (
              <a className="btn btn-primary btn-sm" href="#/dashboard">
                Manage your page
                <ArrowRight size={13} />
              </a>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={onSignUp}>
                {user ? "Open your dashboard" : "Create your account"}
                <ArrowRight size={13} />
              </button>
            )}
          </div>
          <ul className="premium-hero-points">
            {PREMIUM_PERKS.map((perk) => (
              <li key={perk.title}>
                <span className="premium-perk-icon">{perk.icon}</span>
                <span>
                  <b>{perk.title}</b>
                  <small>{perk.desc}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="premium-table" data-reveal data-reveal-delay="80">
          <div className="premium-table-head">
            <span>What's in the plan</span>
            <span>Free</span>
            <span className="premium-table-head--premium">
              <BoltIcon size={12} /> Premium
            </span>
          </div>
          {PREMIUM_COMPARE.map((row) => (
            <div className="premium-table-row" key={row.label}>
              <span className="premium-table-label">{row.label}</span>
              <span className={`premium-table-cell${row.free ? " is-in" : " is-out"}`}>
                {row.free ? <CheckIcon size={13} /> : "—"}
              </span>
              <span className="premium-table-cell is-in">
                <CheckIcon size={13} />
              </span>
            </div>
          ))}
        </div>

        <div className="premium-faq">
          {PREMIUM_FAQ.map((item, index) => (
            <details className="faq-item" key={item.q} data-reveal data-reveal-delay={index * 45}>
              <summary>
                {item.q}
                <span className="faq-chevron" aria-hidden="true">
                  <ChevronIcon size={16} />
                </span>
              </summary>
              <div className="faq-body">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="shop-note" data-reveal data-reveal-delay="120">
          <p>
            {isPremiumUser
              ? "Premium is already active on this account — everything on this page is unlocked."
              : "Premium isn't purchasable during the beta. Claim your handle now and any grant attaches to the same account later."}
          </p>
          <a className="btn btn-ghost btn-sm" href="#/shop">
            Browse the shop
            <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
