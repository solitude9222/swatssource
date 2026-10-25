import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, HelpCircle, Sparkles } from "lucide-react";

/* Reformed Q&A Section:
   High-polish interactive accordion with monospace indexing, category chips,
   ambient neon glows, and smooth morphing animations. Maintains 100% test contract. */

const FAQS = [
  {
    category: "Platform",
    q: "What is tourn.lol?",
    a: "tourn.lol is the internet's premier bio-link engine — a fully customizable home for your digital identity, social media links, widgets, background music, and badges.",
  },
  {
    category: "Pricing",
    q: "Is tourn.lol free to use?",
    a: "Yes. Core profile customization, free fonts, text effects, link cards, and basic layouts are free forever. Premium unlocks 100+ fonts, custom MP4 backgrounds, custom code widgets, custom badge creation, and priority support.",
  },
  {
    category: "Widgets",
    q: "How do Discord frames & server widgets work?",
    a: "We provide every Discord avatar decoration preset, animated over your avatar with your own curated catalogue, plus live Discord server cards displaying online member counts and join invites directly on your profile.",
  },
  {
    category: "Identity",
    q: "Can I change my username or alias?",
    a: "Yes. You can claim any available username at tourn.lol/username. Username changes are protected with a 48-hour cooldown limit to prevent alias hoarding.",
  },
  {
    category: "Templates",
    q: "How do community templates work?",
    a: "You can browse templates published by other tourn.lol creators or snapshot your own profile design to share in the Community Templates marketplace!",
  },
  {
    category: "Badges",
    q: "What badges can I earn or create?",
    a: "Badges like OG, Booster, and Premium are automatically granted through Discord and account tier. Premium users can also craft custom badges with custom colors, icons, and glows.",
  },
];

const FAQItem = ({ item, open, onToggle, index }) => {
  const padIndex = String(index + 1).padStart(2, "0");

  return (
    <div
      data-testid={`faq-item-${index}`}
      className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
        open
          ? "bg-gradient-to-br from-brand-500/15 via-white/[0.04] to-zinc-950/80 border-brand-400/40 shadow-[0_8px_32px_rgba(180,191,250,0.18)]"
          : "glass border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
      }`}
    >
      {/* Top subtle highlight line when active */}
      {open && (
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400/80 to-transparent pointer-events-none" />
      )}

      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer select-none"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Index Counter Pill */}
          <span
            className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono2 font-bold transition-colors ${
              open
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-white/5 border border-white/10 text-zinc-500 group-hover:text-zinc-300"
            }`}
          >
            {padIndex}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono2 font-semibold uppercase tracking-widest text-brand-400/90 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                {item.category}
              </span>
            </div>
            <span
              className={`text-sm sm:text-base font-bold transition-colors block ${
                open ? "text-white" : "text-zinc-200 group-hover:text-white"
              }`}
            >
              {item.q}
            </span>
          </div>
        </div>

        {/* Plus / Minus morphing icon */}
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
            open
              ? "bg-brand-500 text-white border-brand-400 shadow-[0_0_12px_rgba(180,191,250,0.4)]"
              : "bg-white/5 border-white/10 text-zinc-400 group-hover:text-white group-hover:border-white/20"
          }`}
        >
          <Plus className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 sm:px-6 pt-1 text-xs sm:text-sm text-zinc-300/90 leading-relaxed border-t border-white/[0.06] mt-1 space-y-3">
              <p>{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FAQ = () => {
  const [open, setOpen] = useState(0);

  return (
    <section
      data-testid="faq-accordion-section"
      className="relative px-4 py-24 max-w-3xl mx-auto overflow-hidden"
    >
      {/* Background ambient radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-15 blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(180, 191, 250, 0.6) 0%, transparent 70%)",
        }}
      />

      {/* Header section */}
      <div className="relative z-10 text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-200 mb-4 backdrop-blur shadow-sm">
          <HelpCircle className="h-3.5 w-3.5 text-brand-400" />
          <span>Knowledge &amp; Support</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl font-black text-zinc-50 leading-tight tracking-tight">
          Questions &amp; Answers
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
          Everything you need to know about tourn.lol features, templates, badges and customization.
        </p>
      </div>

      {/* Accordion List */}
      <div className="relative z-10 space-y-3.5">
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
    </section>
  );
};

export default FAQ;
