import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { SectionPill } from "./SectionPill";

/* The FAQ, to the reference: a centred stack of six rows rather than the old
   two-column band. One row is open at a time and the chevron flips with it. */

const FAQS = [
  {
    q: "How do I create my biolink page?",
    a: "tourn.lol is a bio-link engine at heart: register an account, choose your username, and start customizing your links, content, and design. Takes a few minutes.",
  },
  {
    q: "Can I fully customize my design?",
    a: "Yes — card style, colours, fonts, text effects, layouts, badges and widgets are all yours. Every look is previewed live in the editor before you save it.",
  },
  {
    q: "How many links can I add?",
    a: "As many as you like: profile links, Discord server cards, widgets and embeds each take a slot. Long lists fold neatly instead of turning the page into a wall.",
  },
  {
    q: "Is tourn.lol free to use?",
    a: "Yes. Core customization, fonts, link cards and layouts are free forever. Premium adds the full font library, video backgrounds, custom code widgets and custom badges.",
  },
  {
    q: "Can I see analytics for my links?",
    a: "Profile views are tracked from day one and shown on your page. Premium unlocks the full analytics view with per-link totals and a daily chart.",
  },
  {
    q: "Does it work on mobile devices?",
    a: "Every layout is responsive — the card reflows, widgets stack, and the editor works on a phone as well as a desktop.",
  },
];

const FAQItem = ({ item, open, onToggle, index }) => (
  <div
    data-testid={`faq-item-${index}`}
    className={`overflow-hidden rounded-[12px] border bg-[#111111] transition-colors duration-200 ${
      open ? "border-[#27397c]" : "border-[#1f1f1f] hover:border-[#27397c]"
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-[22px] text-left select-none"
    >
      <span className="text-[15px] font-bold text-white">{item.q}</span>
      <motion.span
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="shrink-0 text-[#7b8496]"
      >
        <ChevronDown className="h-4 w-4" />
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <p className="px-5 pb-5 text-[13px] leading-relaxed text-[#9fa2af]">{item.a}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const FAQ = () => {
  const [open, setOpen] = useState(0);

  return (
    <section data-testid="faq-accordion-section" className="relative px-4 py-24">
      <div className="mx-auto max-w-[894px] text-center">
        <SectionPill icon={false} className="mx-auto">
          <HelpCircle className="h-3 w-3" />
          FAQ
        </SectionPill>
        <h2 className="mt-5 font-display text-[34px] font-bold tracking-tight text-white sm:text-[36px]">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-[15px] text-[#9fa2af]">The most common questions about tourn.lol.</p>

        <div className="mt-9 space-y-[13px] text-left">
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

        <p className="mt-8 text-[13px] text-[#9fa2af]">Anything not covered here is in the help center.</p>
        <a
          href="/!/docs"
          className="mt-3 inline-flex h-[44px] items-center justify-center gap-2 rounded-[10px] bg-[#3965e6] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#4a73ee]"
        >
          <HelpCircle className="h-4 w-4" />
          Visit Help Center
        </a>
      </div>
    </section>
  );
};

export default FAQ;
