// These are command syntax, shared across locales with the parser below.
export const SEARCH_OPERATOR_LABELS = { from: "from:", in: "in:" } as const;

export function isAdvancedSearchEnabledForUser(
  configuredUsers: string | undefined,
  handle: string | null | undefined
): boolean {
  if (!configuredUsers?.trim()) return true;
  if (!handle) return false;
  const normalizedHandle = handle.toLowerCase();
  return configuredUsers
    .split(",")
    .some((user) => user.trim().toLowerCase() === normalizedHandle);
}

export function getPendingSearchFilter(query: string) {
  const match = /(?:^|\s)(from|in):\s*(.*)$/i.exec(query);
  if (!match) return null;
  return {
    kind: match[1]!.toLowerCase() as "from" | "in",
    value: match[2]!.replace(/^[@#]/, ""),
    text: query.slice(0, match.index).trim(),
  };
}

export function unescapeSearchOperators(query: string): string {
  return query.replace(/(^|\s)\\(from|in):/gi, "$1$2:");
}
