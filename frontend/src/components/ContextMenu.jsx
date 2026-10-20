import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { runMenuAction } from "@/lib/menuActions";
import {
  ExternalLink, Copy, Sparkles, LayoutGrid, Music, Play, Volume2,
  Palette, Link as LinkIcon, ShieldCheck, Share2, ArrowLeft, ArrowRight,
  RotateCcw, MousePointerClick, MessageSquare, Settings, Eye, Trash2,
} from "lucide-react";

const ICON_MAP = {
  ExternalLink, Copy, Sparkles, LayoutGrid, Music, Play, Volume2,
  Palette, Link: LinkIcon, ShieldCheck, Share2, ArrowLeft, ArrowRight,
  RotateCcw, MousePointerClick, MessageSquare, Settings, Eye, Trash2,
};

/* ---------------------------------------------------------------------------
   The swats right-click menu.

   The browser's own menu is an unstyled grey slab next to a themed black site,
   and it offers nothing about the thing you clicked. This replaces it
   site-wide with one styled menu whose items are what the SURFACE is: a
   profile offers Open / Copy @name / Copy link; a link card offers Open /
   Copy address; a bare background gets the universal set (Back, Forward,
   Reload, Copy, Select all).

   Surfaces declare themselves in JSX with three data attributes rather than
   through callbacks, which is what keeps this attachable everywhere:

     <span data-menu-id="profile" data-menu-name={username}
           data-menu-href={`/${username}`} {...rest}>

   A right-click on anything without a data-menu-id still opens the menu —
   only the universal items — because a click that silently does nothing reads
   as "the site's menu is broken". Programmatic surfaces that own their menus
   (Radix dialogs) win by stopPropagation'ing before it reaches the window.

   The menu closes on any click, any key, a scroll or a blur — the same exits
   the native menu has — and is clamped inside the viewport on both axes, so
   one opened near a screen edge never lands half off-screen.
   --------------------------------------------------------------------------- */

const UNIVERSAL = [
  { label: "Back", action: "back", icon: "ArrowLeft" },
  { label: "Forward", action: "forward", icon: "ArrowRight" },
  { label: "Reload page", action: "reload", icon: "RotateCcw" },
  { sep: true },
  { label: "Copy", action: "copy-selection", icon: "Copy" },
  { label: "Select all", action: "select-all", icon: "MousePointerClick" },
];

/* Items for a surface, from what its attributes describe. */
const buildSurfaceItems = (surface) => {
  const id = surface?.getAttribute?.("data-menu-id") || "";
  const name = surface?.getAttribute?.("data-menu-name") || "";
  const href = surface?.getAttribute?.("data-menu-href") || "";

  /* 1. Distinct Widget Card Surface */
  if (id === "widget") {
    const type = surface?.getAttribute?.("data-menu-widget-type") || "";
    const title = surface?.getAttribute?.("data-menu-widget-title") || name || type || "Widget";
    const widgetUrl = surface?.getAttribute?.("data-menu-widget-url") || href || "";
    const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Widget";
    return [
      ...(widgetUrl
        ? [
            { label: `Open ${title}`, action: "open-link", href: widgetUrl, icon: "ExternalLink" },
            { label: "Copy link address", action: "copy", text: widgetUrl, icon: "Copy" },
          ]
        : []),
      { label: `Copy ${typeLabel} details`, action: "copy", text: `${typeLabel}: ${title}${widgetUrl ? ` (${widgetUrl})` : ""}`, icon: "Copy" },
      { label: "Customize widgets", action: "nav", path: "/!/dashboard/widgets", icon: "LayoutGrid" },
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  /* 2. Avatar Surface */
  if (id === "avatar") {
    const url = surface?.getAttribute?.("data-menu-url") || "";
    return [
      ...(url
        ? [
            { label: "Open avatar full size", action: "open-link", href: url, icon: "ExternalLink" },
            { label: "Copy avatar image link", action: "copy", text: url, icon: "Copy" },
          ]
        : []),
      { label: "Customize avatar", action: "nav", path: "/!/dashboard/editor", icon: "Sparkles" },
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  /* 3. Banner & Background Media Surface */
  if (id === "banner" || id === "background") {
    const url = surface?.getAttribute?.("data-menu-url") || "";
    return [
      ...(url
        ? [
            { label: "Open background image", action: "open-link", href: url, icon: "ExternalLink" },
            { label: "Copy image address", action: "copy", text: url, icon: "Copy" },
          ]
        : []),
      { label: "Customize background", action: "nav", path: "/!/dashboard/editor", icon: "Sparkles" },
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  /* 4. Audio Ambience & Track Surface */
  if (id === "audio") {
    const src = surface?.getAttribute?.("data-menu-audio-src") || "";
    return [
      { label: "Play / Pause music", action: "toggle-audio", icon: "Play" },
      { label: "Mute / Unmute music", action: "toggle-audio-mute", icon: "Volume2" },
      ...(src ? [{ label: "Copy audio track link", action: "copy", text: src, icon: "Copy" }] : []),
      { label: "Audio settings", action: "nav", path: "/!/dashboard/widgets", icon: "Music" },
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  /* 5. Biography Surface */
  if (id === "bio") {
    const bioText = surface?.getAttribute?.("data-menu-bio") || "";
    return [
      ...(bioText ? [{ label: "Copy biography", action: "copy", text: bioText, icon: "Copy" }] : []),
      { label: "Select all", action: "select-all", icon: "MousePointerClick" },
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  /* A conversation row. */
  if (id === "thread") {
    const threadId = surface?.getAttribute?.("data-menu-thread-id") || "";
    const kind = surface?.getAttribute?.("data-menu-thread-kind") || "direct";
    return [
      ...(threadId
        ? [{ label: kind === "group" ? "Open this group" : "Open this conversation", action: "open-thread", threadId, silent: true, icon: "MessageSquare" }]
        : []),
      ...(name ? [{ label: `Copy @${name}`, action: "copy", text: `@${name}`, icon: "Copy" }] : []),
      ...(kind === "group" && threadId
        ? [{ label: "Group settings", action: "thread-settings", threadId, silent: true, icon: "Settings" }]
        : []),
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  /* A message in the public room. */
  if (id === "global-message") {
    const messageId = surface?.getAttribute?.("data-menu-message-id") || "";
    const body = surface?.getAttribute?.("data-menu-message-body") || "";
    const author = surface?.getAttribute?.("data-menu-message-author") || "";
    const authorId = surface?.getAttribute?.("data-menu-message-author-id") || "";
    const moderate = surface?.getAttribute?.("data-menu-moderate") === "1";
    const items = [
      ...(body ? [{ label: "Copy message", action: "copy", text: body, icon: "Copy" }] : []),
      ...(moderate && messageId
        ? [
            { label: "Edit this message", action: "global-message-edit", messageId, silent: true, icon: "ExternalLink" },
            { label: "Delete this message", action: "global-message-delete", messageId, silent: true, icon: "Trash2" },
          ]
        : []),
      ...(moderate && authorId
        ? [
            {
              label: `Silence @${author}`,
              action: "global-message-silence",
              userId: authorId,
              username: author,
              silent: true,
              icon: "Settings",
            },
          ]
        : []),
    ];
    return [...(items.length ? [...items, { sep: true }] : []), ...UNIVERSAL];
  }

  /* A badge */
  if (id === "badge") {
    const badgeId = surface?.getAttribute?.("data-menu-badge") || "";
    const label = surface?.getAttribute?.("data-menu-badge-label") || badgeId;
    return [
      ...(label ? [{ label: `Copy “${label}”`, action: "copy", text: label, icon: "Copy" }] : []),
      ...(badgeId ? [{ label: "Copy badge id", action: "copy", text: badgeId, icon: "ShieldCheck" }] : []),
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  /* A template card in the marketplace. */
  if (id === "template") {
    const templateId = surface?.getAttribute?.("data-menu-template-id") || "";
    const title = surface?.getAttribute?.("data-menu-template-title") || name;
    return [
      ...(templateId
        ? [{ label: "Preview this template", action: "template-preview", templateId, silent: true, icon: "Eye" }]
        : []),
      ...(title ? [{ label: `Copy “${title}”`, action: "copy", text: title, icon: "Copy" }] : []),
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  /* An invite code row in the admin panel. */
  if (id === "invite") {
    const code = surface?.getAttribute?.("data-menu-invite") || "";
    return [
      ...(code ? [{ label: "Copy invite code", action: "copy", text: code, icon: "Copy" }] : []),
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  /* An announcement on the board. */
  if (id === "announcement") {
    const text = surface?.getAttribute?.("data-menu-announcement-text") || "";
    return [
      ...(text ? [{ label: "Copy announcement", action: "copy", text, icon: "Copy" }] : []),
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  if (id === "profile") {
    return [
      { label: "Open this profile", action: "open-profile", username: name, icon: "ExternalLink" },
      ...(!name ? [] : [{ label: `Copy @${name}`, action: "copy", text: `@${name}`, icon: "Copy" }]),
      ...(!href ? [] : [{ label: "Copy profile link", action: "copy", text: href, icon: "Link" }]),
      { sep: true },
      ...UNIVERSAL,
    ];
  }
  if (id === "user") {
    return [
      ...(!name ? [] : [{ label: "Open this profile", action: "open-profile", username: name, icon: "ExternalLink" }]),
      ...(!name ? [] : [{ label: `Copy @${name}`, action: "copy", text: `@${name}`, icon: "Copy" }]),
      { sep: true },
      ...UNIVERSAL,
    ];
  }
  if (id === "link" && href) {
    return [
      { label: "Open link", action: "open-link", href, icon: "ExternalLink" },
      { label: "Copy address", action: "copy", text: href, icon: "Copy" },
      ...(name ? [{ label: `Copy “${name}”`, action: "copy", text: name, icon: "Copy" }] : []),
      { label: "Share link", action: "share", text: href, title: name || "Link", icon: "Share2" },
      { sep: true },
      ...UNIVERSAL,
    ];
  }
  if (id === "thread" && name) {
    return [
      { label: "Open conversation", action: "open-thread", username: name, icon: "MessageSquare" },
      { label: `Copy @${name}`, action: "copy", text: `@${name}`, icon: "Copy" },
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  /* Dashboard background quick links */
  if (typeof window !== "undefined" && window.location?.pathname?.startsWith("/!/dashboard")) {
    return [
      { label: "Profile Editor", action: "nav", path: "/!/dashboard/editor", icon: "Palette" },
      { label: "Widgets & Music", action: "nav", path: "/!/dashboard/widgets", icon: "LayoutGrid" },
      { label: "Links & Socials", action: "nav", path: "/!/dashboard/links", icon: "Link" },
      { label: "Badges & Shelves", action: "nav", path: "/!/dashboard/badges", icon: "ShieldCheck" },
      { sep: true },
      ...UNIVERSAL,
    ];
  }

  return UNIVERSAL;
};

/* One run() switch, so adding a surface never means wiring a new callback. */
const run = (item, close) => {
  close();
  try {
    switch (item.action) {
      case "back":
        history.back();
        break;
      case "forward":
        history.forward();
        break;
      case "reload":
        location.reload();
        break;
      case "copy":
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(item.text || "");
        break;
      case "copy-selection": {
        const text = String(document.getSelection() || "");
        if (text && navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
        break;
      }
      case "select-all": {
        const sel = document.getSelection();
        if (sel?.selectAllChildren) sel.selectAllChildren(document.body);
        break;
      }
      case "nav":
        if (item.path) window.location.assign(item.path);
        break;
      case "toggle-audio":
        window.dispatchEvent(new CustomEvent("swats:toggle-audio"));
        break;
      case "toggle-audio-mute":
        window.dispatchEvent(new CustomEvent("swats:toggle-audio-mute"));
        break;
      case "share":
        if (navigator.share) {
          navigator.share({ title: item.title, url: item.text }).catch(() => {});
        } else if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(item.text || "");
        }
        break;
      case "open-thread":
        if (item.threadId && runMenuAction("open-thread", { threadId: item.threadId })) break;
        if (item.username) window.location.assign(`/${item.username}`);
        break;
      case "thread-settings":
        if (item.threadId) runMenuAction("thread-settings", { threadId: item.threadId });
        break;
      case "template-preview":
        if (item.templateId) runMenuAction("template-preview", { templateId: item.templateId });
        break;
      case "global-message-edit":
        if (item.messageId) runMenuAction("global-message-edit", { messageId: item.messageId });
        break;
      case "global-message-delete":
        if (item.messageId) runMenuAction("global-message-delete", { messageId: item.messageId });
        break;
      case "global-message-silence":
        if (item.userId) {
          runMenuAction("global-message-silence", { userId: item.userId, username: item.username });
        }
        break;
      case "open-profile":
        if (item.username) window.location.assign(`/${item.username}`);
        break;
      case "open-link": {
        const href = item.href || "";
        if (href) window.open(href, "_blank", "noopener,noreferrer");
        break;
      }
      default:
        break;
    }
  } catch {
    /* A menu action must never throw into the page */
  }
};

const MenuCtx = createContext({ present: false });
export const useContextMenuContext = () => useContext(MenuCtx);

export function ContextMenuProvider() {
  // One open menu at a time: { x, y, items }. The surface is read at open
  // time, so a re-render under the cursor can never leave a menu's items
  // pointing at a node that has since been replaced.
  const [state, setState] = useState(null);
  const menuRef = useRef(null);

  const open = useCallback((event) => {
    // The component owner may keep the native menu: library-controlled menus
    // and text inputs with their own spell-check surface stopPropagation, or
    // opt out with data-menu="native".
    const optedOut = event.target?.closest?.('[data-menu="native"]');
    if (optedOut) return;
    // Text entry keeps the native menu, full stop: Paste lives in it. A swats
    // menu with no Paste inside a field deletes that verb from the browser —
    // which is why a right-click inside an input falls through untouched.
    const editable = event.target?.closest?.(
      "input, textarea, select, [contenteditable], [contenteditable] *"
    );
    if (editable) return;
    const surface = event.target?.closest?.("[data-menu-id]");
    setState({
      x: event.clientX,
      y: event.clientY,
      items: buildSurfaceItems(surface),
    });
    event.preventDefault();
  }, []);

  useEffect(() => {
    window.addEventListener("contextmenu", open);
    return () => window.removeEventListener("contextmenu", open);
  }, [open]);

  useEffect(() => {
    if (!state) return undefined;
    // Capture phase on purpose: the menu must close even when the click lands
    // inside a component that calls stopPropagation on its own handler.
    const close = () => setState(null);
    const closeOnKey = (e) => {
      e.preventDefault();
      close();
    };
    window.addEventListener("click", close, true);
    window.addEventListener("keydown", closeOnKey, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("click", close, true);
      window.removeEventListener("keydown", closeOnKey, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("blur", close);
    };
  }, [state]);

  // Position before the first paint (layout effect), so the menu never
  // flashes at the unpositioned 0,0 corner: measure, clamp both axes, then
  // show.
  useLayoutEffect(() => {
    if (!state || !menuRef.current) return;
    const r = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    menuRef.current.style.left = `${Math.max(8, Math.min(state.x, vw - r.width - 8))}px`;
    menuRef.current.style.top = `${Math.max(8, Math.min(state.y, vh - r.height - 8))}px`;
    menuRef.current.style.visibility = "visible";
  }, [state]);

  if (!state || typeof document === "undefined") return null;

  return createPortal(
    <MenuCtx.Provider value={{ present: true }}>
      <div
        ref={menuRef}
        role="menu"
        data-testid="context-menu"
        onMouseDown={(e) => e.stopPropagation()}
        className="fixed z-[10000] min-w-[210px] overflow-hidden rounded-2xl border border-white/12 bg-[#0d0e14]/95 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100"
        style={{ left: state.x, top: state.y, visibility: "hidden" }}
      >
        {state.items.map((item, i) => {
          if (item.sep) {
            return <div key={i} className="mx-2 my-1 h-px bg-white/10" role="separator" />;
          }
          const Icon = item.icon ? ICON_MAP[item.icon] : null;
          return (
            <button
              key={i}
              type="button"
              role="menuitem"
              onClick={() => run(item, () => setState(null))}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-zinc-200 transition-colors hover:bg-brand-500/20 hover:text-white group cursor-pointer"
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100 text-zinc-400 group-hover:text-brand-300 transition-all" />}
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </MenuCtx.Provider>,
    document.body,
  );
}

export default ContextMenuProvider;
