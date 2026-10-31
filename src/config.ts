export type Settings = {
  discordUserId: string;
  discordInvite: string;
  spotifyTrack: string;
  steamUrl: string;
};

export type FeaturedTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: string;
  duration: number;
  art: string;
};

/**
 * Real metadata for the default featured track (Na Na — Trey Songz).
 * Pulled from Spotify's public track page so the card can render offline
 * without an API key; the card always links to the live track.
 */
export const FEATURED_TRACK: FeaturedTrack = {
  id: "5UccF17BZUrWZfMkcLPC64",
  title: "Na Na",
  artist: "Trey Songz",
  album: "Trigga (Deluxe)",
  year: "2014",
  duration: 232,
  art: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02b58a327e969577cac21ca9ac",
};

/**
 * Site-only example data for the home page's default widget stack. Never used
 * as the starting point for a real account: signed-in accounts begin with
 * EMPTY_SETTINGS.
 */
export const DEFAULT_SETTINGS: Settings = {
  discordUserId: "1546745348020772915",
  discordInvite: "a9uwptuepD",
  spotifyTrack: FEATURED_TRACK.id,
  steamUrl: "https://steamcommunity.com/id/aimlarps/",
};

export const EMPTY_SETTINGS: Settings = {
  discordUserId: "",
  discordInvite: "",
  spotifyTrack: "",
  steamUrl: "",
};

const STORAGE_KEY = "tourn.lol/settings/v3";

/** Account settings are isolated per user; signed-out visitors get the site example data. */
export function loadSettings(userId?: string | null): Settings {
  const fallback = userId ? EMPTY_SETTINGS : DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(userId ? `${STORAGE_KEY}/${userId}` : `${STORAGE_KEY}/site`);
    if (!raw) return { ...fallback };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      discordUserId: String(parsed.discordUserId ?? fallback.discordUserId).trim(),
      discordInvite: String(parsed.discordInvite ?? fallback.discordInvite).trim(),
      spotifyTrack: String(parsed.spotifyTrack ?? fallback.spotifyTrack).trim(),
      steamUrl: String(parsed.steamUrl ?? fallback.steamUrl).trim(),
    };
  } catch {
    return { ...fallback };
  }
}

export function saveSettings(userId: string | null, settings: Settings): void {
  try {
    localStorage.setItem(
      userId ? `${STORAGE_KEY}/${userId}` : `${STORAGE_KEY}/site`,
      JSON.stringify(settings),
    );
  } catch {
    /* storage can be unavailable in private modes; cards still work for the session */
  }
}

/** Accepts a full Discord invite URL or just the code. */
export function inviteCode(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  const match = trimmed.match(/(?:discord\.gg\/|discord\.com\/invite\/)([a-zA-Z0-9-]+)/);
  return match?.[1] ?? trimmed;
}

/** Accepts a full Spotify track URL or just the id. */
export function spotifyTrackId(input: string): string {
  const match = input.trim().match(/track\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? input.trim();
}
