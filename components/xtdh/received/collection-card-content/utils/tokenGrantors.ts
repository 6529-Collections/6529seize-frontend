import type { XtdhReceivedNft } from "@/types/xtdh";

export function getXtdhReceivedTokenGrantorCount(nft: XtdhReceivedNft): number {
  if (typeof nft.grantorCount === "number") {
    return nft.grantorCount;
  }

  return nft.granters.length;
}
