import { BoltIcon } from "./Bolts";

/* The small label every landing section opens with: a dark pill with a light
   arc travelling around its rim. It is decorative, so it carries no cursor and
   nothing to click. */
export const SectionPill = ({ children, icon = true, className = "" }) => (
  <span
    className={`sw-beam sw-beam-slow inline-flex items-center gap-1.5 rounded-[8px] border border-[#1f1f1f] bg-[#111111] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#74a0f8] ${className}`}
  >
    {icon && <BoltIcon className="h-3 w-3 text-[#5381f2]" />}
    {children}
  </span>
);

export default SectionPill;
