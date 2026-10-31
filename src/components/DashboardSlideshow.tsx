import type { CSSProperties } from "react";
import type { Account } from "../lib/auth";
import type { About, SlideshowSettings } from "../lib/about";
import type { WidgetStore } from "../lib/widgets";
import "../layoutPages.css";

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="lp-toggle">
      <div>
        <b>{label}</b>
        <p>{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch${checked ? " is-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

export function DashboardSlideshow({
  user,
  about,
  widgets,
  onChange,
}: {
  user: Account;
  about: About;
  widgets: WidgetStore;
  onChange: (about: About) => void;
}) {
  const slideshow = about.design.slideshow;

  const update = (patch: Partial<SlideshowSettings>) => {
    onChange({ ...about, design: { ...about.design, slideshow: { ...slideshow, ...patch } } });
  };

  const fill = ((slideshow.speed - 250) / (1400 - 250)) * 100;

  return (
    <div className="lp-page lp-page--full">
      <section className="dash-panel lp-panel">
        {about.design.cardStyle !== "slideshow" ? (
          <div className="lp-notice">
            <p>Your page is not using the slideshow layout yet.</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() =>
                onChange({ ...about, design: { ...about.design, cardStyle: "slideshow" } })
              }
            >
              Use slideshow layout
            </button>
          </div>
        ) : null}

        <div className="lp-settings">
          <Toggle
            label="Smooth scrolling"
            hint="Ease between sections instead of jumping."
            checked={slideshow.smooth}
            onChange={(value) => update({ smooth: value })}
          />
          <Toggle
            label="Scroll indicator"
            hint="Show the small down button at the bottom."
            checked={slideshow.indicator}
            onChange={(value) => update({ indicator: value })}
          />
          <Toggle
            label="Section icons"
            hint="Show the dot navigation on the right side."
            checked={slideshow.sideNav}
            onChange={(value) => update({ sideNav: value })}
          />

          <label className="lp-slider">
            <span className="lp-slider-head">
              <span>Scroll speed</span>
              <b>{slideshow.speed}ms</b>
            </span>
            <input
              type="range"
              min={250}
              max={1400}
              step={50}
              value={slideshow.speed}
              style={{ "--slider-fill": `${fill}%` } as CSSProperties}
              onChange={(event) => update({ speed: Number(event.target.value) })}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
