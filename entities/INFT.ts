export interface BaseNFT {
  id: number;
  contract: string;
  created_at: Date;
  mint_date: Date;
  mint_price: number;
  supply: number;
  name: string;
  collection: string;
  token_type: string;
  description: string;
  artist: string;
  artist_seize_handle: string;
  uri: string;
  icon: string;
  thumbnail: string;
  scaled: string;
  image: string;
  compressed_animation?: string;
  animation: string;
  metadata?: any;
  market_cap: number;
  floor_price: number;
  total_volume_last_24_hours: number;
  total_volume_last_7_days: number;
  total_volume_last_1_month: number;
  total_volume: number;
  has_distribution?: boolean;
}

export interface NFTLite {
  id: number;
  contract: string;
  name: string;
  icon: string;
  thumbnail: string;
  scaled: string;
  image: string;
  animation: string;
}

export interface LabNFT extends BaseNFT {
  meme_references: number[];
}

export interface NFT extends BaseNFT {
  boosted_tdh: number;
  tdh: number;
  tdh__raw: number;
  tdh_rank: number;
  hodl_rate: number;
}

export interface ExtendedDataBase {
  id: number;
  created_at: Date;
  collection_size: number;
  edition_size: number;
  edition_size_rank: number;
  museum_holdings: number;
  museum_holdings_rank: number;
  edition_size_cleaned: number;
  edition_size_cleaned_rank: number;
  hodlers: number;
  hodlers_rank: number;
  percent_unique: number;
  percent_unique_rank: number;
  percent_unique_cleaned: number;
  percent_unique_cleaned_rank: number;
  burnt: number;
  edition_size_not_burnt: number;
  edition_size_not_burnt_rank: number;
  percent_unique_not_burnt: number;
  percent_unique_not_burnt_rank: number;
}

export interface MemesExtendedData extends ExtendedDataBase {
  season: number;
  meme: number;
  meme_name: string;
}

export type NFTWithMemesExtendedData = NFT & MemesExtendedData;

export interface NftRank {
  id: number;
  tdh_rank: number;
  contract: string;
  tdh: number;
  tdh__raw: number;
  rank: number;
}

export interface NftTDH {
  id: number;
  balance: number;
  tdh: number;
  tdh__raw: number;
}

export interface LabExtendedData extends ExtendedDataBase {
  meme_references: number[];
  metadata_collection: string;
  name: string;
  website: string;
}

export enum VolumeType {
  HOURS_24 = "24 Hours",
  DAYS_7 = "7 Days",
  DAYS_30 = "30 Days",
  ALL_TIME = "All Time",
}

export interface NFTHistory {
  nft_id: number;
  contract: string;
  uri: string;
  created_at: Date;
  transaction_date: Date;
  transaction_hash: string;
  block: number;
  description: {
    event: string;
    changes: {
      key: string;
      from: string;
      to: string;
    }[];
  };
}

export interface Rememe {
  created_at: Date;
  updated_at: Date;
  contract: string;
  id: string;
  deployer: string;
  token_uri: string;
  token_type: string;
  image: string;
  animation: string;
  meme_references: number[];
  metadata: any;
  contract_opensea_data: {
    imageUrl: string;
    discordUrl: string;
    externalUrl: string;
    collectionName: string;
    twitterUsername: string;
  };
  media: {
    raw: string;
    bytes: number;
    format: string;
    gateway: string;
    thumbnail: string;
  }[];
  s3_image_original: string;
  s3_image_scaled: string;
  s3_image_thumbnail: string;
  s3_image_icon: string;
  replicas: number[];
  source: string;
  added_by: string;
}

export interface IAttribute {
  trait_type: string;
  value: string;
  display_type?: string;
  max_value?: number;
  trait_count?: number;
  order?: number;
}
