import type { Suggestion, SupportedChain } from "@/types/nft";

export type SearchContractsParams = {
  query: string;
  chain?: SupportedChain | undefined;
  pageKey?: string | undefined;
  hideSpam?: boolean | undefined;
  signal?: AbortSignal | undefined;
};

export type SearchContractsResult = {
  items: Suggestion[];
  hiddenCount: number;
  nextPageKey?: string | undefined;
};

export type ContractOverviewParams = {
  address: `0x${string}`;
  chain?: SupportedChain | undefined;
  signal?: AbortSignal | undefined;
};

export type TokenMetadataParams = {
  address?: `0x${string}` | undefined;
  tokenIds?: readonly string[] | undefined;
  tokens?: readonly { contract: string; tokenId: string }[] | undefined;
  chain?: SupportedChain | undefined;
  signal?: AbortSignal | undefined;
};

export type AlchemyContractMetadata = {
  address?: string | null | undefined;
  name?: string | null | undefined;
  symbol?: string | null | undefined;
  tokenType?: string | null | undefined;
  totalSupply?: string | null | undefined;
  image?: { cachedUrl?: string | null | undefined; thumbnailUrl?: string | null | undefined } | null | undefined;
  bannerImageUrl?: string | null | undefined;
  description?: string | null | undefined;
  contractDeployer?: string | null | undefined;
  deployedBlockNumber?: number | null | undefined;
  openSeaMetadata?: AlchemyOpenSeaMetadata | undefined;
  openseaMetadata?: AlchemyOpenSeaMetadata | undefined;
  openSea?: AlchemyOpenSeaMetadata | undefined;
  opensea?: AlchemyOpenSeaMetadata | undefined;
  isSpam?: boolean | undefined;
  spamInfo?: { isSpam?: boolean | undefined } | undefined;
};

export type AlchemyOpenSeaMetadata = {
  imageUrl?: string | null | undefined;
  bannerImageUrl?: string | null | undefined;
  collectionName?: string | null | undefined;
  safelistRequestStatus?: string | null | undefined;
  floorPrice?: number | { eth?: number | string | null | undefined } | null | undefined;
  description?: string | null | undefined;
};

export type AlchemyContractResult = {
  address?: string | undefined;
  contractAddress?: string | undefined;
  contractDeployer?: string | null | undefined;
  isSpam?: boolean | undefined;
  spamInfo?: { isSpam?: boolean | undefined } | undefined;
  spamClassifications?: string[] | null | undefined;
  contractMetadata?: AlchemyContractMetadata | undefined;
  openSeaMetadata?: AlchemyOpenSeaMetadata | undefined;
  openseaMetadata?: AlchemyOpenSeaMetadata | undefined;
} & AlchemyContractMetadata;

export type AlchemySearchResponse = {
  contracts?: AlchemyContractResult[] | undefined;
  pageKey?: string | undefined;
};

export type AlchemyContractMetadataResponse = AlchemyContractMetadata & {
  contractMetadata?: AlchemyContractMetadata | null | undefined;
  openSeaMetadata?: AlchemyOpenSeaMetadata | null | undefined;
  openseaMetadata?: AlchemyOpenSeaMetadata | null | undefined;
  address?: string | null | undefined;
  contractAddress?: string | null | undefined;
  isSpam?: boolean | undefined;
};

export type AlchemyNftMedia = {
  cachedUrl?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
  originalUrl?: string | null | undefined;
  pngUrl?: string | null | undefined;
  gateway?: string | null | undefined;
  raw?: string | null | undefined;
  contentType?: string | null | undefined;
  size?: number | null | undefined;
};

export type AlchemyNftMetadata = {
  image?: string | null | undefined;
  name?: string | null | undefined;
  description?: string | null | undefined;
  [key: string]: unknown;
};

export type AlchemyNftCollection = {
  name?: string | null | undefined;
  slug?: string | null | undefined;
  externalUrl?: string | null | undefined;
  bannerImageUrl?: string | null | undefined;
};

export type AlchemyNftMint = {
  mintAddress?: string | null | undefined;
  blockNumber?: string | null | undefined;
  timestamp?: string | null | undefined;
  transactionHash?: string | null | undefined;
};

export type AlchemyOwnedNftAcquiredAt = {
  blockTimestamp?: string | null | undefined;
  blockNumber?: string | null | undefined;
};

export type AlchemyTokenMetadataEntry = {
  contract?:
    | (AlchemyContractMetadata & { spamClassifications?: string[] | null | undefined })
    | null | undefined;
  tokenId?: string | undefined;
  tokenType?: string | null | undefined;
  title?: string | null | undefined;
  name?: string | null | undefined;
  description?: string | null | undefined;
  tokenUri?: string | null | undefined;
  image?: AlchemyNftMedia | null | undefined;
  animation?: AlchemyNftMedia | null | undefined;
  media?: AlchemyNftMedia[] | null | undefined;
  metadata?: AlchemyNftMetadata | null | undefined;
  raw?: {
    tokenUri?: string | null | undefined;
    metadata?: AlchemyNftMetadata | null | undefined;
    error?: string | null | undefined;
  } | null | undefined;
  collection?: AlchemyNftCollection | null | undefined;
  mint?: AlchemyNftMint | null | undefined;
  owners?: string[] | null | undefined;
  timeLastUpdated?: string | null | undefined;
  balance?: string | null | undefined;
  acquiredAt?: AlchemyOwnedNftAcquiredAt | null | undefined;
  isSpam?: boolean | undefined;
  spamInfo?: { isSpam?: boolean | undefined } | null | undefined;
};

export type AlchemyTokenMetadataResponse = {
  tokens?: AlchemyTokenMetadataEntry[] | undefined;
  nfts?: AlchemyTokenMetadataEntry[] | undefined;
};

export type AlchemyOwnedNft = AlchemyTokenMetadataEntry & {
  balance?: string | null | undefined;
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
  pageKey?: string | undefined;
  totalCount?: number | undefined;
  validAt?: {
    blockNumber?: number | null | undefined;
    blockHash?: string | null | undefined;
    blockTimestamp?: string | null | undefined;
  } | undefined;
  error?: {
    code?: number | undefined;
    message?: string | undefined;
  } | undefined;
};
