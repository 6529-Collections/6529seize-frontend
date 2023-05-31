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

export interface LabNFT extends BaseNFT {
  meme_references: number[];
}

export interface NFT extends BaseNFT {
  tdh: number;
  tdh__raw: number;
  tdh_rank: number;
  hodl_rate: number;
}

export interface MemesExtendedData {
  id: number;
  created_at: Date;
  season: number;
  meme: number;
  meme_name: string;
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
}

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

export interface LabExtendedData {
  id: number;
  created_at: Date;
  name: string;
  meme_references: number[];
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
  metadata_collection: string;
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
  description: string;
}
