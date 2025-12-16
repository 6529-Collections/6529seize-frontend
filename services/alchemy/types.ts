import type { Suggestion, SupportedChain } from "@/types/nft";

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
  address?: `0x${string}`;
  tokenIds?: readonly string[];
  tokens?: readonly { contract: string; tokenId: string }[];
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
  deployedBlockNumber?: number | null;
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

export type AlchemyContractMetadataResponse = AlchemyContractMetadata & {
  contractMetadata?: AlchemyContractMetadata | null;
  openSeaMetadata?: AlchemyOpenSeaMetadata | null;
  openseaMetadata?: AlchemyOpenSeaMetadata | null;
  address?: string | null;
  contractAddress?: string | null;
  isSpam?: boolean;
};

export type AlchemyNftMedia = {
  cachedUrl?: string | null;
  thumbnailUrl?: string | null;
  originalUrl?: string | null;
  pngUrl?: string | null;
  gateway?: string | null;
  raw?: string | null;
  contentType?: string | null;
  size?: number | null;
};

export type AlchemyNftMetadata = {
  image?: string | null;
  name?: string | null;
  description?: string | null;
  [key: string]: unknown;
};

export type AlchemyNftCollection = {
  name?: string | null;
  slug?: string | null;
  externalUrl?: string | null;
  bannerImageUrl?: string | null;
};

export type AlchemyNftMint = {
  mintAddress?: string | null;
  blockNumber?: string | null;
  timestamp?: string | null;
  transactionHash?: string | null;
};

export type AlchemyOwnedNftAcquiredAt = {
  blockTimestamp?: string | null;
  blockNumber?: string | null;
};

export type AlchemyTokenMetadataEntry = {
  contract?:
    | (AlchemyContractMetadata & { spamClassifications?: string[] | null })
    | null;
  tokenId?: string;
  tokenType?: string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  tokenUri?: string | null;
  image?: AlchemyNftMedia | null;
  animation?: AlchemyNftMedia | null;
  media?: AlchemyNftMedia[] | null;
  metadata?: AlchemyNftMetadata | null;
  raw?: {
    tokenUri?: string | null;
    metadata?: AlchemyNftMetadata | null;
    error?: string | null;
  } | null;
  collection?: AlchemyNftCollection | null;
  mint?: AlchemyNftMint | null;
  owners?: string[] | null;
  timeLastUpdated?: string | null;
  balance?: string | null;
  acquiredAt?: AlchemyOwnedNftAcquiredAt | null;
  isSpam?: boolean;
  spamInfo?: { isSpam?: boolean } | null;
};

export type AlchemyTokenMetadataResponse = {
  tokens?: AlchemyTokenMetadataEntry[];
  nfts?: AlchemyTokenMetadataEntry[];
};

export type AlchemyOwnedNft = AlchemyTokenMetadataEntry & {
  balance?: string | null;
};

export type OwnerNft = {
  tokenId: string;
  tokenType: string | null;
  name: string | null;
  tokenUri: string | null;
  image: AlchemyNftMedia | null;
};

export type AlchemyGetNftsForOwnerResponse = {
  ownedNfts: AlchemyOwnedNft[];
  pageKey?: string;
  totalCount?: number;
  validAt?: {
    blockNumber?: number | null;
    blockHash?: string | null;
    blockTimestamp?: string | null;
  };
  error?: {
    code?: number;
    message?: string;
  };
};
