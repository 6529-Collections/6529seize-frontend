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

interface OpenSeaCollectionMetadata {
  /** The floor price of the collection. */
  floorPrice?: number | undefined;
  /** The name of the collection on OpenSea. */
  collectionName?: string | undefined;
  /** The slug of the collection on OpenSea. */
  collectionSlug?: string | undefined;
  /** The approval status of the collection on OpenSea. */
  safelistRequestStatus?: OpenSeaSafelistRequestStatus | undefined;
  /** The image URL determined by OpenSea. */
  imageUrl?: string | undefined;
  /**
   * The banner image URL determined by OpenSea.
   * @deprecated Use {@link bannerImageUrl} instead.
   */
  imageBannerUrl?: string | undefined;
  /** The banner image URL determined by OpenSea. */
  bannerImageUrl?: string | undefined;
  /** The description of the collection on OpenSea. */
  description?: string | undefined;
  /** The homepage of the collection as determined by OpenSea. */
  externalUrl?: string | undefined;
  /** The Twitter handle of the collection. */
  twitterUsername?: string | undefined;
  /** The Discord URL of the collection. */
  discordUrl?: string | undefined;
  /** Timestamp of when the OpenSea metadata was last ingested by Alchemy. */
  lastIngestedAt: string;
}

export interface NftContract {
  /** The address of the NFT contract. */
  address: string;
  /** The type of the token in the contract. */
  tokenType: NftTokenType;
  /** The name of the contract. */
  name?: string | undefined;
  /** The symbol of the contract. */
  symbol?: string | undefined;
  /**
   * The number of NFTs in the contract as an integer string. This field is only
   * available on ERC-721 contracts.
   */
  totalSupply?: string | undefined;
  /** OpenSea's metadata for the contract. */
  openSeaMetadata: OpenSeaCollectionMetadata;
  /** The address that deployed the NFT contract. */
  contractDeployer?: string | undefined;
  /** The block number the NFT contract deployed in. */
  deployedBlockNumber?: number | undefined;
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
  isSpam?: boolean | undefined;
  /** Potential reasons why an NFT Contract was classified as spam. */
  spamClassifications: NftSpamClassification[];
}

interface NftImage {
  /** URL of the image stored in Alchemy's cache. */
  cachedUrl?: string | undefined;
  /** URL of a thumbnail sized image. */
  thumbnailUrl?: string | undefined;
  /** URL of the image in png format */
  pngUrl?: string | undefined;
  /** The type of the media image. */
  contentType?: string | undefined;
  /** The size of the media asset in bytes. */
  size?: number | undefined;
  /** The original URL of the image as stored on the contract. */
  originalUrl?: string | undefined;
}

interface NftRawMetadata {
  /** The raw token URI on the NFT contract. */
  tokenUri?: string | undefined;
  /** The raw metadata parsed from the raw token URI. */
  metadata: Record<string, any>;
  /** Error message if the raw metadata could not be fetched. */
  error?: string | undefined;
}

interface AcquiredAt {
  /** Timestamp of the block at which an NFT was last acquired. */
  blockTimestamp?: string | undefined;
  /** Block number of the block at which an NFT was last acquired. */
  blockNumber?: number | undefined;
}

interface BaseNftCollection {
  /** The name of the collection. */
  name: string;
  /** The OpenSea human-readable slug of the collection. */
  slug?: string | undefined;
  /** The external URL for the collection. */
  externalUrl?: string | undefined;
  /** The banner image URL for the collection. */
  bannerImageUrl?: string | undefined;
}

interface NftMint {
  /** The address that the NFT was minted to. */
  mintAddress?: string | undefined;
  /** The block number that the NFT was minted on. */
  blockNumber?: number | undefined;
  /** The timestamp the NFT was minted on. */
  timestamp?: string | undefined;
  /** The transaction hash of the transaction that minted the NFT. */
  transactionHash?: string | undefined;
}

export interface Nft {
  /** The NFT's underlying contract and relevant contract metadata. */
  contract: NftContractForNft;
  /** The NFT token ID as an integer string. */
  tokenId: string;
  /** The type of NFT.*/
  tokenType: NftTokenType;
  /** The NFT name. */
  name?: string | undefined;
  /** The NFT description. */
  description?: string | undefined;
  /** Media URLs and information for the NFT */
  image: NftImage;
  /** The raw metadata for the NFT based on the metadata URI on the NFT contract. */
  raw: NftRawMetadata;
  /** URIs for accessing the NFT's metadata blob. */
  tokenUri?: string | undefined;
  /** When the NFT was last updated in the blockchain. Represented in ISO-8601 format. */
  timeLastUpdated: string;
  /**
   * Time at which the NFT was most recently acquired by the user. Only
   * available when specifying `orderBy: NftOrdering.TRANSFERTIME` in the
   * request.
   */
  acquiredAt?: AcquiredAt | undefined;
  /** Collection metadata for the NFT, if available. */
  collection?: BaseNftCollection | undefined;
  /** Mint information for the NFT. */
  mint?: NftMint | undefined;
}
