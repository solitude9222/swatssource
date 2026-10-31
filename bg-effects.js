/**
 * bg-effects.js — 12 dependency-free background OVERLAY effects (canvas).
 * They draw on top of your existing background and never replace it.
 *
 *   import { mount } from "./bg-effects.js";
 *   const fx = mount(document.querySelector("#profile"), { effect: "snow", intensity: 50 });
 *   fx.set("rain");            // switch effect (uses that effect's default intensity)
 *   fx.set("rain", 30);        // switch effect + intensity
 *   fx.setIntensity(70);       // 0-100 for EVERY effect (Old TV 5/10 = 50)
 *   fx.destroy();              // remove canvas + listeners
 *
 * Effect ids: snowstorm stars blur night tv dither fuzzy flash snow rain dust leaf
 * The canvas sits above the container's own background but below its content.
 *
 * Options: { effect, intensity, zIndex = -1, pointer = true, respectReducedMotion = false }
 * Not animating? 1) the container needs a real height  2) if your background is a CHILD
 * element (not on the container itself) use zIndex: 0 and give your content
 * position: relative; z-index: 1  3) with respectReducedMotion: true, users who
 * have "reduce motion" on get a still frame.
 */
/**
 * Each effect has:
 *   id          what you pass to mount() / set()
 *   name        label for your UI
 *   default     starting intensity (0-100)
 *   description what the effect looks like
 *   controls    what the intensity slider changes
 *   reactsToPointer  true if it responds to the mouse / finger
 */
export const effects = [
  { id: "snowstorm", name: "Snowstorm", default: 50, reactsToPointer: false,
    description: "Heavy, wind-blown snow streaking sideways across the screen with drifting white haze.",
    controls: "Wind speed and how many flakes are in the air." },
  { id: "stars", name: "Shooting Stars", default: 50, reactsToPointer: false,
    description: "Softly twinkling stars with shooting stars that streak across and fade out.",
    controls: "How often shooting stars appear, and how many stars twinkle." },
  { id: "blur", name: "Blurred Background", default: 50, reactsToPointer: false,
    description: "Blurs whatever is behind it (image, video or gradient). Nothing is drawn on top, so your background stays but goes soft.",
    controls: "Blur amount, from sharp (0) to about 24px (100)." },
  { id: "night", name: "Night Time", default: 50, reactsToPointer: false,
    description: "A dark blue night tint with twinkling stars and darker corners, like dimming the lights.",
    controls: "How dark it gets and how many stars show." },
  { id: "tv", name: "Old TV", default: 50, reactsToPointer: false,
    description: "An old CRT screen look: flickering static, scanlines, a slow rolling light bar, a faint blue flicker and dark corners.",
    controls: "Strength of the static, scanlines, roll bar and corner darkening (50 = 5/10)." },
  { id: "dither", name: "Dither", default: 20, reactsToPointer: false,
    description: "A moving retro pixel pattern made of light dots (ordered dithering), like an old 1-bit game screen.",
    controls: "How much of the screen is filled with dots. Low is sparse, high is dense." },
  { id: "fuzzy", name: "Fuzzy", default: 50, reactsToPointer: false,
    description: "Soft, grainy coloured noise that shimmers gently, like a fuzzy photo or fabric texture.",
    controls: "How visible the grain is." },
  { id: "flash", name: "Flashlight", default: 50, reactsToPointer: true,
    description: "A soft warm light that follows your pointer (or drifts on its own). It adds light and never darkens the rest of the page.",
    controls: "Size and brightness of the light." },
  { id: "snow", name: "Snow", default: 50, reactsToPointer: false,
    description: "Calm snowfall in three depths: small far flakes, medium flakes, and big blurry ones up close, swaying in a light wind.",
    controls: "How many flakes fall." },
  { id: "rain", name: "Rain", default: 50, reactsToPointer: false,
    description: "Slanted raindrops at different depths with tiny splashes where they hit the bottom. No lightning.",
    controls: "How many drops fall." },
  { id: "dust", name: "Particles", default: 15, reactsToPointer: true,
    description: "Soft glowing dust specks floating slowly with a gentle twinkle. Your pointer pushes them out of the way.",
    controls: "How many particles float around." },
  { id: "leaf", name: "Leaf Fall", default: 50, reactsToPointer: true,
    description: "Autumn leaves in orange, gold and red that spin, flip and sway as they fall. Your pointer nudges them aside.",
    controls: "How many leaves fall." },
];

const TAU = Math.PI * 2, R = (n) => Math.random() * n;
let SW, SD, LF; // sprites, created lazily so importing is SSR-safe

function spr(r, g, b) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d"), q = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  q.addColorStop(0, `rgba(${r},${g},${b},1)`); q.addColorStop(.35, `rgba(${r},${g},${b},.35)`); q.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = q; x.fillRect(0, 0, 64, 64); return c;
}
function leaf(c1, c2) {
  const c = document.createElement("canvas"); c.width = c.height = 48; const x = c.getContext("2d");
  x.fillStyle = c1; x.beginPath(); x.moveTo(24, 2); x.bezierCurveTo(46, 14, 42, 38, 24, 46); x.bezierCurveTo(6, 38, 2, 14, 24, 2); x.fill();
  x.strokeStyle = c2; x.lineWidth = 1.4; x.beginPath(); x.moveTo(24, 6); x.lineTo(24, 47);
  for (let y = 14; y < 40; y += 8) { x.moveTo(24, y + 6); x.lineTo(14, y); x.moveTo(24, y + 6); x.lineTo(34, y); }
  x.stroke(); return c;
}
function assets() {
  if (SW) return;
  SW = spr(255, 255, 255); SD = spr(255, 226, 170);
  LF = [leaf("#d2561b", "#7a2a08"), leaf("#e89a1f", "#8a4a08"), leaf("#a8321a", "#5a1408"), leaf("#c9b02a", "#6a5a08")];
}

export function mount(container, opts = {}) {
  assets();
  const o = { effect: "snow", intensity: null, zIndex: -1, pointer: true, respectReducedMotion: false, ...opts };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (getComputedStyle(container).position === "static") container.style.position = "relative";
  container.style.isolation = "isolate";

  const fill = `position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:${o.zIndex}`;
  const cv = document.createElement("canvas"); cv.style.cssText = fill + ";display:block";
  const bl = document.createElement("div"); bl.style.cssText = fill + ";display:none";
  container.prepend(cv, bl);
  const ctx = cv.getContext("2d");

  let mode, f = .5, W = 0, H = 0, P = [], X = [], T = {}, mx = 0, my = 0, sx = 0, sy = 0, has = false, raf = 0, visible = true;
  const reduced = () => o.respectReducedMotion && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mkStars = (n) => { P = []; for (let i = 0; i < n; i++) P.push({ x: R(W), y: R(H), r: .4 + R(1.1), ph: R(TAU), sp: .0008 + R(.002) }); };
  const twinkles = (t, n) => { ctx.fillStyle = "#fff"; for (let i = 0; i < n && i < P.length; i++) { const s = P[i]; ctx.globalAlpha = .3 + .7 * Math.abs(Math.sin(t * s.sp + s.ph)); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; };
  const lowres = (d) => { T.w = Math.ceil(W / d); T.h = Math.ceil(H / d); T.c = document.createElement("canvas"); T.c.width = T.w; T.c.height = T.h; T.x = T.c.getContext("2d"); T.img = T.x.createImageData(T.w, T.h); };
  const vig = (a) => { const v = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .95); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); };

  function init() {
    W = container.clientWidth; H = container.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); P = []; X = []; T = {};
    if (!W || !H) console.warn("[bg-effects] the container has 0 width or height, so nothing can be drawn. Give it a size (e.g. min-height: 100vh).");
    bl.style.display = mode === "blur" ? "block" : "none";
    const M = mode;
    if (M === "snowstorm") for (let i = 0; i < 500; i++) P.push({ x: R(W), y: R(H), z: .3 + R(.7) });
    if (M === "snow") for (let i = 0; i < 180; i++) P.push({ x: R(W), y: R(H), L: i % 3 < 1 ? 2 : i % 3, ph: R(TAU) });
    if (M === "rain") for (let i = 0; i < 300; i++) P.push({ x: R(W + 200), y: R(H), z: .2 + R(.8) });
    if (M === "stars") mkStars(200);
    if (M === "night") mkStars(240);
    if (M === "dust") for (let i = 0; i < 220; i++) P.push({ x: R(W), y: R(H), z: R(1), ph: R(TAU) });
    if (M === "leaf") for (let i = 0; i < 80; i++) P.push({ x: R(W), y: R(H), s: 14 + R(18), r: R(TAU), vr: (R(1) - .5) * .05, ph: R(TAU), c: i % 4 });
    if (M === "dither" || M === "tv") lowres(3);
    if (M === "fuzzy") lowres(4);
  }

  const D = {
    // ─── SNOWSTORM ───────────────────────────────────────────────
    // Heavy wind-blown snow. Each flake is drawn as a sideways streak
    // (longer + brighter = closer to the camera), plus slow white haze
    // clouds drifting across for a whiteout feel.
    // Intensity: wind speed (3-11 px/frame) and flake count (100-500).
    // Tweak: `wind` for slant/speed, the 500 pool size in init() for max flakes.
    snowstorm(t) {
      const wind = 3 + f * 8, n = Math.floor(500 * (.2 + f * .8)); ctx.lineCap = "round";
      for (let i = 0; i < n; i++) { const p = P[i], vx = wind * p.z * (.9 + .2 * Math.sin(t / 700 + i)), vy = 2 + p.z * 4;
        ctx.strokeStyle = `rgba(240,246,255,${.25 + p.z * .55})`; ctx.lineWidth = .8 + p.z * 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - vx * 2.2, p.y - vy * 1.2); ctx.stroke();
        p.x += vx; p.y += vy; if (p.x > W + 30) { p.x = -30; p.y = R(H); } if (p.y > H + 10) { p.y = -10; p.x = R(W); } }
      for (let i = 0; i < 4; i++) { const x = ((t * .04 * (1 + i * .4) + i * 260) % (W + 500)) - 250; ctx.globalAlpha = f * .2; ctx.drawImage(SW, x, H * (.15 + i * .2), 520, H * .45); }
      ctx.globalAlpha = 1;
    },
    // ─── SNOW ────────────────────────────────────────────────────
    // Calm snowfall in 3 depth layers (S): tiny far flakes, medium flakes,
    // and big soft blurry ones up close. A slow wind gust (gu) pushes them sideways.
    // Intensity: number of flakes (reaches the full 180 at 50%).
    // Tweak: the S array (s = size, a = opacity, v = fall speed, sw = sway).
    snow(t) {
      const gu = Math.sin(t / 3200) * .5 + Math.sin(t / 1100) * .15, n = Math.floor(180 * Math.min(1, f * 2)), S = [{ s: 7, a: .6, v: .45, sw: .25 }, { s: 13, a: .75, v: .9, sw: .5 }, { s: 30, a: .3, v: 1.8, sw: .9 }];
      for (let i = 0; i < n; i++) { const p = P[i], q = S[p.L]; p.ph += .015; p.y += q.v; p.x += Math.sin(p.ph) * q.sw + gu * q.v * 1.2;
        if (p.y > H + 20) { p.y = -20; p.x = R(W); } if (p.x > W + 30) p.x = -30; if (p.x < -30) p.x = W + 30;
        ctx.globalAlpha = q.a; ctx.drawImage(SW, p.x - q.s / 2, p.y - q.s / 2, q.s, q.s); }
      ctx.globalAlpha = 1;
    },
    // ─── RAIN ────────────────────────────────────────────────────
    // Slanted raindrops at different depths (p.z: far = faint/slow, near = bright/fast).
    // Near drops spawn 3 tiny splash particles when they hit the bottom (array X).
    // No lightning or flashes by design.
    // Intensity: number of drops (reaches the full 300 at 50%).
    // Tweak: `p.x -= v * .25` is the slant; change .25 for more/less angle.
    rain() {
      ctx.lineCap = "round"; const n = Math.floor(300 * Math.min(1, f * 2));
      for (let i = 0; i < n; i++) { const p = P[i], v = 9 + p.z * 15, l = 8 + p.z * 20; ctx.strokeStyle = `rgba(200,220,250,${.15 + p.z * .45})`; ctx.lineWidth = .5 + p.z; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + l * .25, p.y - l); ctx.stroke(); p.y += v; p.x -= v * .25;
        if (p.y > H - R(10)) { if (p.z > .5) for (let k = 0; k < 3; k++) X.push({ x: p.x, y: H - 2, vx: (R(2) - 1) * 1.6, vy: -1 - R(2), l: 14 }); p.y = -R(80); p.x = R(W + 200); } }
      ctx.fillStyle = "rgba(210,228,255,.6)";
      for (let i = X.length - 1; i >= 0; i--) { const s = X[i]; ctx.globalAlpha = s.l / 14; ctx.fillRect(s.x, s.y, 1.6, 1.6); s.x += s.vx; s.y += s.vy; s.vy += .28; if (--s.l <= 0) X.splice(i, 1); }
      ctx.globalAlpha = 1;
    },
    // ─── SHOOTING STARS ──────────────────────────────────────────
    // Twinkling white stars (fade in/out on their own timers) plus meteors that
    // streak diagonally with a glowing head and a fading blue-white tail.
    // Intensity: meteor frequency + max meteors at once (1-5), and star count.
    // Tweak: `sp` is meteor speed, `m` is how long it lives (frames).
    stars(t) {
      twinkles(t, Math.floor(200 * (.3 + f * .7)));
      if (X.length < 1 + Math.ceil(f * 4) && Math.random() < .004 + f * .05) { const sp = 11 + R(6); X.push({ x: R(W * .8), y: R(H * .4), vx: sp * .86, vy: sp * .5, l: 0, m: 38 + R(14) }); }
      for (let i = X.length - 1; i >= 0; i--) { const s = X[i], q = 1 - s.l / s.m, tx = s.x - s.vx * 7, ty = s.y - s.vy * 7, g = ctx.createLinearGradient(s.x, s.y, tx, ty);
        g.addColorStop(0, `rgba(255,255,255,${q})`); g.addColorStop(.3, `rgba(190,205,255,${q * .5})`); g.addColorStop(1, "rgba(150,170,255,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.globalAlpha = q; ctx.drawImage(SW, s.x - 9, s.y - 9, 18, 18); ctx.globalAlpha = 1;
        s.x += s.vx; s.y += s.vy; if (++s.l > s.m) X.splice(i, 1); }
    },
    // ─── BLURRED BACKGROUND ──────────────────────────────────────
    // Draws NOTHING on the canvas. Instead it turns on a transparent div with a
    // CSS backdrop-filter, which blurs whatever is behind it (image, video, gradient).
    // Intensity: blur radius, 0px (sharp) to 24px (100%).
    // Tweak: change the `24` to allow a stronger maximum blur.
    blur() { const px = (f * 24).toFixed(1) + "px"; if (T.px !== px) { T.px = px; bl.style.backdropFilter = bl.style.webkitBackdropFilter = `blur(${px})`; } },
    // ─── NIGHT TIME ──────────────────────────────────────────────
    // A dark blue tint over everything, twinkling stars, and a vignette
    // (darker corners). No moon or scenery, it only dims what is underneath.
    // Intensity: tint darkness (10%-60% opacity), star count and vignette strength.
    // Tweak: the rgba(4,8,32,...) colour to shift the tint (e.g. purple or black).
    night(t) { ctx.fillStyle = `rgba(4,8,32,${.1 + f * .5})`; ctx.fillRect(0, 0, W, H); twinkles(t, Math.floor(240 * (.2 + f * .8))); vig(.2 + f * .4); },
    // ─── OLD TV ──────────────────────────────────────────────────
    // CRT look, built from 5 layers: (1) black & white static noise,
    // (2) a slow rolling light bar, (3) horizontal scanlines every 3px,
    // (4) a faint random blue flicker, (5) dark vignette corners.
    // Intensity: strength of all five (50% = 5/10 on the preview slider).
    // Tweak: `y += 3` for scanline spacing, `t * .12` for roll-bar speed.
    tv(t) {
      const d = T.img.data; for (let i = 0; i < d.length; i += 4) { const v = R(255); d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255; }
      T.x.putImageData(T.img, 0, 0); ctx.globalAlpha = .03 + f * .3; ctx.imageSmoothingEnabled = false; ctx.drawImage(T.c, 0, 0, W, H); ctx.globalAlpha = 1;
      const ry = (t * .12) % (H + 160) - 80, rb = ctx.createLinearGradient(0, ry, 0, ry + 90); rb.addColorStop(0, "rgba(255,255,255,0)"); rb.addColorStop(.5, `rgba(255,255,255,${.04 + f * .12})`); rb.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = rb; ctx.fillRect(0, ry, W, 90);
      ctx.fillStyle = `rgba(0,0,0,${.12 + f * .3})`; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1.2);
      ctx.fillStyle = `rgba(120,180,255,${(.01 + R(.04)) * f * 2})`; ctx.fillRect(0, 0, W, H); vig(.25 + f * .5);
    },
    // ─── DITHER ──────────────────────────────────────────────────
    // Retro 1-bit pattern. A moving wave field (sum of sines) is compared against
    // a 4x4 Bayer matrix `B` to decide which low-res pixels turn on, then scaled up
    // with smoothing off to keep hard pixel edges. Dots are light lilac.
    // Intensity: threshold `k`, so low = sparse dots, high = dense fill.
    // Tweak: lowres(3) in init() sets the pixel size, d[o..o+2] sets the dot colour.
    dither(t) {
      const w = T.w, h = T.h, B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], d = T.img.data, k = .25 + f * 2.2;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const v = (Math.sin(x * .07 + t * .0006) + Math.sin(y * .09 - t * .0005) + Math.sin((x + y) * .05 + t * .0004) + Math.sin(Math.hypot(x - w / 2, y - h / 2) * .09 - t * .001)) * .125 + .5,
          on = v * k > B[(y & 3) * 4 + (x & 3)] / 16 + .02, o = (y * w + x) * 4; d[o] = 235; d[o + 1] = 228; d[o + 2] = 255; d[o + 3] = on ? 230 : 0; }
      T.x.putImageData(T.img, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(T.c, 0, 0, W, H);
    },
    // ─── FUZZY ───────────────────────────────────────────────────
    // Soft coloured grain. A tiny noise image is regenerated every 3rd frame (so it
    // shimmers calmly instead of strobing) and stretched up with smoothing on,
    // which turns it into a soft fuzz rather than sharp static.
    // Intensity: opacity of the grain (6%-61%).
    // Tweak: lowres(4) in init() (bigger number = chunkier fuzz), the d[i] colours.
    fuzzy() {
      if (!T.fr || (T.fr = (T.fr + 1) % 3) === 0) { T.fr = 1; const d = T.img.data; for (let i = 0; i < d.length; i += 4) { const v = R(255); d[i] = v * .8 + 70; d[i + 1] = v * .7 + 60; d[i + 2] = v + 60; d[i + 3] = R(255); } T.x.putImageData(T.img, 0, 0); }
      ctx.globalAlpha = .06 + f * .55; ctx.imageSmoothingEnabled = true; ctx.drawImage(T.c, 0, 0, W, H); ctx.globalAlpha = 1;
    },
    // ─── FLASHLIGHT ──────────────────────────────────────────────
    // A soft warm radial glow that follows the pointer with easing (sx, sy).
    // With no pointer it drifts around on its own. It only ADDS light, it never
    // darkens the rest of the page.
    // Intensity: radius (90-280px) and brightness.
    // Tweak: the .14 easing value (lower = lazier follow), rgba(255,246,220) for colour.
    flash(t) {
      const tx = has ? mx : W / 2 + Math.cos(t / 1500) * W * .3, ty = has ? my : H / 2 + Math.sin(t / 1100) * H * .25; sx += (tx - sx) * .14; sy += (ty - sy) * .14;
      const Rr = 90 + f * 190, g = ctx.createRadialGradient(sx, sy, 0, sx, sy, Rr);
      g.addColorStop(0, `rgba(255,246,220,${.2 + f * .3})`); g.addColorStop(.5, `rgba(255,246,220,${.08 + f * .12})`); g.addColorStop(1, "rgba(255,246,220,0)");
      ctx.fillStyle = g; ctx.fillRect(sx - Rr, sy - Rr, Rr * 2, Rr * 2);
    },
    // ─── PARTICLES ───────────────────────────────────────────────
    // Soft glowing dust specks with depth (p.z: far = small + dim, near = big + bright)
    // that drift in slow curls and twinkle. The pointer pushes nearby specks away
    // within a 120px radius.
    // Intensity: number of particles (reaches the full 220 at 50%).
    // Tweak: the 120 push radius, SD sprite colour (warm yellow) in assets().
    dust(t) {
      const n = Math.floor(220 * Math.min(1, f * 2));
      for (let i = 0; i < n; i++) { const p = P[i]; p.ph += .006 + p.z * .004; const sp = .15 + p.z * .5; p.x += Math.cos(p.ph + t * .0002) * sp * .6 + .12; p.y += Math.sin(p.ph * 1.3) * sp * .5 - .08 * sp;
        if (has) { const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy); if (d < 120 && d > 1) { const q = (1 - d / 120) * 3 * (.4 + p.z); p.x += dx / d * q; p.y += dy / d * q; } }
        if (p.x > W + 20) p.x = -20; if (p.x < -20) p.x = W + 20; if (p.y > H + 20) p.y = -20; if (p.y < -20) p.y = H + 20;
        const s = 5 + p.z * p.z * 30; ctx.globalAlpha = (.2 + p.z * .5) * (.7 + .3 * Math.sin(t * .002 + p.ph * 3)); ctx.drawImage(SD, p.x - s / 2, p.y - s / 2, s, s); }
      ctx.globalAlpha = 1;
    },
    // ─── LEAF FALL ───────────────────────────────────────────────
    // Autumn leaves (4 colours, pre-drawn in assets()) that fall, sway side to side,
    // spin, and flip (scale on X fakes a 3D turn). A slow gust (gu) blows them around
    // and the pointer nudges and spins leaves within 110px.
    // Intensity: number of leaves (0-80).
    // Tweak: `.7 + p.s * .04` is fall speed, LF colours in assets() for other seasons.
    leaf(t) {
      const n = Math.min(80, Math.round(f * 160)), gu = Math.sin(t / 2600) * .8;
      for (let i = 0; i < n; i++) { const p = P[i]; p.ph += .018; p.y += .7 + p.s * .04; p.x += Math.sin(p.ph) * 1.1 + gu + .2; p.r += p.vr;
        if (has) { const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy); if (d < 110 && d > 1) { p.x += dx / d * (1 - d / 110) * 4; p.r += .05; } }
        if (p.y > H + 30) { p.y = -30; p.x = R(W); } if (p.x > W + 30) p.x = -30; if (p.x < -30) p.x = W + 30;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r + Math.sin(p.ph) * .5); ctx.scale(Math.cos(p.ph * .8) * .8 + .2, 1); ctx.globalAlpha = .6 + p.s / 60; ctx.drawImage(LF[p.c], -p.s / 2, -p.s / 2, p.s, p.s); ctx.restore(); }
      ctx.globalAlpha = 1;
    },
  };

  function draw(t) { ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true; ctx.clearRect(0, 0, W, H); D[mode](t); }
  function loop(t) { raf = 0; if (!visible) return; draw(t); raf = requestAnimationFrame(loop); }
  function start() { if (reduced()) { console.info("[bg-effects] showing a still frame because the OS has \"reduce motion\" on. Pass respectReducedMotion: false to always animate."); draw(performance.now()); return; } if (!raf && visible) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  const ro = new ResizeObserver(() => { init(); start(); }); ro.observe(container);
  const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; visible ? start() : stop(); }); io.observe(container);
  const pt = (e) => { const r = container.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; has = true; };
  const lv = () => { has = false; };
  if (o.pointer) { container.addEventListener("pointermove", pt); container.addEventListener("pointerdown", pt); container.addEventListener("pointerleave", lv); }

  const api = {
    set(id, intensity) {
      const e = effects.find((x) => x.id === id); if (!e) throw new Error("Unknown effect: " + id + ". Use one of: " + effects.map((x) => x.id).join(", "));
      mode = id; f = Math.max(0, Math.min(100, intensity ?? e.default)) / 100; T = {}; init(); stop(); start(); return api;
    },
    setIntensity(n) { f = Math.max(0, Math.min(100, n)) / 100; return api; },
    destroy() { stop(); ro.disconnect(); io.disconnect(); container.removeEventListener("pointermove", pt); container.removeEventListener("pointerdown", pt); container.removeEventListener("pointerleave", lv); cv.remove(); bl.remove(); },
  };
  api.set(o.effect, o.intensity ?? undefined);
  return api;
}
export const BgEffects = { mount, effects };
export default BgEffects;
if (typeof window !== "undefined") window.BgEffects = BgEffects;
