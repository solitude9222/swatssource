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
  {
    id: "interests",
    label: "Interests",
    Icon: Gamepad2,
    color: "#EC4899",
    desc: "Showcase games, music, and anime you love — with real cover art.",
    subtypes: [
      { id: "mixed", label: "Mixed Interests", fields: ["games_title", "games_list", "games_platform", "games_now_playing"] },
      { id: "games", label: "Games Only", fields: ["games_title", "games_list", "games_platform", "games_now_playing"] },
      { id: "music", label: "Music Only", fields: ["games_title", "games_list"] },
      { id: "anime", label: "Anime Only", fields: ["games_title", "games_list"] },
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

// Interests presets — games, music artists, and anime with real cover images.
// Cover URLs use Twitch box art (600x800) and Steam library art (600x900) for games,
// Spotify/MusicBrainz-style placeholders for music, and AniList/MAL-style for anime.
// The category field lets the card group them when the widget is in "mixed" mode.

export const INTERESTS_PRESETS = [
  // ── Games ──────────────────────────────────────────────────────────────────
  { id: "valorant", name: "Valorant", category: "games", genre: "Tactical FPS", cover: "https://static-cdn.jtvnw.net/ttv-boxart/516575-600x800.jpg" },
  { id: "minecraft", name: "Minecraft", category: "games", genre: "Sandbox", cover: "https://static-cdn.jtvnw.net/ttv-boxart/27471_IGDB-600x800.jpg" },
  { id: "cs2", name: "Counter-Strike 2", category: "games", genre: "FPS", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900.jpg" },
  { id: "roblox", name: "Roblox", category: "games", genre: "Metaverse", cover: "https://static-cdn.jtvnw.net/ttv-boxart/494717-600x800.jpg" },
  { id: "elden_ring", name: "Elden Ring", category: "games", genre: "Action RPG", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg" },
  { id: "gta_v", name: "GTA V", category: "games", genre: "Open World", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg" },
  { id: "cyberpunk", name: "Cyberpunk 2077", category: "games", genre: "RPG", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg" },
  { id: "league", name: "League of Legends", category: "games", genre: "MOBA", cover: "https://static-cdn.jtvnw.net/ttv-boxart/21779-600x800.jpg" },
  { id: "fortnite", name: "Fortnite", category: "games", genre: "Battle Royale", cover: "https://static-cdn.jtvnw.net/ttv-boxart/33214-600x800.jpg" },
  { id: "apex", name: "Apex Legends", category: "games", genre: "Battle Royale", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/library_600x900.jpg" },
  { id: "rocket_league", name: "Rocket League", category: "games", genre: "Sports", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/252950/library_600x900.jpg" },
  { id: "osu", name: "osu!", category: "games", genre: "Rhythm", cover: "https://static-cdn.jtvnw.net/ttv-boxart/21465_IGDB-600x800.jpg" },
  { id: "overwatch", name: "Overwatch 2", category: "games", genre: "Hero Shooter", cover: "https://static-cdn.jtvnw.net/ttv-boxart/515025-600x800.jpg" },
  { id: "genshin", name: "Genshin Impact", category: "games", genre: "Action RPG", cover: "https://static-cdn.jtvnw.net/ttv-boxart/513181-600x800.jpg" },
  { id: "deadlock", name: "Deadlock", category: "games", genre: "MOBA Shooter", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1422450/library_600x900.jpg" },
  { id: "cod", name: "Call of Duty", category: "games", genre: "FPS", cover: "https://static-cdn.jtvnw.net/ttv-boxart/512710-600x800.jpg" },
  { id: "dota2", name: "Dota 2", category: "games", genre: "MOBA", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/570/library_600x900.jpg" },
  { id: "rust", name: "Rust", category: "games", genre: "Survival", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/252490/library_600x900.jpg" },

  // ── Music Artists ──────────────────────────────────────────────────────────
  { id: "playboi_carti", name: "Playboi Carti", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5eb62b0df3e48a89e04edce50af" },
  { id: "kanye", name: "Kanye West", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5eb6e835a500e791bf9c27f0ddf" },
  { id: "travis_scott", name: "Travis Scott", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5ebc3c218771dc4e8a4d0e86f11" },
  { id: "the_weeknd", name: "The Weeknd", category: "music", genre: "R&B", cover: "https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26e1a1" },
  { id: "drake", name: "Drake", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5eb4293385d429161f61d5e5e32" },
  { id: "kendrick", name: "Kendrick Lamar", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5eb437b9e2a82505b3d93ff1022" },
  { id: "billie", name: "Billie Eilish", category: "music", genre: "Pop", cover: "https://i.scdn.co/image/ab6761610000e5ebd8b9980db67272cb4d2c3daf" },
  { id: "lana", name: "Lana Del Rey", category: "music", genre: "Indie Pop", cover: "https://i.scdn.co/image/ab6761610000e5eb6fda1e7e3ade09fc1e2b1664" },
  { id: "tyler", name: "Tyler, The Creator", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5eb8278b782cbb5a3963db88ada" },
  { id: "sza", name: "SZA", category: "music", genre: "R&B", cover: "https://i.scdn.co/image/ab6761610000e5eb9e528993a2820267c2d4f3c4" },
  { id: "21savage", name: "21 Savage", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5eb2264d064b0e3e15be4360ffb" },
  { id: "deftones", name: "Deftones", category: "music", genre: "Alt Metal", cover: "https://i.scdn.co/image/ab6761610000e5eb2e61e67bfa1a0e85e tried6f12" },
  { id: "radiohead", name: "Radiohead", category: "music", genre: "Alt Rock", cover: "https://i.scdn.co/image/ab6761610000e5eba03696716c9ee605006047fd" },
  { id: "bladee", name: "Bladee", category: "music", genre: "Drain Gang", cover: "https://i.scdn.co/image/ab6761610000e5eb30a4ef5011de1da13e5de8fe" },
  { id: "yeat", name: "Yeat", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5ebfa8abf4ea19fc5e0a3e20625" },
  { id: "lil_uzi", name: "Lil Uzi Vert", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5ebfc28eaf7a5c2c3d2568f0bca" },

  // ── Anime ──────────────────────────────────────────────────────────────────
  { id: "naruto", name: "Naruto", category: "anime", genre: "Shōnen", cover: "https://cdn.myanimelist.net/images/anime/1141/142503l.jpg" },
  { id: "aot", name: "Attack on Titan", category: "anime", genre: "Dark Fantasy", cover: "https://cdn.myanimelist.net/images/anime/10/47347l.jpg" },
  { id: "jjk", name: "Jujutsu Kaisen", category: "anime", genre: "Shōnen", cover: "https://cdn.myanimelist.net/images/anime/1171/109222l.jpg" },
  { id: "one_piece", name: "One Piece", category: "anime", genre: "Adventure", cover: "https://cdn.myanimelist.net/images/anime/1244/138851l.jpg" },
  { id: "demon_slayer", name: "Demon Slayer", category: "anime", genre: "Action", cover: "https://cdn.myanimelist.net/images/anime/1286/99889l.jpg" },
  { id: "hxh", name: "Hunter x Hunter", category: "anime", genre: "Adventure", cover: "https://cdn.myanimelist.net/images/anime/1337/99013l.jpg" },
  { id: "death_note", name: "Death Note", category: "anime", genre: "Thriller", cover: "https://cdn.myanimelist.net/images/anime/9/9453l.jpg" },
  { id: "evangelion", name: "Neon Genesis Evangelion", category: "anime", genre: "Mecha", cover: "https://cdn.myanimelist.net/images/anime/1314/108941l.jpg" },
  { id: "code_geass", name: "Code Geass", category: "anime", genre: "Mecha", cover: "https://cdn.myanimelist.net/images/anime/5/50331l.jpg" },
  { id: "mob_psycho", name: "Mob Psycho 100", category: "anime", genre: "Action", cover: "https://cdn.myanimelist.net/images/anime/8/80356l.jpg" },
  { id: "chainsaw_man", name: "Chainsaw Man", category: "anime", genre: "Action", cover: "https://cdn.myanimelist.net/images/anime/1806/126216l.jpg" },
  { id: "spy_family", name: "Spy x Family", category: "anime", genre: "Comedy", cover: "https://cdn.myanimelist.net/images/anime/1441/122795l.jpg" },
  { id: "steins_gate", name: "Steins;Gate", category: "anime", genre: "Sci-Fi", cover: "https://cdn.myanimelist.net/images/anime/5/73199l.jpg" },
  { id: "fmab", name: "Fullmetal Alchemist: Brotherhood", category: "anime", genre: "Adventure", cover: "https://cdn.myanimelist.net/images/anime/1208/94745l.jpg" },
  { id: "solo_leveling", name: "Solo Leveling", category: "anime", genre: "Action", cover: "https://cdn.myanimelist.net/images/anime/1900/142180l.jpg" },
  { id: "tokyo_ghoul", name: "Tokyo Ghoul", category: "anime", genre: "Horror", cover: "https://cdn.myanimelist.net/images/anime/5/64449l.jpg" },

  // ── More Games ─────────────────────────────────────────────────────────────
  { id: "terraria", name: "Terraria", category: "games", genre: "Sandbox", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/105600/library_600x900.jpg" },
  { id: "palworld", name: "Palworld", category: "games", genre: "Survival", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1623730/library_600x900.jpg" },
  { id: "stardew", name: "Stardew Valley", category: "games", genre: "Farming Sim", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/library_600x900.jpg" },
  { id: "ark", name: "ARK: Survival Evolved", category: "games", genre: "Survival", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/346110/library_600x900.jpg" },
  { id: "destiny2", name: "Destiny 2", category: "games", genre: "Looter Shooter", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1085660/library_600x900.jpg" },
  { id: "gtao", name: "GTA Online", category: "games", genre: "Open World", cover: "https://static-cdn.jtvnw.net/ttv-boxart/32982_IGDB-600x800.jpg" },
  { id: "warzone", name: "Warzone", category: "games", genre: "Battle Royale", cover: "https://static-cdn.jtvnw.net/ttv-boxart/512710-600x800.jpg" },
  { id: "rainbow6", name: "Rainbow Six Siege", category: "games", genre: "Tactical FPS", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/359550/library_600x900.jpg" },
  { id: "pubg", name: "PUBG", category: "games", genre: "Battle Royale", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/578080/library_600x900.jpg" },
  { id: "dbdead", name: "Dead by Daylight", category: "games", genre: "Horror", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/381210/library_600x900.jpg" },
  { id: "hollow_knight", name: "Hollow Knight", category: "games", genre: "Metroidvania", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/library_600x900.jpg" },
  { id: "celeste", name: "Celeste", category: "games", genre: "Platformer", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/504230/library_600x900.jpg" },
  { id: "hades", name: "Hades", category: "games", genre: "Roguelike", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/library_600x900.jpg" },
  { id: "persona5", name: "Persona 5 Royal", category: "games", genre: "JRPG", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1687950/library_600x900.jpg" },
  { id: "nier", name: "NieR:Automata", category: "games", genre: "Action RPG", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/524220/library_600x900.jpg" },
  { id: "sekiro", name: "Sekiro", category: "games", genre: "Action", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/814380/library_600x900.jpg" },
  { id: "darksouls3", name: "Dark Souls III", category: "games", genre: "Souls-like", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/374320/library_600x900.jpg" },
  { id: "witcher3", name: "The Witcher 3", category: "games", genre: "Action RPG", cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg" },
  { id: "honkai_sr", name: "Honkai: Star Rail", category: "games", genre: "Turn-Based RPG", cover: "https://static-cdn.jtvnw.net/ttv-boxart/1845930594-600x800.jpg" },
  { id: "zelda_totk", name: "Zelda: TotK", category: "games", genre: "Adventure", cover: "https://static-cdn.jtvnw.net/ttv-boxart/1434170498-600x800.jpg" },

  // ── More Music ─────────────────────────────────────────────────────────────
  { id: "frank_ocean", name: "Frank Ocean", category: "music", genre: "R&B", cover: "https://i.scdn.co/image/ab6761610000e5ebee3123e593174208f9754fab" },
  { id: "jcole", name: "J. Cole", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5ebadd503b411a712e277895c8a" },
  { id: "ariana", name: "Ariana Grande", category: "music", genre: "Pop", cover: "https://i.scdn.co/image/ab6761610000e5ebcdce7620dc940db079c3f5f7" },
  { id: "bad_bunny", name: "Bad Bunny", category: "music", genre: "Reggaeton", cover: "https://i.scdn.co/image/ab6761610000e5eb81e30f3c8d4ec2b tried8" },
  { id: "doja_cat", name: "Doja Cat", category: "music", genre: "Pop Rap", cover: "https://i.scdn.co/image/ab6761610000e5ebe94f88ff74ae4ddcab961f97" },
  { id: "juice_wrld", name: "Juice WRLD", category: "music", genre: "Emo Rap", cover: "https://i.scdn.co/image/ab6761610000e5eb40b5c07ab77b6b1a9075fdc0" },
  { id: "xxxtentacion", name: "XXXTENTACION", category: "music", genre: "Emo Rap", cover: "https://i.scdn.co/image/ab6761610000e5ebf0c20db5ef6c6fbe5135d2e4" },
  { id: "post_malone", name: "Post Malone", category: "music", genre: "Pop Rap", cover: "https://i.scdn.co/image/ab6761610000e5ebb160c10b0ef tried6f12b" },
  { id: "lil_peep", name: "Lil Peep", category: "music", genre: "Emo Rap", cover: "https://i.scdn.co/image/ab6761610000e5eb212d776c31027c511f0ee3b5" },
  { id: "mac_miller", name: "Mac Miller", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5ed6001d0388a6b98d70a01fdfa" },
  { id: "arctic_monkeys", name: "Arctic Monkeys", category: "music", genre: "Indie Rock", cover: "https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f" },
  { id: "tame_impala", name: "Tame Impala", category: "music", genre: "Psychedelic", cover: "https://i.scdn.co/image/ab6761610000e5eb017c2f10c7fe6e69713eb2a0" },
  { id: "the_neighbourhood", name: "The Neighbourhood", category: "music", genre: "Alt Rock", cover: "https://i.scdn.co/image/ab6761610000e5eb9e3acf1eaf3b8846e836f441" },
  { id: "chase_atlantic", name: "Chase Atlantic", category: "music", genre: "Alt R&B", cover: "https://i.scdn.co/image/ab6761610000e5eb2bc55c1dd4fd77a0e2d243f7" },
  { id: "wstrn", name: "Destroy Lonely", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5eb17df93e2714fa05c30f9cace" },
  { id: "ken_carson", name: "Ken Carson", category: "music", genre: "Hip-Hop", cover: "https://i.scdn.co/image/ab6761610000e5ebb278cd60289e1e0b15bd0e30" },

  // ── More Anime ─────────────────────────────────────────────────────────────
  { id: "vinland_saga", name: "Vinland Saga", category: "anime", genre: "Historical", cover: "https://cdn.myanimelist.net/images/anime/1500/103005l.jpg" },
  { id: "blue_lock", name: "Blue Lock", category: "anime", genre: "Sports", cover: "https://cdn.myanimelist.net/images/anime/1258/126929l.jpg" },
  { id: "my_hero", name: "My Hero Academia", category: "anime", genre: "Shōnen", cover: "https://cdn.myanimelist.net/images/anime/10/78745l.jpg" },
  { id: "dragon_ball", name: "Dragon Ball Z", category: "anime", genre: "Shōnen", cover: "https://cdn.myanimelist.net/images/anime/1607/117271l.jpg" },
  { id: "cowboy_bebop", name: "Cowboy Bebop", category: "anime", genre: "Sci-Fi", cover: "https://cdn.myanimelist.net/images/anime/4/19644l.jpg" },
  { id: "parasyte", name: "Parasyte", category: "anime", genre: "Horror", cover: "https://cdn.myanimelist.net/images/anime/3/73178l.jpg" },
  { id: "black_clover", name: "Black Clover", category: "anime", genre: "Fantasy", cover: "https://cdn.myanimelist.net/images/anime/2/88336l.jpg" },
  { id: "mushoku", name: "Mushoku Tensei", category: "anime", genre: "Isekai", cover: "https://cdn.myanimelist.net/images/anime/1530/117776l.jpg" },
  { id: "one_punch", name: "One Punch Man", category: "anime", genre: "Action", cover: "https://cdn.myanimelist.net/images/anime/12/76049l.jpg" },
  { id: "kaguya", name: "Kaguya-sama: Love is War", category: "anime", genre: "Romance", cover: "https://cdn.myanimelist.net/images/anime/1295/106551l.jpg" },
  { id: "re_zero", name: "Re:Zero", category: "anime", genre: "Isekai", cover: "https://cdn.myanimelist.net/images/anime/1522/128039l.jpg" },
  { id: "promised_neverland", name: "The Promised Neverland", category: "anime", genre: "Thriller", cover: "https://cdn.myanimelist.net/images/anime/1830/118780l.jpg" },
  { id: "dororo", name: "Dororo", category: "anime", genre: "Action", cover: "https://cdn.myanimelist.net/images/anime/1879/100467l.jpg" },
  { id: "made_in_abyss", name: "Made in Abyss", category: "anime", genre: "Adventure", cover: "https://cdn.myanimelist.net/images/anime/6/86733l.jpg" },
  { id: "violet_evergarden", name: "Violet Evergarden", category: "anime", genre: "Drama", cover: "https://cdn.myanimelist.net/images/anime/1795/95088l.jpg" },
  { id: "bocchi", name: "Bocchi the Rock!", category: "anime", genre: "Comedy", cover: "https://cdn.myanimelist.net/images/anime/1448/127956l.jpg" },
  { id: "frieren", name: "Frieren", category: "anime", genre: "Fantasy", cover: "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" },
  { id: "oshi_no_ko", name: "Oshi no Ko", category: "anime", genre: "Drama", cover: "https://cdn.myanimelist.net/images/anime/1812/134736l.jpg" },
];

// Backward compatibility alias
export const POPULAR_GAMES_PRESETS = INTERESTS_PRESETS.filter((p) => p.category === "games");
