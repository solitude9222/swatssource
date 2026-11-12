/* The lightning bolt motif, drawn once and reused.

   Outline only, exactly as the reference: a 2px stroke a shade lighter than
   whatever sits behind it, never a filled shape. `BoltField` tiles them in a
   staggered grid behind the hero and the closing banner; the offsets live in
   the caller so each band can be tuned without a second SVG. */

export const BoltIcon = ({ className = "h-3 w-3" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path d="M13.5 2 4.5 14h5.2L8 22l9.6-12h-5.3L13.5 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export const Bolt = ({ className = "", style }) => (
  <svg
    viewBox="0 0 42 66"
    className={className}
    style={style}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M25 1.5 5.5 37.5h12.2L14 64.5 37 26.5H24.2L25 1.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

/* A staggered field of bolts. `rows` × `cols` cells, every other row nudged by
   half a cell, so the pattern reads as a field rather than a grid. */
export const BoltField = ({
  rows = 8,
  cols = 8,
  color = "rgba(30, 45, 101, 0.85)",
  className = "",
  cellW = 280,
  cellH = 140,
}) => (
  <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
    {Array.from({ length: rows }).map((_, r) => (
      <div
        key={r}
        className="flex"
        style={{ height: cellH, marginLeft: r % 2 ? cellW / 2 : 0 }}
      >
        {Array.from({ length: cols }).map((__, c) => (
          <div key={c} className="flex items-center justify-center" style={{ width: cellW, height: cellH }}>
            <Bolt
              style={{
                color,
                width: 65,
                height: 65,
                transform: `rotate(${(r + c) % 3 === 0 ? -12 : 10}deg)`,
                opacity: 0.9,
              }}
            />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export default Bolt;
