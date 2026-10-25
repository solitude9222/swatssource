import { useEffect, useRef, useState } from "react";
import { FxText } from "@/components/FxText";
import { BackgroundEffect } from "@/components/BackgroundEffect";
import { OverlayEffect } from "@/components/OverlayEffect";
import { CardEffect } from "@/components/CardEffect";
import { fileUrl } from "@/lib/api";

/* ---------------------------------------------------------------------------
   FxTile — the little box at the top of every effect tile.

   The store used to be labels only: you read the word "Flicker" and had to hover
   it to find out what Flicker was, one tile at a time, on the card behind the
   dialog. Every tile now draws its own effect instead, in a miniature of the
   thing that effect is FOR — the name for a text effect, the card for a
   background, card effect or an overlay, the avatar circle for a decoration,
   the pointer for a cursor effect.

   Two rules keep a wall of these from becoming a wall of animations:

     • an effect is mounted only while its tile is on screen.
     • thumbnail mode throttles frame rates to prevent performance drops.
   --------------------------------------------------------------------------- */

export const TILE_SAMPLE = "tourn";

// The cursor demo's markers.
const CURSOR_MARKERS = [0, 1, 2, 3, 4, 5];

function useOnScreen(ref) {
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver !== "function") return undefined;
    const io = new IntersectionObserver(([entry]) => setOnScreen(!!entry?.isIntersecting), {
      rootMargin: "20px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  return onScreen;
}

export function FxTile({ variant = "text", id = "", accent = "#b4bffa", avatarUrl = "" }) {
  const ref = useRef(null);
  const onScreen = useOnScreen(ref);
  const live = !!id && onScreen;
  const pic = fileUrl(avatarUrl);

  return (
    <span ref={ref} className="ov-tile-preview" aria-hidden="true">
      {variant === "text" && <FxText id={live ? id : ""} text={TILE_SAMPLE} className="ov-tile-word" />}

      {variant === "card" && (
        <span className="ov-tile-stage">
          <span
            className="ov-tile-ambience"
            style={{ background: `radial-gradient(circle at 50% 120%, ${accent}44, transparent 72%)` }}
          />
          <span className="ov-tile-card relative overflow-hidden" style={{ borderRadius: "8px" }}>
            <span className="ov-tile-card-name">tourn</span>
            <span className="ov-tile-card-handle">@user</span>
            {live && <CardEffect effect={id} color={accent} borderRadius="8px" />}
          </span>
        </span>
      )}

      {(variant === "bg" || variant === "overlay") && (
        <span className="ov-tile-stage">
          <span
            className="ov-tile-ambience"
            style={{ background: `radial-gradient(circle at 50% 120%, ${accent}66, transparent 72%)` }}
          />
          <span className="ov-tile-card">
            <span className="ov-tile-card-name">tourn</span>
            <span className="ov-tile-card-handle">@user</span>
          </span>
          {live && variant === "bg" && <BackgroundEffect effect={id} thumbnail={true} />}
          {live && variant === "overlay" && <OverlayEffect effect={id} color={accent} thumbnail={true} />}
        </span>
      )}

      {variant === "cursor" && (
        <span className="ov-tile-pointer">
          <span className={`fx-cursor-demo ${live ? `fx-cursor-${id}` : ""}`}>
            {live && CURSOR_MARKERS.map((n) => <i key={n} />)}
          </span>
        </span>
      )}

      {variant === "avatar" && (
        <span className="ov-tile-avatar">
          <span
            className="ov-tile-avatar-pic"
            style={pic ? { backgroundImage: `url("${pic}")` } : { background: `linear-gradient(140deg, ${accent}, #1e1b4b)` }}
          />
          {live && <span className={`ov-tile-avatar-fx fx-ov-${id}`} />}
        </span>
      )}
    </span>
  );
}

export default FxTile;
