export interface NFT {
  id: number;
  contract: string;
  created_at: Date;
  mint_date: Date;
  mint_price: number;
  supply: number;
  name: string;
  collection: string;
  token_type: string;
  hodl_rate: number;
  description: string;
  artist: string;
  uri: string;
  thumbnail: string;
  scaled: string;
  image: string;
  compressed_animation: string;
  animation: string;
  metadata: any;
  tdh: number;
  tdh__raw: number;
  tdh_rank: number;
  market_cap: number;
  floor_price: number;
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
