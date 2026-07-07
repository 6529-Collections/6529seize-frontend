export function normalizeMemeTokenId(tokenId: unknown): number | null {
  let numericTokenId = Number.NaN;

  if (typeof tokenId === "number") {
    numericTokenId = tokenId;
  } else if (typeof tokenId === "string" && tokenId.trim() !== "") {
    numericTokenId = Number(tokenId);
  }

  return Number.isSafeInteger(numericTokenId) ? numericTokenId : null;
}

export function areMemeTokenIdsEqual(left: unknown, right: unknown): boolean {
  const leftTokenId = normalizeMemeTokenId(left);
  const rightTokenId = normalizeMemeTokenId(right);

  return leftTokenId !== null && leftTokenId === rightTokenId;
}

export function getMemeTokenIdLabel(tokenId: unknown): string {
  const normalizedTokenId = normalizeMemeTokenId(tokenId);

  return normalizedTokenId !== null
    ? normalizedTokenId.toString()
    : `${tokenId}`;
}

export function getMemeTokenIdKey(tokenId: unknown): string {
  return `meme-${getMemeTokenIdLabel(tokenId)}`;
}
