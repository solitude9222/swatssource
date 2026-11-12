import { Link } from "react-router-dom";
import { ChevronDown, Globe } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";
import { Logo } from "./Navbar";

/* The footer, to the reference: wordmark + tagline, a language control, two
   short link columns, the community card, then the legal row. */

const COLUMNS = [
  {
    title: "INFORMAL",
    links: [
      ["Pricing", "/!/pricing"],
      ["Team", "/!/docs"],
      ["Leaderboard", "/!/ranked"],
    ],
  },
  {
    title: "RESOURCES",
    links: [
      ["Help Center", "/!/docs"],
      ["Redeem Code", "/!/dashboard"],
    ],
  },
];

export const Footer = () => (
  <footer data-testid="site-footer" className="relative border-t border-[#1f1f1f] px-4 pb-10 pt-14">
    <div className="mx-auto max-w-[1150px]">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
        <div>
          <Logo compact />
          <p className="mt-4 max-w-[280px] text-[13px] leading-relaxed text-[#9fa2af]">
            The modern solution for your personal biolink website. Simple, fast, and fully customizable.
          </p>

          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-[#1f1f1f] bg-[#111111] px-3 py-2 text-[12px] font-semibold text-[#9fa2af]"
            aria-label="Language"
          >
            <Globe className="h-3.5 w-3.5" />
            English
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="font-mono2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#4c5568]">{col.title}</div>
            <ul className="mt-4 space-y-3">
              {col.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-[13px] font-medium text-[#9fa2af] transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="rounded-[16px] border border-[#1f1f1f] bg-[#111111] p-4">
          <div className="text-[13px] font-bold text-white">Join our community</div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#9fa2af]">
            Connect with other creators, and stay updated with the latest features.
          </p>
          <a
            href="https://discord.gg/a9uwptuepD"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-[10px] border border-[#1f1f1f] bg-[#151515] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:border-[#27397c]"
          >
            <FaDiscord className="h-4 w-4 text-[#8ea1ff]" />
            Discord Server
          </a>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#1f1f1f] pt-6 text-[11px] text-[#5e7191] sm:flex-row">
        <span>© {new Date().getFullYear()} tourn.lol. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link to="/!/legal#legal-terms-of-service" className="transition-colors hover:text-white">Terms</Link>
          <Link to="/!/legal#legal-privacy-policy" className="transition-colors hover:text-white">Privacy</Link>
          <Link to="/!/legal" className="transition-colors hover:text-white">Cookies</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
