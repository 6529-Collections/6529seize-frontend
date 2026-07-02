import type { BaseNFT } from "@/entities/INFT";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";

export function toBaseNftFromApiMemesExtendedData(
  nft: ApiMemesExtendedData
): BaseNFT {
  return {
    ...nft,
    uri: nft.uri ?? "",
    image: nft.image ?? "",
    animation: nft.animation ?? "",
    compressed_animation: nft.compressed_animation ?? undefined,
    artist_seize_handle: nft.artist_seize_handle ?? "",
    mint_date: nft.mint_date ?? undefined,
    metadata: nft.metadata ?? undefined,
  };
}
