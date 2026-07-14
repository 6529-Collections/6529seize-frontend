export const RESERVED_MENTION_ALIASES = new Set([
  "all",
  "everyone",
  "admin",
  "admins",
  "administrator",
  "administrators",
  "mod",
  "mods",
  "moderator",
  "moderators",
  "contributor",
  "contributors",
  "team",
  "dev",
  "devs",
  "developer",
  "developers",
  "6529devs",
  "devs6529",
]);

export const normalizeMentionAlias = (value: string) =>
  value.trim().replace(/^@/, "").toLowerCase();

export const isReservedMentionAlias = (value: string) =>
  RESERVED_MENTION_ALIASES.has(normalizeMentionAlias(value));
