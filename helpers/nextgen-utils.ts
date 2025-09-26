export function formatNameForUrl(name: string) {
  return name.replaceAll(" ", "-").toLowerCase();
}

export function normalizeNextgenTokenID(tokenId: number) {
  const collectionId = Math.round(tokenId / 10000000000);
  const normalisedTokenId = tokenId - collectionId * 10000000000;
  return {
    collection_id: collectionId,
    token_id: normalisedTokenId,
  };
}
