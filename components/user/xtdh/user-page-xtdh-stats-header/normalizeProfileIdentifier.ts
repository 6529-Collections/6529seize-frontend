export function normalizeProfileIdentifier(value: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withoutAtSymbol = trimmed.startsWith("@")
    ? trimmed.slice(1)
    : trimmed;

  return withoutAtSymbol.toLowerCase();
}

