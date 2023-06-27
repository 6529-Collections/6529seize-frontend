export interface Info1 {
  name: string;
  artist: string;
  description: string;
  website: string;
  licence: string;
  base_uri: string;
}

export interface Info2 {
  library: string;
  script: string[];
}

export interface AdditionalData1 {
  artist_address: string;
  mint_cost: number;
  max_purchases: number;
  circulation_supply: number;
  total_supply: number;
}

export interface AdditionalData2 {
  sales_percentage: number;
  is_collection_active: boolean;
  merkle_root: string;
}

export interface ProofResponse {
  keccak: string;
  spots: number;
  proof: string[];
}

export interface TokenIndexes {
  start: number;
  end: number;
}

export interface TokenURI {
  id: number;
  uri: string;
  is_data: boolean;
  data?: string;
}
