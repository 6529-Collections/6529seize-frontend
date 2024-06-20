declare enum OpenSeaSafelistRequestStatus {
  /** Verified collection. */
  VERIFIED = "verified",
  /** Collections that are approved on open sea and can be found in search results. */
  APPROVED = "approved",
  /** Collections that requested safelisting on OpenSea. */
  REQUESTED = "requested",
  /** Brand new collections. */
  NOT_REQUESTED = "not_requested",
}

declare enum NftTokenType {
  ERC721 = "ERC721",
  ERC1155 = "ERC1155",
  NO_SUPPORTED_NFT_STANDARD = "NO_SUPPORTED_NFT_STANDARD",
  NOT_A_CONTRACT = "NOT_A_CONTRACT",
  UNKNOWN = "UNKNOWN",
}

export interface OpenSeaCollectionMetadata {
  /** The floor price of the collection. */
  floorPrice?: number;
  /** The name of the collection on OpenSea. */
  collectionName?: string;
  /** The slug of the collection on OpenSea. */
  collectionSlug?: string;
  /** The approval status of the collection on OpenSea. */
  safelistRequestStatus?: OpenSeaSafelistRequestStatus;
  /** The image URL determined by OpenSea. */
  imageUrl?: string;
  /**
   * The banner image URL determined by OpenSea.
   * @deprecated Use {@link bannerImageUrl} instead.
   */
  imageBannerUrl?: string;
  /** The banner image URL determined by OpenSea. */
  bannerImageUrl?: string;
  /** The description of the collection on OpenSea. */
  description?: string;
  /** The homepage of the collection as determined by OpenSea. */
  externalUrl?: string;
  /** The Twitter handle of the collection. */
  twitterUsername?: string;
  /** The Discord URL of the collection. */
  discordUrl?: string;
  /** Timestamp of when the OpenSea metadata was last ingested by Alchemy. */
  lastIngestedAt: string;
}

export interface NftContract {
  /** The address of the NFT contract. */
  address: string;
  /** The type of the token in the contract. */
  tokenType: NftTokenType;
  /** The name of the contract. */
  name?: string;
  /** The symbol of the contract. */
  symbol?: string;
  /**
   * The number of NFTs in the contract as an integer string. This field is only
   * available on ERC-721 contracts.
   */
  totalSupply?: string;
  /** OpenSea's metadata for the contract. */
  openSeaMetadata: OpenSeaCollectionMetadata;
  /** The address that deployed the NFT contract. */
  contractDeployer?: string;
  /** The block number the NFT contract deployed in. */
  deployedBlockNumber?: number;
}

declare enum NftSpamClassification {
  Erc721TooManyOwners = "Erc721TooManyOwners",
  Erc721TooManyTokens = "Erc721TooManyTokens",
  Erc721DishonestTotalSupply = "Erc721DishonestTotalSupply",
  MostlyHoneyPotOwners = "MostlyHoneyPotOwners",
  OwnedByMostHoneyPots = "OwnedByMostHoneyPots",
  LowDistinctOwnersPercent = "LowDistinctOwnersPercent",
  HighHoneyPotOwnerPercent = "HighHoneyPotOwnerPercent",
  HighHoneyPotPercent = "HighHoneyPotPercent",
  HoneyPotsOwnMultipleTokens = "HoneyPotsOwnMultipleTokens",
  NoSalesActivity = "NoSalesActivity",
  HighAirdropPercent = "HighAirdropPercent",
  Unknown = "Unknown",
}

interface NftContractForNft extends NftContract {
  /** Whether the NFT contract is marked as spam. */
  isSpam?: boolean;
  /** Potential reasons why an NFT Contract was classified as spam. */
  spamClassifications: NftSpamClassification[];
}

interface NftImage {
  /** URL of the image stored in Alchemy's cache. */
  cachedUrl?: string;
  /** URL of a thumbnail sized image. */
  thumbnailUrl?: string;
  /** URL of the image in png format */
  pngUrl?: string;
  /** The type of the media image. */
  contentType?: string;
  /** The size of the media asset in bytes. */
  size?: number;
  /** The original URL of the image as stored on the contract. */
  originalUrl?: string;
}

interface NftRawMetadata {
  /** The raw token URI on the NFT contract. */
  tokenUri?: string;
  /** The raw metadata parsed from the raw token URI. */
  metadata: Record<string, any>;
  /** Error message if the raw metadata could not be fetched. */
  error?: string;
}

interface AcquiredAt {
  /** Timestamp of the block at which an NFT was last acquired. */
  blockTimestamp?: string;
  /** Block number of the block at which an NFT was last acquired. */
  blockNumber?: number;
}

interface BaseNftCollection {
  /** The name of the collection. */
  name: string;
  /** The OpenSea human-readable slug of the collection. */
  slug?: string;
  /** The external URL for the collection. */
  externalUrl?: string;
  /** The banner image URL for the collection. */
  bannerImageUrl?: string;
}

interface NftMint {
  /** The address that the NFT was minted to. */
  mintAddress?: string;
  /** The block number that the NFT was minted on. */
  blockNumber?: number;
  /** The timestamp the NFT was minted on. */
  timestamp?: string;
  /** The transaction hash of the transaction that minted the NFT. */
  transactionHash?: string;
}

export interface Nft {
  /** The NFT's underlying contract and relevant contract metadata. */
  contract: NftContractForNft;
  /** The NFT token ID as an integer string. */
  tokenId: string;
  /** The type of NFT.*/
  tokenType: NftTokenType;
  /** The NFT name. */
  name?: string;
  /** The NFT description. */
  description?: string;
  /** Media URLs and information for the NFT */
  image: NftImage;
  /** The raw metadata for the NFT based on the metadata URI on the NFT contract. */
  raw: NftRawMetadata;
  /** URIs for accessing the NFT's metadata blob. */
  tokenUri?: string;
  /** When the NFT was last updated in the blockchain. Represented in ISO-8601 format. */
  timeLastUpdated: string;
  /**
   * Time at which the NFT was most recently acquired by the user. Only
   * available when specifying `orderBy: NftOrdering.TRANSFERTIME` in the
   * request.
   */
  acquiredAt?: AcquiredAt;
  /** Collection metadata for the NFT, if available. */
  collection?: BaseNftCollection;
  /** Mint information for the NFT. */
  mint?: NftMint;
}
