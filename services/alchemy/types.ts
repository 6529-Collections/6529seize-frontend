import type {
  Suggestion,
  SupportedChain,
  TokenMetadata,
} from "@/types/nft";

export type SearchContractsParams = {
  query: string;
  chain?: SupportedChain;
  pageKey?: string;
  hideSpam?: boolean;
  signal?: AbortSignal;
};

export type SearchContractsResult = {
  items: Suggestion[];
  hiddenCount: number;
  nextPageKey?: string;
};

export type ContractOverviewParams = {
  address: `0x${string}`;
  chain?: SupportedChain;
  signal?: AbortSignal;
};

export type TokenMetadataParams = {
  address: `0x${string}`;
  tokenIds: readonly string[];
  chain?: SupportedChain;
  signal?: AbortSignal;
};

export type AlchemyContractMetadata = {
  address?: string | null;
  name?: string | null;
  symbol?: string | null;
  tokenType?: string | null;
  totalSupply?: string | null;
  image?: { cachedUrl?: string | null; thumbnailUrl?: string | null } | null;
  bannerImageUrl?: string | null;
  description?: string | null;
  contractDeployer?: string | null;
  openSeaMetadata?: AlchemyOpenSeaMetadata;
  openseaMetadata?: AlchemyOpenSeaMetadata;
  openSea?: AlchemyOpenSeaMetadata;
  opensea?: AlchemyOpenSeaMetadata;
  isSpam?: boolean;
  spamInfo?: { isSpam?: boolean };
};

export type AlchemyOpenSeaMetadata = {
  imageUrl?: string | null;
  bannerImageUrl?: string | null;
  collectionName?: string | null;
  safelistRequestStatus?: string | null;
  floorPrice?: number | { eth?: number | string | null } | null;
  description?: string | null;
};

export type AlchemyContractResult = {
  address?: string;
  contractAddress?: string;
  contractDeployer?: string | null;
  isSpam?: boolean;
  spamInfo?: { isSpam?: boolean };
  spamClassifications?: string[] | null;
  contractMetadata?: AlchemyContractMetadata;
  openSeaMetadata?: AlchemyOpenSeaMetadata;
  openseaMetadata?: AlchemyOpenSeaMetadata;
} & AlchemyContractMetadata;

export type AlchemySearchResponse = {
  contracts?: AlchemyContractResult[];
  pageKey?: string;
};

export type AlchemyContractMetadataResponse = {
  contractMetadata?: AlchemyContractMetadata;
  openSeaMetadata?: AlchemyOpenSeaMetadata;
  openseaMetadata?: AlchemyOpenSeaMetadata;
  address?: string;
  contractAddress?: string;
  isSpam?: boolean;
};

export type AlchemyTokenMetadataEntry = {
  tokenId?: string;
  tokenType?: string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  image?: {
    cachedUrl?: string | null;
    thumbnailUrl?: string | null;
    originalUrl?: string | null;
  } | null;
  media?: {
    gateway?: string | null;
    thumbnailUrl?: string | null;
    raw?: string | null;
  }[] | null;
  metadata?: { image?: string | null; name?: string | null } | null;
  raw?: { metadata?: { image?: string | null; name?: string | null } } | null;
  isSpam?: boolean;
  spamInfo?: { isSpam?: boolean } | null;
};

export type AlchemyTokenMetadataResponse = {
  tokens?: AlchemyTokenMetadataEntry[];
  nfts?: AlchemyTokenMetadataEntry[];
};
