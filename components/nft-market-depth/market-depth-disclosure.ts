const EVENT = "6529:show-market-depth";
const assetKey = (contract: string, tokenId: string | number) =>
  `${contract.toLowerCase()}:${String(tokenId)}`;

/** Local navigation only. No order lookup, wallet request or trade side effect. */
export function revealMarketDepth(
  contract: string,
  tokenId: string | number
): void {
  globalThis.dispatchEvent(
    new CustomEvent(EVENT, { detail: assetKey(contract, tokenId) })
  );
}

export function subscribeMarketDepthDisclosure(
  contract: string,
  tokenId: string | number,
  onReveal: () => void
): () => void {
  const expected = assetKey(contract, tokenId);
  const listener = (event: Event) => {
    if (event instanceof CustomEvent && event.detail === expected) onReveal();
  };
  globalThis.addEventListener(EVENT, listener);
  return () => globalThis.removeEventListener(EVENT, listener);
}
