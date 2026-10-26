import { Clock, CalendarDays, Code2, Hourglass, LayoutGrid, BarChart3, CloudSun, Box, Gamepad2, FolderGit2 } from "lucide-react";
import { FaDiscord, FaSpotify, FaGithub, FaYoutube, FaSteam, FaSoundcloud, FaTwitch, FaLastfm } from "react-icons/fa6";
import { SiRoblox, SiValorant, SiSupercell } from "react-icons/si";

// ---------------------------------------------------------------------------
// Widget catalog
//
// A widget stores ONLY an identifier (a username, an ID, a link) plus display
// options. Every number, name, avatar and status shown on the profile comes
// from a live API call — see backend/routes/widgets.js. There is deliberately
// no field anywhere in here for a member count, a rank or a follower number,
// because a widget can never be filled in by hand.
// ---------------------------------------------------------------------------

export const WIDGET_KINDS = [
  {
    id: "discord",
    label: "Discord",
    Icon: FaDiscord,
    color: "#5865F2",
    desc: "Display your Discord bot or server information with member count and status.",
    subtypes: [
      { id: "server", label: "Server", fields: ["discord_invite", "discord_server"] },
      { id: "profile", label: "Profile", fields: ["discord_user"] },
      { id: "bot", label: "Bot", fields: ["discord_user"] },
    ],
  },
  {
    id: "github",
    label: "GitHub",
    Icon: FaGithub,
    color: "#e7e7e7",
    desc: "Showcase your GitHub profile with follower count, repositories, and top starred projects.",
    subtypes: [
      { id: "user", label: "Profile", fields: ["github_user"] },
      { id: "repo", label: "Repository", fields: ["github_repo"] },
    ],
  },
  {
    id: "roblox",
    label: "Roblox",
    Icon: SiRoblox,
    color: "#E2231A",
    desc: "Display your Roblox profile with followers, friends, and online status.",
    subtypes: [
      { id: "profile", label: "Profile", fields: ["roblox_user"] },
      { id: "group", label: "Group / Community", fields: ["roblox_group"] },
      { id: "game", label: "Game", fields: ["roblox_game"] },
    ],
  },
  {
    id: "lastfm",
    label: "Last.fm",
    Icon: FaLastfm,
    color: "#D51007",
    desc: "Show your Last.fm listening history with total scrobbles, top artists, and most played track.",
    subtypes: [{ id: "profile", label: "Profile", fields: ["lastfm_user"] }],
  },
  {
    id: "statsfm",
    label: "Stats.fm",
    Icon: BarChart3,
    color: "#1DB954",
    desc: "Display your Stats.fm profile with streaming statistics, recent tracks, and listening insights.",
    subtypes: [{ id: "profile", label: "Profile", fields: ["statsfm_user"] }],
  },
  {
    id: "valorant",
    label: "Valorant",
    Icon: SiValorant,
    color: "#FF4655",
    desc: "Show your Valorant rank, competitive stats, and account level.",
    subtypes: [{ id: "player", label: "Player", fields: ["valorant_user"] }],
  },
  {
    id: "timezone",
    label: "Timezone",
    Icon: Clock,
    color: "#EF4444",
    desc: "Show a live analog clock for your selected time zone.",
    subtypes: [{ id: "clock", label: "Clock", fields: ["timezone"] }],
  },
  {
    id: "steam",
    label: "Steam",
    Icon: FaSteam,
    color: "#66C0F4",
    desc: "Display your Steam profile with game library, playtime, friends count, and recent games.",
    subtypes: [{ id: "profile", label: "Profile", fields: ["steam_user"] }],
  },
  {
    id: "twitch",
    label: "Twitch",
    Icon: FaTwitch,
    color: "#9146FF",
    desc: "Show your Twitch channel with follower count, live status, and viewer count when streaming.",
    subtypes: [{ id: "channel", label: "Channel", fields: ["twitch_channel"] }],
  },
  {
    id: "spotify",
    label: "Spotify",
    Icon: FaSpotify,
    color: "#1DB954",
    desc: "Display Spotify content: user profiles, tracks, albums, artists, or playlists.",
    subtypes: [{ id: "media", label: "Track / Album / Playlist", fields: ["spotify_url"] }],
  },
  {
    id: "minecraft",
    label: "Minecraft Server",
    Icon: Box,
    color: "#22C55E",
    desc: "Display your Minecraft server with online player count and MOTD.",
    subtypes: [{ id: "server", label: "Server", fields: ["minecraft_server"] }],
  },
  {
    id: "clash-of-clans",
    label: "Clash of Clans",
    Icon: SiSupercell,
    color: "#EAB308",
    desc: "Show your Clash of Clans player stats with town hall level, trophies, and clan information.",
    subtypes: [{ id: "player", label: "Player", fields: ["coc_player"] }],
  },
  {
    id: "clash-royale",
    label: "Clash Royale",
    Icon: SiSupercell,
    color: "#06B6D4",
    desc: "Display your Clash Royale player stats with arena, trophies, and card levels.",
    subtypes: [{ id: "player", label: "Player", fields: ["cr_player"] }],
  },
  {
    id: "brawl-stars",
    label: "Brawl Stars",
    Icon: SiSupercell,
    color: "#F59E0B",
    desc: "Show your Brawl Stars profile with trophies, brawlers unlocked, and club information.",
    subtypes: [{ id: "player", label: "Player", fields: ["bs_player"] }],
  },
  {
    id: "weather",
    label: "Weather",
    Icon: CloudSun,
    color: "#38BDF8",
    desc: "Display current weather conditions and temperature for your location.",
    subtypes: [{ id: "location", label: "Location", fields: ["weather_city"] }],
  },
  // Supported and legacy widgets
  {
    id: "youtube",
    label: "YouTube",
    Icon: FaYoutube,
    color: "#FF0000",
    desc: "Channel avatar, subscriber count and newest upload",
    subtypes: [{ id: "channel", label: "Channel", fields: ["youtube_channel"] }],
  },
  {
    id: "soundcloud",
    label: "SoundCloud",
    Icon: FaSoundcloud,
    color: "#ff5500",
    desc: "Track artwork, title and artist from any track link",
    subtypes: [{ id: "media", label: "Track", fields: ["soundcloud_url"] }],
  },
  {
    id: "countdown",
    label: "Countdown",
    Icon: Hourglass,
    color: "#b4bffa",
    desc: "Counts down in real time to a date you pick",
    subtypes: [{ id: "timer", label: "Countdown", fields: ["countdown"] }],
  },
  {
    id: "account-date",
    label: "Account Date",
    Icon: CalendarDays,
    color: "#b4bffa",
    desc: "When you joined tourn.lol — read from your account",
    subtypes: [{ id: "joined", label: "Joined date", fields: [] }],
  },
  {
    id: "custom",
    label: "Custom Code",
    Icon: Code2,
    color: "#b4bffa",
    premium: true,
    desc: "Your own HTML, CSS or iframe embed",
    subtypes: [{ id: "code", label: "HTML / CSS / Embed", fields: ["custom_code"] }],
  },
  {
    id: "games",
    label: "Favorite Games",
    Icon: Gamepad2,
    color: "#EC4899",
    desc: "Showcase your top video games, active game status, and platform.",
    subtypes: [
      { id: "favorites", label: "Favorite Games", fields: ["games_title", "games_list", "games_platform", "games_now_playing"] },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    Icon: FolderGit2,
    color: "#6366F1",
    desc: "Showcase code, web, game, or design projects with type selector and code tags.",
    subtypes: [
      { id: "code", label: "Code Project", fields: ["project_title", "project_desc", "project_tags", "project_url"] },
      { id: "game", label: "Game Project", fields: ["project_title", "project_desc", "project_tags", "project_url"] },
      { id: "web", label: "Web App", fields: ["project_title", "project_desc", "project_tags", "project_url"] },
      { id: "design", label: "Design & Art", fields: ["project_title", "project_desc", "project_tags", "project_url"] },
    ],
  },
];

// Input descriptors, keyed by field id. `pick` names the widget property the
// value is saved under so the editor never needs per-field save logic.
export const WIDGET_FIELDS = {
  roblox_user: {
    key: "username",
    label: "Roblox username or profile link",
    placeholder: "e.g. builderman or https://www.roblox.com/users/156/profile",
    help: "The card shows their avatar, display name, about text, join date and friend count.",
  },
  roblox_group: {
    key: "group_id",
    label: "Group ID or group link",
    placeholder: "https://www.roblox.com/groups/33665685",
    help: "Group icon, name, description and live member count.",
  },
  roblox_game: {
    key: "game_url",
    label: "Game link or place ID",
    placeholder: "https://www.roblox.com/games/920587237",
    help: "Game icon, people playing right now, visits and favourites.",
  },
  discord_server: {
    key: "server_id",
    label: "Server ID (optional)",
    placeholder: "e.g. 613712999795015681",
    help: "Developer Mode → right-click the server → Copy Server ID. The icon and name come straight from Discord.",
  },
  discord_invite: {
    key: "invite_url",
    label: "Server Invite",
    placeholder: "discord.gg/ivera or ivera",
    help: "The invite unlocks the server banner and the exact total member count — Discord only returns those for an invite.",
  },
  discord_user: {
    key: "user_id",
    label: "Discord user ID",
    placeholder: "e.g. 94490510688792576",
    help: "Your live Discord status, custom status, activity and Spotify. Join discord.gg/lanyard with this account to go live.",
  },
  spotify_url: {
    key: "url",
    label: "Spotify Link",
    placeholder: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    help: "Title, artwork and author are read straight from the link — tracks, albums, or playlists.",
  },
  soundcloud_url: {
    key: "url",
    label: "SoundCloud Link",
    placeholder: "https://soundcloud.com/artist/track",
    help: "Track artwork, title and artist are read straight from any SoundCloud track link.",
  },

  media_url: {
    key: "url",
    label: "Media Link",
    placeholder: "https://open.spotify.com/track/... or https://soundcloud.com/...",
    help: "Title, artwork and author are read straight from the link — nothing is typed in twice.",
  },
  youtube_channel: {
    key: "channel",
    label: "Channel link or @handle",
    placeholder: "https://www.youtube.com/@tournlol or @tournlol",
    help: "Channel avatar, name, subscriber count and newest upload.",
  },
  github_user: {
    key: "username",
    label: "GitHub username",
    placeholder: "e.g. torvalds",
    help: "Avatar, bio, repo count, followers, total stars and top language.",
  },
  github_repo: {
    key: "repo",
    label: "Repository",
    placeholder: "facebook/react or https://github.com/owner/repo",
    help: "Stars, forks, language, licence and description.",
  },
  steam_user: {
    key: "username",
    label: "Steam profile link or custom URL",
    placeholder: "https://steamcommunity.com/id/customurl or SteamID64",
    help: "Persona, avatar, online state and current game.",
  },
  twitch_channel: {
    key: "channel",
    label: "Twitch channel name or URL",
    placeholder: "e.g. shroud or https://twitch.tv/shroud",
    help: "Live status, follower count and current stream title.",
  },
  lastfm_user: {
    key: "username",
    label: "Last.fm username",
    placeholder: "e.g. musical_fan",
    help: "Recent scrobbles, top artist and total listening count.",
  },
  statsfm_user: {
    key: "username",
    label: "Stats.fm username",
    placeholder: "e.g. stats_lover",
    help: "Streaming statistics, minutes listened and top songs.",
  },
  minecraft_server: {
    key: "value",
    label: "Minecraft server IP",
    placeholder: "mc.hypixel.net",
    help: "Real-time online player count, MOTD and ping.",
  },
  coc_player: {
    key: "value",
    label: "Clash of Clans player tag",
    placeholder: "#9PPP02V2",
    help: "Town hall level, trophies and clan information.",
  },
  cr_player: {
    key: "value",
    label: "Clash Royale player tag",
    placeholder: "#8L9L9GL",
    help: "Arena, trophies, favorite card and win rate.",
  },
  bs_player: {
    key: "value",
    label: "Brawl Stars player tag",
    placeholder: "#2P0LY9Y9",
    help: "Trophy count, brawlers unlocked and club name.",
  },
  weather_city: {
    key: "value",
    label: "City name or location",
    placeholder: "e.g. London, Tokyo, New York",
    help: "Live weather forecast, temperature and conditions.",
  },
  valorant_user: {
    key: "riot_id",
    label: "Riot ID (Name#TAG)",
    placeholder: "e.g. TenZ#0001",
    help: "Rank, RR, wins and peak. Requires a Riot API key on the server (developer.riotgames.com).",
  },
  timezone: {
    key: "value",
    label: "Timezone",
    placeholder: "e.g. Europe/London",
    help: "Any IANA timezone. The clock ticks with the visitor's real time.",
  },
  countdown: {
    key: "date",
    label: "Target date & time",
    type: "datetime-local",
    help: "Counts down live for every visitor until the moment arrives.",
  },
  custom_code: {
    key: "code",
    label: "HTML / CSS / iframe",
    type: "textarea",
    placeholder: "<iframe src=\"...\" />",
    help: "Rendered exactly as written. Premium feature.",
  },
  games_title: {
    key: "title",
    label: "Widget Title",
    placeholder: "Favorite Games",
    help: "Header displayed on your gaming card.",
  },
  games_list: {
    key: "games_list",
    label: "Favorite Games",
    placeholder: "Elden Ring, Valorant, Minecraft, GTA V, Cyberpunk 2077",
    help: "List your favorite games (comma-separated or lines).",
    type: "textarea",
  },
  games_platform: {
    key: "platform",
    label: "Gaming Platform",
    placeholder: "e.g. PC / Steam / PlayStation 5",
    help: "Your primary gaming system.",
  },
  games_now_playing: {
    key: "now_playing",
    label: "Currently Playing",
    placeholder: "e.g. Grinding Elden Ring DLC",
    help: "Status text shown with an active green beacon.",
  },
  project_title: {
    key: "title",
    label: "Project Name",
    placeholder: "e.g. tourn.lol, Portfolio Engine, Aether Game",
    help: "The main name of your project.",
  },
  project_desc: {
    key: "description",
    label: "Project Description",
    placeholder: "A next-generation biolink platform and creator profile hub with rich widgets.",
    help: "Short description of what the project is.",
    type: "textarea",
  },
  project_tags: {
    key: "tags",
    label: "Code / Tech Tags",
    placeholder: "React, TypeScript, Rust, Tailwind, Node.js",
    help: "Comma-separated tags shown as stylized code badges.",
  },
  project_url: {
    key: "url",
    label: "Project URL / Repo Link",
    placeholder: "https://github.com/...",
    help: "Direct link to GitHub repo, website, or playable game.",
  },
};

export const KIND_MAP = Object.fromEntries(WIDGET_KINDS.map((k) => [k.id, k]));

// Display options offered for every widget.
export const WIDGET_SPANS = [
  { id: 1, label: "Half width" },
  { id: 2, label: "Full width" },
];

/* The two widget card styles.

   The editor used to offer six controls for this — background opacity, outline
   transparency, four outline widths and four corner presets — and in practice
   they produced the same two cards: a soft translucent one and a flat opaque
   one. Nothing was removed from the data model: each preset still writes real
   `card_fill_alpha` / `card_outline_alpha` / `card_border_width` / `card_radius`
   values, so a widget saved before this keeps rendering and can be switched
   between the two looks without touching a slider. */
export const WIDGET_CARD_STYLES = [
  {
    id: "glass",
    label: "Glass",
    desc: "Translucent surface, hairline edge, soft corners",
    values: { card_fill_alpha: 72, card_outline_alpha: 10, card_border_width: 1, card_radius: 18 },
  },
  {
    id: "solid",
    label: "Solid",
    desc: "Flat opaque surface with a crisper, tighter edge",
    values: { card_fill_alpha: 100, card_outline_alpha: 20, card_border_width: 1, card_radius: 14 },
  },
];

export const WIDGET_CARD_STYLE_MAP = Object.fromEntries(WIDGET_CARD_STYLES.map((s) => [s.id, s]));

// Which of the two a saved widget is showing. Read from the fill alpha, which is
// the value the two presets differ on most, so a widget saved under the old
// six-control UI still resolves to one of them.
export const widgetCardStyleId = (w = {}) => {
  const fill = Number(w?.card_fill_alpha ?? WIDGET_SURFACE_DEFAULTS.fillAlpha);
  return Number.isFinite(fill) && fill >= 92 ? "solid" : "glass";
};

// The four corner presets and four outline widths that used to live here are
// gone with the six-control surface panel they fed (see WIDGET_CARD_STYLES
// above). `card_radius` and `card_border_width` are still real saved fields, so
// a widget saved under those controls keeps rendering exactly as it did.

// ---------------------------------------------------------------------------
// Link display styles
// ---------------------------------------------------------------------------

export const LINK_MODES = [
  { id: "card", label: "Card" },
  { id: "icon", label: "Icon only" },
];

export const LINK_CARD_STYLES = [
  { id: "", label: "Match theme" },
  { id: "new", label: "Card Pro" },
  { id: "solid", label: "Solid" },
  { id: "gradient", label: "Gradient" },
  { id: "frosted", label: "Frosted" },
  { id: "outline", label: "Outline" },
  { id: "glass", label: "Glass" },
  { id: "aurora", label: "Aurora" },
  { id: "neon", label: "Neon" },
  { id: "minimal", label: "Minimal" },
];

// How a link's optional description behaves. "Reveal on hover" keeps a card
// tidy; "Folded" hides it until the card is focused.
export const LINK_FOLDS = [
  { id: "", label: "Always visible" },
  { id: "hover", label: "Reveal on hover" },
  { id: "folded", label: "Folded" },
];

// Discord widget layouts. Classic is the full card, Minimal is a single row,
// and Banner puts the server banner across the top with the stats beneath it.
export const DISCORD_STYLES = [
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
  { id: "banner", label: "Banner" },
];

// Per-widget card surface options. Every value is a real, saved setting so the
// outline the owner dislikes can be dialled down to nothing.
export const WIDGET_SURFACE_DEFAULTS = {
  fillAlpha: 90,
  outlineAlpha: 8,
  borderWidth: 1,
  radius: 18,
  glowAmount: 22,
};

export const LINK_ICON_STYLES = [
  { id: "bare", label: "No plate" },
  { id: "rounded", label: "Rounded" },
  { id: "square", label: "Square" },
  { id: "circle", label: "Circle" },
];

// The link "badge overlay" picker (None / Verified / Star / Boost / Hot /
// Favorite / Premium / New / Live) used to live here. It was removed: the marks
// duplicated the badge system the profile already has, sat on top of the icon
// the owner had just chosen, and made every link card read as a sticker sheet.
// A link is now just its icon, its label and its description.

export const GENERIC_WIDGET_ICON = LayoutGrid;

export const PRESET_CODE_LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Rust", "Go", "C++", "C#", "React",
  "Next.js", "HTML/CSS", "Tailwind", "Node.js", "Swift", "Kotlin", "Java", "PHP", "Docker", "Solidity"
];

export const PRESET_LINK_TYPES = [
  { id: "github", label: "GitHub Repo" },
  { id: "demo", label: "Live Demo" },
  { id: "docs", label: "Documentation" },
  { id: "npm", label: "NPM Package" },
  { id: "discord", label: "Community" },
];

export const POPULAR_GAMES_PRESETS = [
  {
    id: "valorant",
    name: "Valorant",
    genre: "Tactical FPS",
    platform: "PC",
    cover: "https://static-cdn.jtvnw.net/ttv-boxart/516575-600x800.jpg",
  },
  {
    id: "minecraft",
    name: "Minecraft",
    genre: "Sandbox Survival",
    platform: "PC / Console",
    cover: "https://static-cdn.jtvnw.net/ttv-boxart/27471_IGDB-600x800.jpg",
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    genre: "Competitive FPS",
    platform: "PC / Steam",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900.jpg",
  },
  {
    id: "roblox",
    name: "Roblox",
    genre: "Metaverse",
    platform: "Cross-Platform",
    cover: "https://static-cdn.jtvnw.net/ttv-boxart/494717-600x800.jpg",
  },
  {
    id: "elden_ring",
    name: "Elden Ring",
    genre: "Action RPG",
    platform: "PC / Console",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg",
  },
  {
    id: "gta_v",
    name: "GTA V",
    genre: "Open World",
    platform: "PC / Console",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk 2077",
    genre: "Sci-Fi RPG",
    platform: "PC / Console",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg",
  },
  {
    id: "league",
    name: "League of Legends",
    genre: "MOBA",
    platform: "PC",
    cover: "https://static-cdn.jtvnw.net/ttv-boxart/21779-600x800.jpg",
  },
  {
    id: "fortnite",
    name: "Fortnite",
    genre: "Battle Royale",
    platform: "Cross-Platform",
    cover: "https://static-cdn.jtvnw.net/ttv-boxart/33214-600x800.jpg",
  },
  {
    id: "apex",
    name: "Apex Legends",
    genre: "Battle Royale",
    platform: "PC / Console",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/library_600x900.jpg",
  },
  {
    id: "rocket_league",
    name: "Rocket League",
    genre: "Sports Action",
    platform: "Cross-Platform",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/252950/library_600x900.jpg",
  },
  {
    id: "osu",
    name: "osu!",
    genre: "Rhythm",
    platform: "PC",
    cover: "https://static-cdn.jtvnw.net/ttv-boxart/21465_IGDB-600x800.jpg",
  },
];
