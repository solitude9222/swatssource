/**
 * The site's ambient layer, rebuilt: an animated aurora wash that drifts
 * across the deep background, a slow-parallax starfield, a scrolling
 * perspective grid along the bottom, a light beam that sweeps through, plus
 * fine noise and a vignette to keep the edges quiet. Every layer is CSS
 * animated and pointer-inert; the faint logo mark still sits behind it all.
 */
export function SiteBackdrop() {
  return (
    <div className="site-backdrop" aria-hidden="true">
      <div className="site-wash" />
      <div className="bd-stars bd-stars--far" />
      <div className="bd-stars bd-stars--near" />
      <div className="bd-aurora bd-aurora--a" />
      <div className="bd-aurora bd-aurora--b" />
      <div className="bd-aurora bd-aurora--c" />
      <div className="bd-grid" />
      <div className="bd-beam bd-beam--one" />
      <div className="bd-beam bd-beam--two" />
      <img className="site-mark" src="/logo.png" alt="" decoding="async" />
      <div className="bd-noise" />
      <div className="bd-vignette" />
    </div>
  );
}
