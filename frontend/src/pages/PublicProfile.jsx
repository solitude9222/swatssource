import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { buildCrosshairCursor, crosshairSettings } from "@/lib/crosshair";
import { useProfileViewTracker } from "@/lib/viewTracker";
import { ProfilePreview, viewsInCorner, compactCount } from "@/components/ProfilePreview";
import { CursorEffect } from "@/components/CursorEffect";
import { CustomCursor } from "@/components/CustomCursor";
import { Eye } from "lucide-react";
import { fontStackOf, ensureFontsLoaded } from "@/constants/fonts";

// Where a moved view counter sits. The four corners are the page's, not the
// card's, so it stays put whatever the card is doing.
const CORNER_CLASS = {
  tl: "left-4 top-4",
  tr: "right-4 top-4",
  bl: "left-4 bottom-4",
  br: "right-4 bottom-4",
};

export default function PublicProfile() {
  const { alias } = useParams();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [entered, setEntered] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    ensureFontsLoaded();
    api.get(`/u/${alias}`).then(({ data }) => setData(data)).catch(() => setNotFound(true));
  }, [alias]);

  useEffect(() => {
    // GET /api/u/:alias returns the profile fields at the top level, not nested
    // under `user` — reading data.user meant this block never ran, so the tab
    // title and Open Graph tags kept the landing-page defaults on every profile.
    if (data && data.username) {
      const name = data.display_name || data.username || alias;
      const mp = data.profile || {};

      // The Metadata editor wins when its fields are filled; empty fields fall
      // back to the built-ins (name, bio, avatar) so blank entries are safe.
      const metaTitle = mp.meta_title || `${name} on swats.bio`;
      const metaDesc =
        mp.meta_description || mp.bio || `Check out ${name}'s bio link on swats.bio`;
      const metaImage = mp.meta_image || mp.avatar_url || "/logo.png";

      document.title = `swats | ${mp.meta_title || name}`;

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", metaTitle);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", metaDesc);

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute("content", metaImage);

      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor && mp.theme_color) themeColor.setAttribute("content", mp.theme_color);
    } else if (notFound) {
      document.title = `swats | User Not Found`;
    }
  }, [data, alias, notFound]);

  const p = data?.profile || {};
  const needsEntry = !!p.entry_enabled;
  const isEntered = !needsEntry || entered;
  const ready = isEntered;

  // The view count the server reported at load time, replaced once this visit
  // is registered (after dwell + proof of work). A view is only counted once the
  // page is genuinely being looked at — entry-gated profiles count after the
  // visitor clicks in, which also supplies the gesture the browser wants.
  const [views, setViews] = useState(null);
  useEffect(() => {
    if (data && typeof data.views === "number") setViews(data.views);
  }, [data]);
  useProfileViewTracker(alias, { enabled: !!data && ready, onCount: setViews });
  const viewData = useMemo(
    () => (data && views != null ? { ...data, views } : data),
    [data, views],
  );

  // Browsers deny audio-with-sound until the visitor has interacted with the
  // page, which is why the track silently never started: the one attempt ran on
  // page load (no gesture yet) and the catch was swallowed. Now: try once in
  // case the browser allows it, fall back to a muted start (always allowed) so
  // the track is at least loaded and positioned, and start the real unmuted
  // playback on the very first click/keypress anywhere on the profile.
  useEffect(() => {
    if (!data || !ready) return;
    const el = document.getElementById("profile-bg-audio");
    if (!el) return;

    const attempt = (withSound) => {
      el.muted = !withSound;
      const res = el.play();
      if (res && typeof res.catch === "function") {
        res.catch(() => {
          if (withSound) attempt(false); // denied with sound → muted start
        });
      }
    };
    attempt(true);

    const kick = () => {
      if (el.muted) {
        el.muted = false;
        el.play().catch(() => {});
      }
      window.dispatchEvent(new CustomEvent("swats:user-entered"));
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      window.removeEventListener("touchstart", kick);
    };
    window.addEventListener("pointerdown", kick, { passive: true });
    window.addEventListener("keydown", kick);
    window.addEventListener("touchstart", kick, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      window.removeEventListener("touchstart", kick);
    };
  }, [data, ready]);

  // The owner's crosshair replaces the arrow on this page only. The image is
  // drawn through a canvas so the saved scale can go beyond the browser's own
  // 128px cursor limit, and the hotspot is the saved click point.
  useEffect(() => {
    const settings = crosshairSettings(data?.profile || {});
    if (!settings.image) return undefined;
    let cancelled = false;
    buildCrosshairCursor(fileUrl(settings.image), settings).then((cursor) => {
      if (cancelled || !cursor) return;
      document.body.style.cursor = cursor.value;
    });
    return () => {
      cancelled = true;
      document.body.style.cursor = "";
    };
  }, [data]);

  // The Code Lock gate. The PIN is the profile's own entry_text; with no PIN
  // saved the gate stays click-to-enter so a page can never lock its owner out.
  const codeLock = (data?.profile?.entry_style || "") === "codelock" && !!needsEntry && !entered;
  const savedPin = String(data?.profile?.entry_text || "").trim();
  const pinActive = codeLock && savedPin.length > 0;

  const handleEnter = () => {
    setEntered(true);
    // Unmute / play background audio directly inside this synchronous user gesture:
    const audio = document.getElementById("profile-bg-audio");
    if (audio) {
      audio.muted = false;
      try {
        const p = audio.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch (_) {}
    }
    // Dispatch custom event for immediate unmuted playback of profile preview track:
    window.dispatchEvent(new CustomEvent("swats:user-entered"));
  };

  useEffect(() => {
    if (!pinActive) return undefined;
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        setPinError(false);
        setPin((prev) => {
          const next = (prev + e.key).slice(0, 4);
          if (next.length === 4) {
            if (next === savedPin.slice(0, 4)) {
              handleEnter();
              return "";
            }
            setPinError(true);
            return "";
          }
          return next;
        });
      } else if (e.key === "Backspace") {
        setPin((prev) => prev.slice(0, -1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinActive, savedPin]);

  if (notFound) {
    return (
      <div className="min-h-screen sw-page-bg flex flex-col items-center justify-center text-center px-4" data-testid="public-notfound">
        <img src="/logo.png" alt="swats.bio" className="w-16 h-16 rounded-2xl mb-4 object-contain shadow-[0_0_30px_rgba(164,141,244,0.4)]" />
        <div className="font-display text-5xl font-black text-zinc-100">404</div>
        <p className="mt-3 text-zinc-400">swats.bio/{alias} isn't claimed yet.</p>
        <Link to={`/!/login?claim=${alias}`} className="mt-6 px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold hover:brightness-110 transition">Claim this name</Link>
      </div>
    );
  }
  if (!data) return <div className="min-h-screen sw-page-bg" />;

  const entryGlow = p.entry_glow_color || p.accent_color || "#A48DF4";
  const entryTextColor = p.entry_color || "#f4f4f5";
  const entryBg = p.entry_bg_color || "rgba(255, 255, 255, 0.08)";
  const entryFont = fontStackOf(p.entry_font) || p.entry_font || "inherit";

  return (
    <div
      className="min-h-screen sw-page-bg"
      data-testid="public-profile-page"
      data-menu-id="profile"
      data-menu-name={data.username || ""}
      data-menu-href={`/${data.username || ""}`}
    >
      {/* Custom Cursor with smooth 60fps animated GIF support */}
      <CustomCursor profile={p} />

      {needsEntry && !entered && (
        <div
          data-testid="entry-gate"
          className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${pinActive ? "" : "cursor-pointer"}`}
          style={{
            backgroundColor: p.entry_backdrop_color || `rgba(6, 6, 8, ${(p.entry_dim ?? 95) / 100})`,
            backdropFilter: `blur(${p.entry_blur || "16px"})`,
            WebkitBackdropFilter: `blur(${p.entry_blur || "16px"})`,
          }}
          onClick={pinActive ? undefined : handleEnter}
        >
          {p.entry_style === "image" ? (
            <div className="flex flex-col items-center gap-3 text-center p-4">
              {p.entry_image ? (
                <img
                  src={fileUrl(p.entry_image)}
                  alt="Click to enter"
                  className="max-w-[220px] max-h-[220px] object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-105 transition-transform duration-300"
                  style={{
                    filter: `drop-shadow(0 0 20px ${entryGlow}88)`,
                  }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-2xl border border-white/20 flex items-center justify-center text-zinc-400 bg-white/5 hover:scale-105 transition-transform"
                  style={{ boxShadow: `0 0 30px ${entryGlow}44` }}
                >
                  <img src="/logo.png" alt="" className="w-12 h-12 object-contain" />
                </div>
              )}
              <div
                className="text-xs font-semibold tracking-wider hover:brightness-110 transition drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                style={{ fontFamily: entryFont, color: entryTextColor }}
              >
                {p.entry_text || "Click to enter"}
              </div>
              {p.entry_subtext && (
                <div className="text-[11px] font-mono2 text-zinc-400 uppercase tracking-wider">{p.entry_subtext}</div>
              )}
            </div>
          ) : p.entry_style === "text" ? (
            <div className="flex flex-col items-center gap-2.5 text-center p-4">
              <div
                className="font-bold text-lg sm:text-2xl tracking-widest uppercase hover:scale-105 transition-transform duration-300 cursor-pointer"
                style={{
                  fontFamily: entryFont,
                  color: entryTextColor,
                  textShadow: `0 0 24px ${entryGlow}`,
                }}
              >
                {p.entry_text || "Click to enter"}
              </div>
              {p.entry_subtext && (
                <div className="text-[11px] font-mono2 text-zinc-400 uppercase tracking-wider">{p.entry_subtext}</div>
              )}
            </div>
          ) : p.entry_style === "codelock" ? (
            <div className="text-center space-y-4" data-testid="codelock-gate">
              <div className="text-zinc-500 font-mono2 text-xs uppercase tracking-widest mb-6">Enter PIN</div>
              <div className={`flex items-center justify-center gap-3 ${pinError ? "pin-shake" : ""}`}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-4 w-4 rounded-full border-2 transition-colors ${pin.length > i ? "border-brand-400 bg-brand-400" : pinError ? "border-red-500" : "border-zinc-700 bg-transparent"}`}
                  />
                ))}
              </div>
              {pinError ? (
                <div className="font-mono2 text-[10px] uppercase tracking-widest text-red-400" data-testid="codelock-error">Incorrect PIN</div>
              ) : pinActive ? (
                <div className="mt-8 font-mono2 text-[10px] uppercase text-zinc-400">Type the 4-digit PIN</div>
              ) : (
                <div className="mt-8 font-mono2 text-[10px] uppercase text-zinc-400">Click anywhere to unlock</div>
              )}
            </div>
          ) : (
            /* button / default */
            <div className="flex flex-col items-center gap-3 text-center p-4">
              <button
                type="button"
                className={`px-8 py-3.5 rounded-full border text-sm sm:text-base font-semibold shadow-2xl hover:scale-105 hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer ${p.entry_anim !== false ? "animate-pulse" : ""}`}
                style={{
                  fontFamily: entryFont,
                  backgroundColor: entryBg,
                  color: entryTextColor,
                  borderColor: p.entry_border_color || `${entryGlow}55`,
                  boxShadow: `0 0 35px ${entryGlow}44`,
                }}
              >
                {p.entry_text || "Click to enter"}
              </button>
              {p.entry_subtext && (
                <div className="text-xs text-zinc-400">{p.entry_subtext}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Background Audio */}
      {p.audio_url && (
        <audio id="profile-bg-audio" src={fileUrl(p.audio_url)} loop autoPlay={ready} />
      )}

      {/* The cursor effect and the pet wait behind the entry gate */}
      {ready && <CursorEffect effect={p.cursor_effect} accent={p.accent_color} />}
      <ProfilePreview data={viewData} backgroundAudio={!!p.audio_url && p.audio_controls !== false} autoPlayAudio={ready} />

      {/* A moved view counter: the four corners are the page's, and "hidden"
          draws it nowhere at all (the card drops it from its meta line too). */}
      {viewsInCorner(p.views_position) && views != null && (
        <div
          data-testid="views-corner"
          className={`fixed z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 font-mono2 text-[11px] text-zinc-300 backdrop-blur ${CORNER_CLASS[p.views_position]}`}
        >
          <Eye className="h-3.5 w-3.5" />
          {compactCount(views)}
        </div>
      )}

      {p.hide_footer !== true && (
        <a
          href="/!/home"
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 inline-flex w-auto items-center gap-2.5 rounded-full border border-white/20 bg-gradient-to-r from-black/85 via-[#181226]/90 to-black/85 px-5 py-2 text-[10px] sm:text-xs font-bold leading-none text-zinc-100 shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(164,141,244,0.2)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-brand-400/60 hover:shadow-[0_8px_35px_rgba(0,0,0,0.8),0_0_28px_rgba(164,141,244,0.45)] group cursor-pointer"
          data-testid="profile-footer-pill"
          title="Made in swats.bio"
        >
          <img src="/logo.png" alt="swats.bio" className="h-4 w-4 rounded-md object-contain transition-transform duration-200 group-hover:scale-110" />
          <span className="tracking-wide">
            Made in <span className="text-brand-300 group-hover:text-white transition-colors font-extrabold">swats.bio</span>
          </span>
        </a>
      )}
    </div>
  );
}
