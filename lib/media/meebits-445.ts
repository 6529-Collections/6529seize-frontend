// The published artwork is immutable. Keep this viewer repair tied to that
// exact source; canonical metadata and original-file links remain unchanged.
export const MEEBITS_445_VIEWER_PATH = "/artwork/the-memes/445.html";
export const MEEBITS_445_ORIGINAL_URL =
  "https://b7ioi7l22jfskyrheecv5wjv4shpz5x7ts4kjng63jngoo3jceuq.arweave.net/D9DkfXrSSyViJyEFXtk15I789v-cuKS03tpaZztpESk";

export function isMeebits445ViewerRepair(
  nft: { readonly contract?: string; readonly id: number },
  source: string | undefined
): boolean {
  return (
    nft.contract?.toLowerCase() ===
      "0x33fd426905f149f8376e227d0c9d3340aad17af1" &&
    nft.id === 445 &&
    source === MEEBITS_445_ORIGINAL_URL
  );
}
