export type SupportedChain = "ethereum";

export type Suggestion = {
  address: `0x${string}`;
  name?: string;
  symbol?: string;
  tokenType?: "ERC721" | "ERC1155";
  totalSupply?: string;
  floorPriceEth?: number | null;
  imageUrl?: string | null;
  isSpam?: boolean;
  safelist?: "verified" | "approved" | "requested" | "not_requested";
  deployer?: `0x${string}` | null;
};

export type ContractOverview = Suggestion & {
  description?: string | null;
  bannerImageUrl?: string | null;
};

export type TokenMetadata = {
  tokenId: bigint;
  tokenIdRaw: string;
  contract?: string;
  name: string | null;
  imageUrl: string | null;
  collectionName: string | null;
  isSpam: boolean;
};
