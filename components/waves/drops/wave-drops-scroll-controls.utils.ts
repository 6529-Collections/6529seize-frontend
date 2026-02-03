export function formatCountLabel(
  count: number | null | undefined
): number | string | null {
  if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) {
    return null;
  }

  return count > 99 ? "99+" : count;
}
