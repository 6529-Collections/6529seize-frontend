import { ApiGroupNftOwnershipMatchMode } from "@/generated/models/ApiGroupNftOwnershipMatchMode";
import type { ApiGroupOwnsNft } from "@/generated/models/ApiGroupOwnsNft";

export const DEFAULT_GROUP_NFT_OWNERSHIP_MATCH_MODE =
  ApiGroupNftOwnershipMatchMode.AllTokens;

export const getGroupNftOwnershipMatchMode = (
  nft: Pick<ApiGroupOwnsNft, "match_mode"> | null | undefined
): ApiGroupNftOwnershipMatchMode =>
  nft?.match_mode ?? DEFAULT_GROUP_NFT_OWNERSHIP_MATCH_MODE;

export const withDefaultGroupNftOwnershipMatchMode = (
  nft: ApiGroupOwnsNft
): ApiGroupOwnsNft => ({
  ...nft,
  match_mode: getGroupNftOwnershipMatchMode(nft),
});

export const normalizeGroupNftOwnerships = (
  nfts: ApiGroupOwnsNft[]
): ApiGroupOwnsNft[] => nfts.map(withDefaultGroupNftOwnershipMatchMode);
