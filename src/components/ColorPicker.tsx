import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronIcon, CloseIcon } from "./Icons";
import "../colorPicker.css";

type HSV = { h: number; s: number; v: number };

const PRESETS = [
  "#a8e0ff",
  "#ffcfa8",
  "#f3f7fa",
  "#98a3ad",
  "#0b0d10",
  "#12161b",
  "#ffffff",
  "#ff5f7a",
  "#a78bfa",
  "#4ade80",
];

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(input: string): string | null {
  const value = input.trim().startsWith("#") ? input.trim() : `#${input.trim()}`;
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
}

export function hexToHsv(hex: string): HSV {
  const safe = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#ffffff";
  const n = Number.parseInt(safe.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToHex({ h, s, v }: HSV): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s);
  const val = clamp(v);
  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return `#${[r, g, b]
    .map((part) => Math.round((part + m) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function ColorPopover({
  label,
  anchor,
  value,
  onChange,
  onClose,
}: {
  label: string;
  anchor: DOMRect;
  value: string;
  onChange: (color: string) => void;
  onClose: () => void;
}) {
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value));
  const [text, setText] = useState(value);
  const hsvRef = useRef(hsv);
  const popRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const pending = useRef<string | null>(null);
  const lastEmitted = useRef(value.toLowerCase());
  const dragging = useRef<"sv" | "hue" | null>(null);

  const width = 236;
  const [position, setPosition] = useState(() => {
    const estimatedHeight = 296;
    const below = anchor.bottom + 8;
    const top =
      below + estimatedHeight < window.innerHeight
        ? below
        : Math.max(8, anchor.top - estimatedHeight - 8);
    const left = Math.min(
      Math.max(8, anchor.left + anchor.width / 2 - width / 2),
      Math.max(8, window.innerWidth - width - 8),
    );
    return { left, top };
  });

  useLayoutEffect(() => {
    const node = popRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const gap = 8;
    const edge = 8;
    const left = Math.min(
      Math.max(edge, anchor.left + anchor.width / 2 - rect.width / 2),
      Math.max(edge, window.innerWidth - rect.width - edge),
    );
    const below = anchor.bottom + gap;
    const above = anchor.top - gap - rect.height;
    let top = below;
    if (below + rect.height > window.innerHeight - edge) {
      top = above >= edge ? above : Math.max(edge, window.innerHeight - rect.height - edge);
    }
    setPosition({ left, top });
  }, [anchor]);

  const hex = hsvToHex(hsv);

  const flush = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const next = pending.current;
    pending.current = null;
    if (next && next !== lastEmitted.current) {
      lastEmitted.current = next;
      onChange(next);
    }
  };

  // The knob follows the pointer at full speed, while the page preview updates
  // in small batches so dragging a colour never queues a render per event.
  const emit = (color: string) => {
    if (color === lastEmitted.current && pending.current === null) return;
    pending.current = color;
    if (timer.current !== null) return;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      const next = pending.current;
      pending.current = null;
      if (next && next !== lastEmitted.current) {
        lastEmitted.current = next;
        onChange(next);
      }
    }, 28);
  };

  const commit = (next: HSV) => {
    hsvRef.current = next;
    setHsv(next);
    emit(hsvToHex(next));
  };

  useEffect(() => {
    hsvRef.current = hsv;
  }, [hsv]);

  useEffect(() => {
    const current = hexToHsv(value);
    hsvRef.current = current;
    setHsv(current);
    setText(value);
    // The popover mounts fresh per open, so this seeds its local state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dragging.current) return;
    if (hsvToHex(hsvRef.current) === value.toLowerCase()) return;
    const next = hexToHsv(value);
    hsvRef.current = next;
    setHsv(next);
    setText(value);
  }, [value]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (popRef.current?.contains(target)) return;
      onClose();
    };
    const onViewport = () => onClose();
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("resize", onViewport);
    window.addEventListener("scroll", onViewport, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("scroll", onViewport, true);
    };
  }, [onClose]);

  const pickSv = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = svRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = clamp((event.clientX - rect.left) / rect.width);
    const v = 1 - clamp((event.clientY - rect.top) / rect.height);
    commit({ ...hsvRef.current, s, v });
  };

  const pickHue = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;
    const h = clamp((event.clientX - rect.left) / rect.width) * 360;
    commit({ ...hsvRef.current, h });
  };

  const startPointer = (
    kind: "sv" | "hue",
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    dragging.current = kind;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (kind === "sv") pickSv(event);
    else pickHue(event);
  };

  const movePointer = (kind: "sv" | "hue", event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging.current !== kind) return;
    if (kind === "sv") pickSv(event);
    else pickHue(event);
  };

  const stopPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    flush();
    dragging.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const setColor = (next: string) => {
    const normalized = normalizeHex(next);
    if (!normalized) return;
    const nextHsv = hexToHsv(normalized);
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    pending.current = null;
    lastEmitted.current = normalized;
    hsvRef.current = nextHsv;
    setHsv(nextHsv);
    setText(normalized);
    onChange(normalized);
  };

  const onHexChange = (next: string) => {
    setText(next);
    const normalized = normalizeHex(next);
    if (!normalized) return;
    const nextHsv = hexToHsv(normalized);
    hsvRef.current = nextHsv;
    setHsv(nextHsv);
    onChange(normalized);
  };

  const svKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.02;
    const current = hsvRef.current;
    let next: HSV | null = null;
    if (event.key === "ArrowLeft") next = { ...current, s: clamp(current.s - step) };
    if (event.key === "ArrowRight") next = { ...current, s: clamp(current.s + step) };
    if (event.key === "ArrowUp") next = { ...current, v: clamp(current.v + step) };
    if (event.key === "ArrowDown") next = { ...current, v: clamp(current.v - step) };
    if (!next) return;
    event.preventDefault();
    commit(next);
  };

  const hueKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 3;
    let h = hsvRef.current.h;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") h -= step;
    else if (event.key === "ArrowRight" || event.key === "ArrowUp") h += step;
    else if (event.key === "Home") h = 0;
    else if (event.key === "End") h = 359;
    else return;
    event.preventDefault();
    commit({ ...hsvRef.current, h });
  };

  return createPortal(
    <div
      ref={popRef}
      className="cp-pop"
      role="dialog"
      aria-label={`${label} color`}
      style={{ left: position.left, top: position.top, width }}
    >
      <header className="cp-head">
        <span>{label}</span>
        <button type="button" className="cp-close" onClick={onClose} aria-label="Close color picker">
          <CloseIcon size={13} />
        </button>
      </header>

      <div
        ref={svRef}
        className="cp-sv"
        role="slider"
        tabIndex={0}
        aria-label={`${label} saturation and brightness`}
        aria-valuetext={`${Math.round(hsv.s * 100)}% saturation, ${Math.round(hsv.v * 100)}% brightness`}
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
        }}
        onPointerDown={(event) => startPointer("sv", event)}
        onPointerMove={(event) => movePointer("sv", event)}
        onPointerUp={stopPointer}
        onPointerCancel={stopPointer}
        onKeyDown={svKeyboard}
      >
        <span
          className="cp-sv-knob"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            background: hex,
          }}
          aria-hidden="true"
        />
      </div>

      <div
        ref={hueRef}
        className="cp-hue"
        role="slider"
        tabIndex={0}
        aria-label={`${label} hue`}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        onPointerDown={(event) => startPointer("hue", event)}
        onPointerMove={(event) => movePointer("hue", event)}
        onPointerUp={stopPointer}
        onPointerCancel={stopPointer}
        onKeyDown={hueKeyboard}
      >
        <span
          className="cp-hue-thumb"
          style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }}
          aria-hidden="true"
        />
      </div>

      <div className="cp-bottom">
        <span className="cp-preview" style={{ background: hex }} aria-hidden="true" />
        <label className="cp-hex">
          <span>HEX</span>
          <input
            value={text}
            onChange={(event) => onHexChange(event.target.value)}
            onBlur={() => {
              const normalized = normalizeHex(text);
              if (!normalized) setText(hex);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const normalized = normalizeHex(text);
                if (normalized) setColor(normalized);
              }
            }}
            maxLength={7}
            spellCheck={false}
            aria-label={`${label} hex value`}
          />
        </label>
        <button type="button" className="cp-done" onClick={onClose} aria-label="Use this color">
          <CheckIcon size={12} />
        </button>
      </div>

      <div className="cp-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`cp-preset${preset === hex ? " is-active" : ""}`}
            style={{ background: preset }}
            onClick={() => setColor(preset)}
            aria-label={`Use ${preset}`}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}

export function ColorField({
  label,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAnchor(rect);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={`color-field${compact ? " color-field--compact" : ""}`}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
      >
        <span className="color-field-swatch" style={{ "--cp-value": value } as CSSProperties} />
        <span className="color-field-copy">
          <span>{label}</span>
          <b>{value}</b>
        </span>
        <ChevronIcon size={12} className="color-field-chevron" />
      </button>

      {open && anchor ? (
        <ColorPopover
          label={label}
          anchor={anchor}
          value={value}
          onChange={onChange}
          onClose={close}
        />
      ) : null}
    </>
  );
}
