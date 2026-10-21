import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

/* Shared dashboard building blocks. Each one replaces a pattern that had been
   written out by hand on several pages (stat tiles, pill tab rows, sortable
   table headers), so they stay visually and behaviourally identical. */

const CARD = "dash-card dash-card-lift rounded-2xl p-5";

/* A single headline number. Pass `to` to make the whole tile a link. */
export function StatCard({ to, testId, label, icon: Icon, value, footer }) {
  const body = (
    <>
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        <span>{label}</span>
        {Icon && <Icon className="h-4 w-4 text-[#a48df4] transition-transform duration-300 group-hover:scale-110" />}
      </div>
      <div className="mt-3 font-display text-2xl font-bold text-zinc-50 tabular-nums">{value}</div>
      {footer && <div className="mt-1 text-[11px] text-zinc-500">{footer}</div>}
    </>
  );
  if (to) {
    return (
      <Link to={to} data-testid={testId} className={`${CARD} group block min-w-0`}>
        {body}
      </Link>
    );
  }
  return (
    <div data-testid={testId} className={`${CARD} group min-w-0`}>
      {body}
    </div>
  );
}

/* A row of mutually exclusive pill options (range pickers, filters). */
export function SegmentedTabs({ options, value, onChange, testid, className = "" }) {
  return (
    <div
      role="tablist"
      data-testid={testid}
      className={`inline-flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#09090c] p-1 ${className}`}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={opt.testid}
            onClick={() => onChange(opt.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
              active ? "bg-[#a48df4]/20 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* A table header cell that toggles sorting on its column. */
export function SortHeader({ label, sortKey, activeKey, dir, onSort, align = "left" }) {
  const active = sortKey === activeKey;
  const Arrow = dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-5 py-3 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-zinc-200 ${
          active ? "text-brand-300" : ""
        }`}
      >
        {label}
        {active && <Arrow className="h-3 w-3" aria-hidden="true" />}
      </button>
    </th>
  );
}

/* Sorts rows by a column. `accessors` maps a column key to a function that
   returns the comparable value for a row. Clicking the active column flips the
   direction; clicking another column sorts ascending by it. */
export function useSortedRows(rows, accessors, initialKey, initialDir = "asc") {
  const [sortKey, setSortKey] = useState(initialKey);
  const [dir, setDir] = useState(initialDir);

  const sorted = useMemo(() => {
    const get = accessors[sortKey];
    if (!get) return rows;
    const factor = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return -1 * factor;
      if (av > bv) return 1 * factor;
      return 0;
    });
  }, [rows, accessors, sortKey, dir]);

  const toggleSort = (key) => {
    if (key === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir("asc");
    }
  };

  return { sorted, sortKey, dir, toggleSort };
}
