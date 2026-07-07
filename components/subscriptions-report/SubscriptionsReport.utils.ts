export function normalizeMemeTokenId(tokenId: unknown): number | null {
  const numericTokenId =
    typeof tokenId === "number"
      ? tokenId
      : typeof tokenId === "string" && tokenId.trim() !== ""
        ? Number(tokenId)
        : Number.NaN;

  return Number.isSafeInteger(numericTokenId) ? numericTokenId : null;
}

export function areMemeTokenIdsEqual(left: unknown, right: unknown): boolean {
  const leftTokenId = normalizeMemeTokenId(left);
  const rightTokenId = normalizeMemeTokenId(right);

  return leftTokenId !== null && leftTokenId === rightTokenId;
}
