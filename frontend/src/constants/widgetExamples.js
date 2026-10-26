/**
 * Widget Examples Configuration
 *
 * All available widget example configurations in one place.
 * You can edit the values below (usernames, channel links, URLs, titles)
 * to customize how example widgets appear in the dashboard preview
 * until users configure their own widgets.
 *
 * NO fake profiles, NO fake mockData, NO fake numbers.
 * The widgets query live API endpoints using the URLs/handles defined here.
 */

export const WIDGET_EXAMPLES = {
  discord: {
    type: "discord",
    subtype: "profile",
    title: "Discord",
    user_id: "",
  },

  spotify: {
    type: "spotify",
    subtype: "track",
    title: "Spotify Player",
    track: "She's Everything",
    artist: "Brad Paisley",
    url: "https://open.spotify.com/track/4PkQuSF1CzodLjv2FxqP6e?si=8a9b752f4ae74586",
  },

  soundcloud: {
    type: "soundcloud",
    subtype: "profile",
    title: "SoundCloud",
    username: "bondages",
    url: "https://soundcloud.com/bondages",
  },

  github: {
    type: "github",
    subtype: "user",
    title: "GitHub",
    username: "",
  },

  steam: {
    type: "steam",
    subtype: "profile",
    title: "Steam",
    username: "",
  },

  roblox: {
    type: "roblox",
    subtype: "profile",
    title: "Roblox",
    username: "",
  },

  valorant: {
    type: "valorant",
    subtype: "player",
    title: "Valorant",
    riot_id: "",
  },

  youtube: {
    type: "youtube",
    subtype: "channel",
    title: "YouTube",
    channel: "",
  },

  twitch: {
    type: "twitch",
    subtype: "channel",
    title: "Twitch",
    channel: "",
  },

  timezone: {
    type: "timezone",
    subtype: "clock",
    title: "Local Time",
    timezone: "America/New_York",
    value: "America/New_York",
  },

  countdown: {
    type: "countdown",
    subtype: "timer",
    title: "New Year Countdown",
    date: "2027-01-01T00:00:00.000Z",
  },

  account_date: {
    type: "account-date",
    subtype: "joined",
    title: "Member Since",
  },

  projects: {
    type: "projects",
    subtype: "code",
    title: "Stack & Projects",
    tags: "TypeScript, React, Rust, Go, Next.js, Postgres",
    url: "https://github.com",
  },

  games: {
    type: "games",
    subtype: "favorites",
    title: "Top Video Games",
    games_list: "Cyberpunk 2077, Elden Ring, Valorant, CS2",
    now_playing: "Cyberpunk 2077",
  },

  custom: {
    type: "custom",
    subtype: "code",
    title: "Custom Embed",
    code: "<div style='color:#b4bffa;font-family:monospace;padding:8px;font-size:11px'>console.log('tourn.lol');</div>",
  },
};

/** List of active default example widgets for previewing when none are configured */
export const DEFAULT_PREVIEW_WIDGETS = [
  WIDGET_EXAMPLES.spotify,
  WIDGET_EXAMPLES.soundcloud,
  WIDGET_EXAMPLES.timezone,
  WIDGET_EXAMPLES.countdown,
  WIDGET_EXAMPLES.games,
  WIDGET_EXAMPLES.projects,
];
