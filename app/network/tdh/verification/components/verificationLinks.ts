/** Public explorers the dashboard links to, so a reader can check a value. */

export function etherscanBlockUrl(block: number): string {
  return `https://etherscan.io/block/${block}`;
}

/** The file itself, as Arweave serves it. */
export function arweaveFileUrl(id: string): string {
  return `https://arweave.net/${id}`;
}

/** The transaction on an Arweave explorer: its signer, size and data root. */
export function arweaveTransactionUrl(id: string): string {
  return `https://viewblock.io/arweave/tx/${id}`;
}
