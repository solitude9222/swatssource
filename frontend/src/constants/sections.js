// ---------------------------------------------------------------------------
// Profile Sections
//
// Sections are full-page scroll-snap slides that sit below the profile card.
// Each section type has its own renderer and content source. The profile card
// is always the first "section" — users add more from the dashboard.
//
// Section data lives in `profile.sections` as an ordered array. Each entry
// carries its type, content items, and per-section display settings.
// ---------------------------------------------------------------------------

import { Gamepad2, Music, Film, FolderGit2, Image, Layers } from "lucide-react";

// Available section types users can add
export const SECTION_TYPES = [
  {
    id: "games",
    label: "Games",
    icon: Gamepad2,
    color: "#EC4899",
    desc: "Showcase your favorite games with cover art and ratings",
    searchApi: "/search/games",
  },
  {
    id: "music",
    label: "Music",
    icon: Music,
    color: "#1DB954",
    desc: "Display artists, albums, and tracks you love",
    searchApi: "/search/music",
  },
  {
    id: "anime",
    label: "Anime",
    icon: Film,
    color: "#6366F1",
    desc: "Show your top anime with ratings and genres",
    searchApi: "/search/anime",
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderGit2,
    color: "#F59E0B",
    desc: "Showcase code repos, apps, and creative work",
    searchApi: null, // manual entry only
  },
  {
    id: "gallery",
    label: "Gallery",
    icon: Image,
    color: "#8B5CF6",
    desc: "Photo and art showcase with grid layout",
    searchApi: null, // upload only
  },
];

export const SECTION_TYPE_MAP = Object.fromEntries(SECTION_TYPES.map((t) => [t.id, t]));

// Layout modes for each section
export const SECTION_LAYOUTS = [
  { id: "normal", label: "Normal", desc: "Fills the viewport height" },
  { id: "compact", label: "Compact", desc: "Follows its content height" },
  { id: "snap", label: "Snap", desc: "Moves one full page at a time" },
];

// Navigator styles
export const NAVIGATOR_STYLES = [
  { id: "dots", label: "Dots" },
  { id: "lines", label: "Lines" },
  { id: "numbers", label: "Numbers" },
  { id: "hidden", label: "Hidden" },
];

// Scroll-for-more indicator icons
export const INDICATOR_ICONS = [
  { id: "arrow-down", label: "Arrow down" },
  { id: "chevron-down", label: "Chevron down" },
  { id: "mouse", label: "Mouse scroll" },
  { id: "none", label: "None" },
];

// Default section settings (matches the screenshot reference)
export const DEFAULT_SECTION_SETTINGS = {
  layout: "normal",
  scroll_animations: true,
  animation_duration: 400,
  space_above: 48,
  space_below: 48,
  title_color: "#FFFFFF",
  desc_color: "#D1D5DB",
  navigator_style: "lines",
  show_scroll_indicator: true,
  indicator_text: "Scroll for more",
  indicator_icon: "arrow-down",
  indicator_color: "#FFFFFF",
  auto_advance: false,
  auto_advance_interval: 5000,
};

// Create a blank section of a given type
export const blankSection = (type) => ({
  id: `section_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  type,
  title: SECTION_TYPE_MAP[type]?.label || type,
  description: "",
  items: [],
  enabled: true,
  settings: { ...DEFAULT_SECTION_SETTINGS },
});

// An item inside a section (game, anime, music artist, project, image)
// Each item has: name, cover (image URL), subtitle, rating (0-10), url
export const blankSectionItem = (type) => ({
  id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: "",
  cover: "",
  subtitle: "",
  rating: null,
  url: "",
  // Type-specific fields
  ...(type === "games" ? { genre: "", platform: "" } : {}),
  ...(type === "music" ? { artist: "", album: "" } : {}),
  ...(type === "anime" ? { genre: "", episodes: null, status: "" } : {}),
  ...(type === "projects" ? { tags: "", repo: "", demo: "" } : {}),
  ...(type === "gallery" ? { caption: "" } : {}),
});
