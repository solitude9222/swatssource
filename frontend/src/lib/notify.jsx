// Custom notification system: stacked cards pinned to the TOP CENTRE of the
// screen.
//
// Replaces sonner. The `toast` object keeps the same call shape that was already
// used in ~70 places (`toast.success("...")`, `toast.error("...")`,
// `toast.info("...")`), so those call sites only needed their import changed.
//
// Mount <Toaster /> exactly once, in App.js. Mounting it per-page (which is what
// Login and Pricing used to do) renders every notification once per instance.
import { useSyncExternalStore } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2, X } from "lucide-react";

const DEFAULT_DURATION = 4200;
const EXIT_MS = 180; // must match the exit animation below
const MAX_VISIBLE = 5;

let items = [];
const listeners = new Set();
let nextId = 1;

const emit = () => {
  for (const listener of listeners) listener();
};
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => items;

const normalize = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (typeof value === "object" && typeof value.message === "string") return value.message;
  return String(value);
};

export function dismiss(id) {
  if (!items.some((item) => item.id === id && !item.closing)) return;
  items = items.map((item) => (item.id === id ? { ...item, closing: true } : item));
  emit();
  setTimeout(() => {
    items = items.filter((item) => item.id !== id);
    emit();
  }, EXIT_MS);
}

// Drops everything currently on screen. Useful after a route change or sign-out,
// so a notification from the previous screen is not left hanging around.
export function dismissAll() {
  if (!items.length) return;
  items = items.map((item) => ({ ...item, closing: true }));
  emit();
  setTimeout(() => {
    items = [];
    emit();
  }, EXIT_MS);
}

function push(type, message, options = {}) {
  const normMessage = normalize(message);
  // Remove duplicates: if an active toast with the same type and message exists, refresh its timer and reuse id
  const existing = items.find((entry) => !entry.closing && entry.type === type && entry.message === normMessage && (!options.id || entry.id === options.id));
  const id = options.id ?? (existing ? existing.id : nextId++);
  const duration = options.duration ?? DEFAULT_DURATION;

  const item = {
    id,
    type,
    title: options.title ?? null,
    description: options.description ?? null,
    message: normMessage,
    // Kept so the card can draw a countdown bar that matches its own lifetime.
    duration,
    closing: false,
    timestamp: Date.now(),
  };

  // Re-adding an existing id replaces it in place rather than duplicating.
  items = [...items.filter((entry) => entry.id !== id), item].slice(-MAX_VISIBLE);
  emit();

  if (duration > 0) setTimeout(() => dismiss(id), duration);
  // Callers that want to dismiss early (a loading toast, say) get the handle back.
  return { id, dismiss: () => dismiss(id) };
}

const factory = (type) => (message, options) => push(type, message, options);

export const toast = {
  success: factory("success"),
  error: factory("error"),
  info: factory("info"),
  warning: factory("warning"),
  message: factory("info"),
  // Stays until dismissed — used for in-flight work.
  loading: (message, options) => push("loading", message, { duration: 0, ...options }),
  dismiss,
  dismissAll,
};

const VARIANTS = {
  success: {
    Icon: CheckCircle2,
    accent: "text-emerald-400",
    ring: "ring-emerald-500/20",
    chip: "bg-emerald-950/50 border-emerald-500/30 text-emerald-300",
    bar: "bg-gradient-to-r from-emerald-500 to-teal-400",
    edge: "border-emerald-500/30",
    glow: "rgba(16,185,129,0.04)",
  },
  error: {
    Icon: AlertCircle,
    accent: "text-rose-400",
    ring: "ring-rose-500/20",
    chip: "bg-rose-950/50 border-rose-500/30 text-rose-300",
    bar: "bg-gradient-to-r from-rose-500 to-pink-500",
    edge: "border-rose-500/30",
    glow: "rgba(244,63,94,0.04)",
  },
  warning: {
    Icon: AlertTriangle,
    accent: "text-amber-400",
    ring: "ring-amber-500/20",
    chip: "bg-amber-950/50 border-amber-500/30 text-amber-300",
    bar: "bg-gradient-to-r from-amber-500 to-yellow-400",
    edge: "border-amber-500/30",
    glow: "rgba(245,158,11,0.04)",
  },
  info: {
    Icon: Info,
    accent: "text-[#b4bffa]",
    ring: "ring-[#b4bffa]/20",
    chip: "bg-[#0f1021] border-[#b4bffa]/30 text-[#b4bffa]",
    bar: "bg-gradient-to-r from-[#b4bffa] to-indigo-400",
    edge: "border-[#b4bffa]/30",
    glow: "rgba(180,191,250,0.04)",
  },
  loading: {
    Icon: Loader2,
    accent: "text-[#b4bffa]",
    ring: "ring-[#b4bffa]/20",
    chip: "bg-[#0f1021] border-[#b4bffa]/30 text-[#b4bffa]",
    bar: "bg-gradient-to-r from-[#b4bffa] to-cyan-400",
    edge: "border-[#b4bffa]/30",
    glow: "rgba(180,191,250,0.04)",
  },
};

/* One notification card.
 *
 * Solid `#0b0b10` rather than a translucent blur: at /95 behind a backdrop blur
 * the page showed through a toast and its text lost contrast over busy profile
 * backgrounds. The accent hairline down the left edge and the countdown bar
 * along the bottom make the card instantly readable and sleek. */
function NotificationCard({ item }) {
  const variant = VARIANTS[item.type] || VARIANTS.info;
  const { Icon } = variant;
  const text = item.message || item.title;

  return (
    <li
      data-testid={`notification-${item.type}`}
      style={{ backgroundImage: `radial-gradient(ellipse at top left, ${variant.glow}, transparent 70%)` }}
      className={`pointer-events-auto relative flex w-full items-start gap-3.5 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b10] p-4 text-left shadow-[0_16px_40px_rgba(0,0,0,0.8)] ring-1 backdrop-blur-2xl transition-all duration-300 hover:border-white/20 ${variant.ring} ${variant.edge} ${
        item.closing
          ? "animate-out fade-out slide-out-to-top-3 duration-200"
          : "animate-in fade-in slide-in-from-top-3 duration-200"
      }`}
    >
      {/* Sleek rounded vertical accent pill */}
      <span className={`absolute top-2.5 bottom-2.5 left-1.5 w-1 rounded-full ${variant.bar}`} aria-hidden="true" />

      {/* Ambient badge chip */}
      <span className={`ml-1 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${variant.chip}`}>
        <Icon className={`h-4 w-4 ${variant.accent} ${item.type === "loading" ? "animate-spin" : ""}`} />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        {item.title && <div className="text-xs font-bold text-white tracking-wide">{item.title}</div>}
        {text && (
          <div className={`text-xs leading-relaxed text-zinc-100 font-medium ${item.title ? "mt-0.5 text-zinc-300" : ""}`}>
            {item.message || (item.title ? "" : null)}
          </div>
        )}
        {item.description && (
          <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">{item.description}</div>
        )}
      </div>

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismiss(item.id)}
        className="-mr-1 -mt-1 shrink-0 rounded-xl p-1.5 text-zinc-400 outline-none transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-500/50 cursor-pointer active:scale-95"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {item.type !== "loading" && item.duration > 0 && !item.closing && (
        <span
          data-testid="notification-timer"
          aria-hidden="true"
          className={`absolute bottom-0 left-0 h-0.5 ${variant.bar}`}
          style={{ animation: `sw-toast-timer ${item.duration}ms linear forwards` }}
        />
      )}
    </li>
  );
}

export function Toaster() {
  const list = useSyncExternalStore(subscribe, snapshot, snapshot);

  return (
    <div
      data-testid="notification-region"
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-0 right-0 p-4 sm:p-5 z-[9999] flex flex-col items-end"
    >
      <ol className="flex w-full max-w-sm flex-col-reverse gap-2.5">
        {list.map((item) => (
          <NotificationCard key={item.id} item={item} />
        ))}
      </ol>
    </div>
  );
}
