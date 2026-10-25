import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "What is tourn.lol?",
    a: "tourn.lol is the internet's premier bio-link engine — a fully customizable home for your digital identity, social media links, widgets, background music, and badges.",
  },
  {
    q: "Is tourn.lol free to use?",
    a: "Yes. Core profile customization, free fonts, text effects, link cards, and basic layouts are free forever. Premium unlocks 100+ fonts, custom MP4 backgrounds, custom code widgets, custom badge creation, and priority support.",
  },
  {
    q: "How do Discord frames & server widgets work?",
    a: "We provide every Discord avatar decoration preset, animated over your avatar with your own curated catalogue, plus live Discord server cards displaying online member counts and join invites directly on your profile.",
  },
  {
    q: "Can I change my username or alias?",
    a: "Yes. You can claim any available username at tourn.lol/username. Username changes are protected with a 48-hour cooldown limit to prevent alias hoarding.",
  },
  {
    q: "How do community templates work?",
    a: "You can browse templates published by other tourn.lol creators or snapshot your own profile design to share in the Community Templates marketplace!",
  },
  {
    q: "What badges can I earn or create?",
    a: "Badges like OG, Booster, and Premium are automatically granted through Discord and account tier. Premium users can also craft custom badges with custom colors, icons, and glows.",
  },
];

const FAQItem = ({ item, open, onToggle, index }) => (
  <div
    data-testid={`faq-item-${index}`}
    className={`rounded-2xl border transition duration-300 overflow-hidden ${
      open
        ? "bg-brand-500/10 border-brand-500/40 shadow-[0_0_30px_rgba(180,191,250,0.15)]"
        : "glass border-white/10 hover:border-white/20"
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer select-none"
    >
      <span className="text-sm sm:text-base font-bold text-zinc-100">{item.q}</span>
      <motion.span
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="shrink-0 text-brand-400"
      >
        <ChevronDown className="w-5 h-5" />
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <p className="px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {item.a}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const FAQ = () => {
  const [open, setOpen] = useState(0);

  return (
    <section
      data-testid="faq-accordion-section"
      className="relative px-4 sm:px-6 lg:px-8 py-20 lg:py-28 max-w-6xl mx-auto overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left top text */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-200 mb-4 backdrop-blur shadow-sm">
            <HelpCircle className="h-3.5 w-3.5 text-brand-400" />
            <span>Support &amp; FAQ</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-50 leading-tight tracking-tight">
            Questions &amp; Answers
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
            Everything you need to know about tourn.lol features, templates, badges and customization.
          </p>
        </div>

        {/* Right column: Questions & arrows */}
        <div className="lg:col-span-7 space-y-3.5">
          {FAQS.map((item, i) => (
            <FAQItem
              key={item.q}
              item={item}
              index={i}
              open={open === i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
