export interface NextGenCollection {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  artist: string;
  description: string;
  website: string;
  licence: string;
  base_uri: string;
  library: string;
  image: string;
  artist_address: string;
  artist_signature: string;
  max_purchases: number;
  total_supply: number;
  final_supply_after_mint: number;
  mint_count: number;
  on_chain: boolean;
  allowlist_start: number;
  allowlist_end: number;
  public_start: number;
  public_end: number;
  merkle_root: string;
}

export interface NextGenToken {
  created_at: string;
  updated_at: string;
  id: number;
  normalised_id: number;
  name: string;
  collection_id: number;
  collection_name: string;
  metadata_url: string;
  image_url: string;
  animation_url: string;
  generator_url: string;
  owner: string;
  pending: boolean;
}

export interface NextGenLog {
  created_at: string;
  id: number;
  transaction: string;
  block: number;
  block_timestamp: number;
  log: string;
  collection_id: number;
  source: string;
}

export interface NextGenTrait {
  created_at: string;
  updated_at: string;
  token_id: number;
  collection_id: number;
  trait: string;
  trait_score: number;
  value: string;
  value_score: number;
}

export interface TraitValues {
  trait: string;
  values: string[];
}
