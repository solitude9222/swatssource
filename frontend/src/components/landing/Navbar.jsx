import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BoltIcon } from "./Bolts";

/* The landing navbar has two states, exactly as the spec describes:

     • at the top it is a plain, transparent row: wordmark on the left, links in
       the middle, cart and the blue Sign Up button on the right;
     • once the page scrolls it condenses into a floating pill (1024px wide, 16px
       from the top, #0f0f0f on a #1f1f1f border) holding the same items.

   A signed-in visitor gets Dashboard in place of Sign Up / Login: the pill is
   the only way back to their own page from here, so it must not offer to sign
   them in again. */

const DISCORD = "https://discord.gg/a9uwptuepD";

const NAV = [
  { label: "Discord", href: DISCORD },
  { label: "Team", to: "/!/docs" },
  { label: "Leaderboard", to: "/!/ranked" },
  { label: "Pricing", to: "/!/pricing" },
  { label: "Marketplace", to: "/!/marketplace" },
  { label: "Login", to: "/!/login" },
];

export const Logo = ({ compact = false }) => (
  <Link to="/" data-testid="nav-logo" className="group flex shrink-0 items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#3965e6] to-[#7c5cf0] shadow-[0_6px_20px_rgba(57,101,230,0.35)] transition-transform duration-300 group-hover:scale-105">
      <BoltIcon className="h-4 w-4 text-white" />
    </span>
    <span className={`font-display font-extrabold tracking-tight text-white ${compact ? "text-[18px]" : "text-[22px]"}`}>
      tourn<span className="text-[#5381f2]">.lol</span>
    </span>
  </Link>
);

const NavItem = ({ item, onNavigate }) => {
  const className =
    "rounded-lg px-2.5 py-1.5 text-[14px] font-semibold text-[#9fa2af] transition-colors hover:bg-white/[0.05] hover:text-white";
  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={className} onClick={onNavigate}>
        {item.label}
      </a>
    );
  }
  return (
    <Link to={item.to} className={className} onClick={onNavigate}>
      {item.label}
    </Link>
  );
};

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth() || {};
  const loggedIn = Boolean(user && user !== null && user !== false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 26);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3">
      <nav
        data-testid="top-pill-navbar"
        data-state={scrolled ? "condensed" : "top"}
        className={`flex w-full items-center justify-between transition-all duration-300 ease-out ${
          scrolled
            ? "mt-4 h-[63px] max-w-[1024px] rounded-[16px] border border-[#1f1f1f] bg-[#0f0f0f]/95 px-4 shadow-[0_18px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl"
            : "mt-0 h-[74px] max-w-[1260px] rounded-none border border-transparent bg-transparent px-2 sm:px-4"
        }`}
      >
        <Logo compact={scrolled} />

        <div className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/!/marketplace"
            aria-label="Marketplace cart"
            className="hidden h-9 w-9 items-center justify-center rounded-[10px] border border-[#1f1f1f] bg-[#111111]/70 text-[#9fa2af] transition-colors hover:border-[#27397c] hover:text-white sm:flex"
          >
            <ShoppingCart className="h-4 w-4" />
          </Link>
          {loggedIn ? (
            <Link
              to="/!/dashboard"
              data-testid="nav-dashboard-btn"
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#3965e6] px-5 text-[14px] font-bold text-white transition hover:bg-[#4a73ee]"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/!/register"
              data-testid="nav-login-btn"
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#3965e6] px-5 text-[14px] font-bold text-white transition hover:bg-[#4a73ee]"
            >
              Sign Up
            </Link>
          )}
          <button
            type="button"
            data-testid="nav-mobile-toggle"
            aria-label="Open menu"
            className="flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-lg border border-[#1f1f1f] text-[#9fa2af] lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block h-0.5 w-4 bg-current" />
            <span className="block h-0.5 w-4 bg-current" />
          </button>
        </div>
      </nav>

      {open && (
        <div className="absolute top-[86px] w-[calc(100%-24px)] max-w-sm rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] p-2 lg:hidden">
          {NAV.map((item) => (
            <NavItem key={item.label} item={item} onNavigate={() => setOpen(false)} />
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
