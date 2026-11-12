import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HomeWidgets } from "@/components/landing/HomeWidgets";
import { HomeAudio } from "@/components/landing/HomeAudio";
import { HomeBadges } from "@/components/landing/HomeBadges";
import { HomeProfiles } from "@/components/landing/HomeProfiles";
import { HomeNumbers } from "@/components/landing/HomeNumbers";
import { UserCarousel } from "@/components/landing/UserCarousel";
import { FAQ } from "@/components/landing/FAQ";
import { HomeCta } from "@/components/landing/HomeCta";
import { Footer } from "@/components/landing/Footer";

/* The landing page, rebuilt to the tourn.lol reference.

   Order is the argument: the wordmark and the demo card, then what a page is
   made of (widgets, audio, badges), then what other pages look like, then the
   numbers, the people, the questions and one last claim field.

   The blue palette is scoped to this page: the rest of the site keeps its violet
   brand, and every `brand-*` class below resolves through the CSS variables set
   on the wrapper, so the nav, pills and buttons all move together. The old grid
   overlay and grain texture are gone — the hero's own bolt field carries the
   background. */

const BLUE_BRAND = {
  "--brand-50": "238 242 255",
  "--brand-100": "214 225 255",
  "--brand-200": "169 194 255",
  "--brand-300": "116 160 248",
  "--brand-400": "116 160 248",
  "--brand-500": "57 101 230",
  "--brand-600": "47 85 201",
  "--brand-700": "39 57 124",
  "--brand-800": "26 38 84",
  "--brand-900": "16 24 54",
  "--brand-950": "9 13 30",
};

export default function Landing() {
  return (
    <div
      className="min-h-screen bg-[#09080b] text-zinc-100 relative overflow-x-hidden"
      style={BLUE_BRAND}
      data-testid="landing-page"
    >
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <HomeWidgets />
        <HomeAudio />
        <HomeBadges />
        <HomeProfiles />
        <HomeNumbers />
        <UserCarousel />
        <FAQ />
        <HomeCta />
      </main>
      <Footer />
    </div>
  );
}
