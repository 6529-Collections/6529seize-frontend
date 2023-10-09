export interface Info {
  name: string;
  artist: string;
  description: string;
  website: string;
  licence: string;
  base_uri: string;
}

export interface TokenIndexes {
  start: number;
  end: number;
}

export interface LibraryScript {
  library: string;
  script: string[];
}

export interface AdditionalData {
  artist_address: string;
  mint_cost: number;
  max_purchases: number;
  circulation_supply: number;
  total_supply: number;
  sales_percentage: number;
  is_collection_active: boolean;
}

export interface PhaseTimes {
  allowlist_start_time: number;
  allowlist_end_time: number;
  merkle_root: string;
  public_start_time: number;
  public_end_time: number;
}

export interface TokensPerAddress {
  airdrop: number;
  allowlist: number;
  public: number;
  total: number;
}

export interface ProofResponse {
  keccak: string;
  spots: number;
  info: any;
  proof: string[];
}

export interface TokenURI {
  id: number;
  collection: number;
  uri: string;
  data?: any;
  name: string;
  description: string;
}
