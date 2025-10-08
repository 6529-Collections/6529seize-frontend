function sanitizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("@")) {
    return trimmed.slice(1);
  }
  return trimmed;
}

export function deriveProfileIdentifier(profile: any | null): string | null {
  if (!profile) return null;

  const candidates: Array<string | null> = [
    sanitizeString(profile.handle),
    sanitizeString(profile.query),
    sanitizeString(profile.primary_wallet),
    sanitizeString(profile.consolidation_key),
  ];

  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }

  return null;
}
