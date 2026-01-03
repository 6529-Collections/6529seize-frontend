export type SupportedChain = "ethereum";

export type Suggestion = {
  address: `0x${string}`;
  name?: string | undefined;
  symbol?: string | undefined;
  tokenType?: "ERC721" | "ERC1155" | undefined;
  totalSupply?: string | undefined;
  floorPriceEth?: number | null | undefined;
  imageUrl?: string | null | undefined;
  isSpam?: boolean | undefined;
  safelist?: "verified" | "approved" | "requested" | "not_requested" | undefined;
  deployer?: `0x${string}` | null | undefined;
};

export type ContractOverview = Suggestion & {
  description?: string | null | undefined;
  bannerImageUrl?: string | null | undefined;
};

export type TokenMetadata = {
  tokenId: bigint;
  tokenIdRaw: string;
  contract?: string | undefined;
  name: string | null;
  imageUrl: string | null;
  collectionName: string | null;
  isSpam: boolean;
};
