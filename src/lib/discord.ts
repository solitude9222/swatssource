export type DiscordBadgeKind =
  | "staff"
  | "partner"
  | "hypesquad"
  | "bug"
  | "early"
  | "developer"
  | "moderator"
  | "bot"
  | "bravery"
  | "brilliance"
  | "balance";

export type DiscordBadge = {
  kind: DiscordBadgeKind;
  label: string;
  flag: number;
};

/**
 * Discord public flags. These are the only badges a public user payload can
 * expose — Nitro and booster badges are intentionally not shown because they
 * are not part of `public_flags`.
 */
const BADGES: DiscordBadge[] = [
  { kind: "staff", label: "Discord Staff", flag: 1 << 0 },
  { kind: "partner", label: "Partnered Server Owner", flag: 1 << 1 },
  { kind: "hypesquad", label: "HypeSquad Events", flag: 1 << 2 },
  { kind: "bug", label: "Bug Hunter", flag: 1 << 3 },
  { kind: "bravery", label: "HypeSquad Bravery", flag: 1 << 6 },
  { kind: "brilliance", label: "HypeSquad Brilliance", flag: 1 << 7 },
  { kind: "balance", label: "HypeSquad Balance", flag: 1 << 8 },
  { kind: "early", label: "Early Supporter", flag: 1 << 9 },
  { kind: "bug", label: "Bug Hunter Gold", flag: 1 << 14 },
  { kind: "bot", label: "Verified Bot", flag: 1 << 16 },
  { kind: "developer", label: "Early Verified Bot Developer", flag: 1 << 17 },
  { kind: "moderator", label: "Certified Moderator", flag: 1 << 18 },
  { kind: "developer", label: "Active Developer", flag: 1 << 22 },
];

export function discordBadges(flags: number | null | undefined): DiscordBadge[] {
  if (!flags) return [];
  return BADGES.filter((badge) => (flags & badge.flag) === badge.flag);
}

export type DiscordPrimaryGuild = {
  identity_guild_id?: string;
  identity_enabled?: boolean;
  tag?: string;
  badge?: string;
} | null | undefined;

/** The tag shown next to a display name, e.g. `TOURN`. */
export function primaryGuildTag(guild: DiscordPrimaryGuild): string | null {
  if (!guild?.identity_enabled) return null;
  return guild.tag || null;
}

/** The guild id backing the tag, used when the card needs the raw id. */
export function primaryGuildId(guild: DiscordPrimaryGuild): string | null {
  return guild?.identity_guild_id || null;
}
