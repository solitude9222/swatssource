import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import type { Account } from "../lib/auth";
import {
  DEFAULT_ABOUT_DESIGN,
  MAX_BIO_LENGTH,
  type About,
  type AboutDesign,
  type ProfileColors,
} from "../lib/about";
import type { WidgetStore } from "../lib/widgets";
import { ColorField } from "./ColorPicker";
import { RichText } from "./RichText";
import {
  CalendarIcon,
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  CodeIcon,
  LinkIcon,
  PaletteIcon,
  PinIcon,
  SlidersIcon,
  UserIcon,
} from "./Icons";
import "../about.css";

const COLOR_FIELDS: { key: keyof ProfileColors; label: string }[] = [
  { key: "accent", label: "Accent" },
  { key: "text", label: "Primary text" },
  { key: "muted", label: "Secondary text" },
  { key: "background", label: "Page background" },
  { key: "card", label: "Card background" },
  { key: "border", label: "Border color" },
];

const SLIDERS: {
  key: keyof Pick<
    AboutDesign,
    | "cardWidth"
    | "cardPadding"
    | "cardRadius"
    | "borderWidth"
    | "borderOpacity"
    | "backgroundOpacity"
    | "backgroundBlur"
    | "avatarSize"
    | "nameSize"
    | "bioSize"
    | "widgetGap"
  >;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}[] = [
  { key: "cardWidth", label: "Card width", min: 300, max: 680, step: 1, unit: "px" },
  { key: "cardPadding", label: "Card padding", min: 12, max: 40, step: 1, unit: "px" },
  { key: "cardRadius", label: "Corner radius", min: 0, max: 36, step: 1, unit: "px" },
  { key: "borderWidth", label: "Border width", min: 0, max: 6, step: 1, unit: "px" },
  { key: "borderOpacity", label: "Border opacity", min: 0, max: 1, step: 0.01 },
  { key: "backgroundOpacity", label: "Background opacity", min: 0.2, max: 1, step: 0.01 },
  { key: "backgroundBlur", label: "Background blur", min: 0, max: 30, step: 1, unit: "px" },
  { key: "avatarSize", label: "Avatar size", min: 44, max: 132, step: 1, unit: "px" },
  { key: "nameSize", label: "Name size", min: 16, max: 34, step: 1, unit: "px" },
  { key: "bioSize", label: "Bio size", min: 9, max: 16, step: 0.5, unit: "px" },
  { key: "widgetGap", label: "Widget gap", min: 4, max: 28, step: 1, unit: "px" },
];

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const display = step < 1 ? value.toFixed(2) : value.toString();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="about-slider">
      <span className="about-slider-head">
        <span>{label}</span>
        <b>
          {display}
          {unit}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--slider-fill": `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  const display = step < 1 ? `${Math.round(value * 100)}%` : `${value}${unit}`;
  return (
    <label className="about-range-row">
      <span className="about-range-head">
        <span>{label}</span>
        <b>{display}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--slider-fill": `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function DashboardAbout({
  user,
  about,
  widgets,
  onSave,
}: {
  user: Account;
  about: About;
  widgets: WidgetStore;
  onSave: (about: About) => void;
}) {
  const [draft, setDraft] = useState<About>(about);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const advancedRef = useRef<HTMLDetailsElement>(null);
  const advancedBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(about);
  }, [about]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(about);
  const lineCount = draft.bio ? draft.bio.split("\n").length : 0;

  const update = (patch: Partial<About>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  };

  const updateDesign = (patch: Partial<AboutDesign>) => {
    setDraft((current) => ({ ...current, design: { ...current.design, ...patch } }));
    setSaved(false);
  };

  const updateColor = (key: keyof ProfileColors, color: string) => {
    setDraft((current) => ({
      ...current,
      design: { ...current.design, colors: { ...current.design.colors, [key]: color } },
    }));
    setSaved(false);
  };

  const applyMarkup = (before: string, after: string, placeholder: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = draft.bio.slice(start, end) || placeholder;
    const next = `${draft.bio.slice(0, start)}${before}${selected}${after}${draft.bio.slice(end)}`.slice(
      0,
      MAX_BIO_LENGTH,
    );
    update({ bio: next });
    window.requestAnimationFrame(() => {
      el.focus();
      const selectionStart = start + before.length;
      el.setSelectionRange(selectionStart, selectionStart + selected.length);
    });
  };

  const insertToken = (token: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${draft.bio.slice(0, start)}${token}${draft.bio.slice(end)}`.slice(0, MAX_BIO_LENGTH);
    update({ bio: next });
    window.requestAnimationFrame(() => {
      el.focus();
      const cursor = start + token.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const prefixLine = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = draft.bio.lastIndexOf("\n", start - 1) + 1;
    const existing = draft.bio.slice(lineStart).match(/^(#{1,3}|>|[-*])\s+/)?.[0] ?? "";
    const next = `${draft.bio.slice(0, lineStart)}${prefix}${draft.bio.slice(lineStart + existing.length)}`.slice(
      0,
      MAX_BIO_LENGTH,
    );
    update({ bio: next });
    window.requestAnimationFrame(() => {
      el.focus();
      const cursor = start - existing.length + prefix.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const toggleAdvanced = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const panel = advancedRef.current;
    const content = advancedBodyRef.current;
    if (!panel || !content) return;

    content.getAnimations().forEach((animation) => animation.cancel());
    content.style.overflow = "hidden";

    if (panel.open) {
      const height = content.getBoundingClientRect().height;
      const animation = content.animate(
        [
          { height: `${height}px`, opacity: 1 },
          { height: "0px", opacity: 0 },
        ],
        { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
      animation.onfinish = () => {
        panel.open = false;
        content.style.overflow = "";
      };
    } else {
      panel.open = true;
      const height = content.getBoundingClientRect().height;
      const animation = content.animate(
        [
          { height: "0px", opacity: 0 },
          { height: `${height}px`, opacity: 1 },
        ],
        { duration: 280, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
      animation.onfinish = () => {
        content.style.overflow = "";
      };
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: About = {
      ...draft,
      displayName: draft.displayName.trim(),
      bio: draft.bio.slice(0, MAX_BIO_LENGTH),
      location: draft.location.trim(),
    };
    setDraft(next);
    onSave(next);
    setSaved(true);
  };

  return (
    <>
      <div className="about-page" key={user.id}>
        <form className="about-editor" id="about-form" onSubmit={submit}>
          <section className="dash-panel about-panel" data-reveal>
            <header className="about-panel-head">
              <div>
                <h2>Customization</h2>
                <p>Profile description and location, plus opacity and blur applied to the whole profile.</p>
              </div>
            </header>

            <div className="about-block">
              <span className="about-label">Display name</span>
              <div className="about-input-with-icon">
                <UserIcon size={13} />
                <input
                  value={draft.displayName}
                  onChange={(event) => update({ displayName: event.target.value.slice(0, 32) })}
                  placeholder={user.username}
                  maxLength={32}
                  autoComplete="nickname"
                />
              </div>
              <small className="about-help">
                Leave empty to use your account name. If that's empty too, your profile shows no name.
              </small>
            </div>

            <div className="about-block">
              <div className="about-block-head">
                <span className="about-label">Description</span>
                <span className="about-counter">
                  {lineCount}/10 lines · {draft.bio.length}/{MAX_BIO_LENGTH}
                </span>
              </div>

              <div className="about-rich">
                <div className="rich-toolbar" role="toolbar" aria-label="Description formatting">
                  <div className="rich-tool-group">
                    <button type="button" className="rich-tool" title="Bold — **text**" onClick={() => applyMarkup("**", "**", "bold text")}>
                      <b>B</b>
                    </button>
                    <button type="button" className="rich-tool" title="Italic — *text*" onClick={() => applyMarkup("*", "*", "italic text")}>
                      <i>I</i>
                    </button>
                    <button type="button" className="rich-tool" title="Underline — __text__" onClick={() => applyMarkup("__", "__", "underlined text")}>
                      <u>U</u>
                    </button>
                    <button type="button" className="rich-tool" title="Strikethrough — ~~text~~" onClick={() => applyMarkup("~~", "~~", "strikethrough")}>
                      <s>S</s>
                    </button>
                    <button type="button" className="rich-tool" title="Highlight — ==text==" onClick={() => applyMarkup("==", "==", "highlighted text")}>
                      <span className="rt-highlight">A</span>
                    </button>
                  </div>

                  <span className="rich-tool-sep" />

                  <div className="rich-tool-group">
                    <button type="button" className="rich-tool" title="Heading 1 — # Heading" onClick={() => prefixLine("# ")}>
                      <span className="rich-tool-h">H1</span>
                    </button>
                    <button type="button" className="rich-tool" title="Heading 2 — ## Heading" onClick={() => prefixLine("## ")}>
                      <span className="rich-tool-h">H2</span>
                    </button>
                    <button type="button" className="rich-tool" title="Quote — > text" onClick={() => prefixLine("> ")}>
                      <span className="rich-tool-quote">“</span>
                    </button>
                    <button type="button" className="rich-tool" title="Bullet list — - item" onClick={() => prefixLine("- ")}>
                      <span className="rich-tool-list">≡</span>
                    </button>
                  </div>

                  <span className="rich-tool-sep" />

                  <div className="rich-tool-group">
                    <button type="button" className="rich-tool" title="Inline code — `code`" onClick={() => applyMarkup("`", "`", "code")}>
                      <CodeIcon size={13} />
                    </button>
                    <button type="button" className="rich-tool" title="Code block — ```" onClick={() => applyMarkup("\n```\n", "\n```\n", "your code")}>
                      <span className="rich-tool-code">{"{ }"}</span>
                    </button>
                    <button type="button" className="rich-tool" title="Insert link — [label](https://…)" onClick={() => applyMarkup("[", "](https://example.com)", "link label")}>
                      <LinkIcon size={13} />
                    </button>
                    <button type="button" className="rich-tool" title="Spoiler — ||text||" onClick={() => applyMarkup("||", "||", "hidden text")}>
                      <span className="rich-tool-spoiler">spoiler</span>
                    </button>
                  </div>

                  <span className="rich-tool-sep" />

                  <div className="rich-tool-group rich-tool-group--live">
                    <button type="button" className="rich-tool" title="Insert live clock" onClick={() => insertToken("{{clock}}")}>
                      <ClockIcon size={12} />
                    </button>
                    <button type="button" className="rich-tool" title="Insert today's date" onClick={() => insertToken("{{date}}")}>
                      <CalendarIcon size={12} />
                    </button>
                    <button type="button" className="rich-tool rich-tool--text" title="Insert current timestamp" onClick={() => insertToken(`{{stamp:${Date.now()}}}`)}>
                      stamp
                    </button>
                    <button type="button" className="rich-tool rich-tool--text" title="Insert a live countdown" onClick={() => insertToken(`{{countdown:${Date.now() + 604_800_000}}}`)}>
                      countdown
                    </button>
                  </div>
                </div>

                <div className="rich-editor-grid">
                  <textarea
                    ref={textareaRef}
                    value={draft.bio}
                    onChange={(event) => update({ bio: event.target.value.slice(0, MAX_BIO_LENGTH) })}
                    placeholder="Tell visitors a bit about you"
                    rows={9}
                    maxLength={MAX_BIO_LENGTH}
                    spellCheck={false}
                  />
                  <div className="rich-live-preview">
                    {draft.bio.trim() ? (
                      <RichText text={draft.bio} />
                    ) : (
                      <span className="rich-live-empty">Your preview will appear here as you type.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="about-columns">
              <label className="about-field">
                <span>Location</span>
                <div className="about-input-with-icon">
                  <PinIcon size={13} />
                  <input
                    value={draft.location}
                    onChange={(event) => update({ location: event.target.value.slice(0, 64) })}
                    placeholder="e.g. Berlin, Germany"
                    maxLength={64}
                  />
                </div>
              </label>

              <label className="about-field">
                <span>Theme</span>
                <select
                  value={draft.design.theme}
                  onChange={(event) =>
                    updateDesign({ theme: event.target.value as AboutDesign["theme"] })
                  }
                >
                  <option value="portfolio">Portfolio</option>
                  <option value="modern">Modern</option>
                  <option value="default">Default</option>
                </select>
              </label>

              <label className="about-field">
                <span>Portfolio layout</span>
                <select
                  value={draft.design.layout}
                  onChange={(event) =>
                    updateDesign({ layout: event.target.value as AboutDesign["layout"] })
                  }
                >
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                </select>
              </label>
            </div>

            <div className="about-ranges">
              <RangeRow
                label="Profile opacity"
                value={draft.design.backgroundOpacity}
                min={0.2}
                max={1}
                step={0.01}
                onChange={(value) => updateDesign({ backgroundOpacity: value })}
              />
              <RangeRow
                label="Profile blur"
                value={draft.design.backgroundBlur}
                min={0}
                max={30}
                step={1}
                unit="px"
                onChange={(value) => updateDesign({ backgroundBlur: value })}
              />
            </div>

            <details className="about-advanced" ref={advancedRef}>
              <summary onClick={toggleAdvanced}>
                <span className="about-advanced-label">
                  <SlidersIcon size={13} />
                  Advanced card design
                </span>
                <ChevronIcon size={13} className="about-advanced-chevron" />
              </summary>

              <div className="about-advanced-body" ref={advancedBodyRef}>
                <div className="about-slider-grid">
                  {SLIDERS.map((slider) => (
                    <Slider
                      key={slider.key}
                      label={slider.label}
                      value={draft.design[slider.key]}
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      unit={slider.unit}
                      onChange={(value) => updateDesign({ [slider.key]: value })}
                    />
                  ))}
                </div>

                <div className="about-advanced-head">
                  <span>
                    <PaletteIcon size={12} />
                    Profile colors
                  </span>
                  <button
                    type="button"
                    className="about-reset"
                    onClick={() => updateDesign(DEFAULT_ABOUT_DESIGN)}
                  >
                    Reset design
                  </button>
                </div>

                <div className="about-color-grid">
                  {COLOR_FIELDS.map((color) => (
                    <ColorField
                      key={color.key}
                      label={color.label}
                      value={draft.design.colors[color.key]}
                      onChange={(value) => updateColor(color.key, value)}
                    />
                  ))}
                </div>
              </div>
            </details>
          </section>

          <div className="about-savebar">
            <span className="about-save-note">Saved in this browser</span>
            <div className="about-save-actions">
              {saved && !dirty ? (
                <span className="about-saved">
                  <CheckIcon size={12} />
                  Saved
                </span>
              ) : null}
              <button type="submit" className="btn btn-primary btn-sm" disabled={!dirty}>
                Save changes
              </button>
            </div>
          </div>
        </form>
      </div>

    </>
  );
}
