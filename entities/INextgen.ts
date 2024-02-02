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
  dependency_script: string;
  image: string;
  banner: string;
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
  generator?: {
    html: string;
    metadata: string;
    image: string;
  };
  owner: string;
  pending: boolean;
  mint_date: Date;
  burnt: boolean;
  burnt_date?: string;
  rarity_score: number;
  rarity_score_normalised: number;
  statistical_score: number;
  rarity_score_rank: number;
  rarity_score_normalised_rank: number;
  statistical_score_rank: number;
  hodl_rate: number;
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
  value: string;
  rarity: number;
  rarity_score: number;
  rarity_score_normalised: number;
  token_count: number;
  trait_count: number;
}

export interface TraitValues {
  trait: string;
  values: string[];
}

export interface TraitValuePair {
  trait: string;
  value: string;
}

export enum NextgenAllowlistCollectionType {
  ALLOWLIST = "allowlist",
  EXTERNAL_BURN = "external_burn",
}

export interface NextgenAllowlistCollection {
  created_at: string;
  merkle_root: string;
  collection_id: number;
  added_by: string;
  al_type: NextgenAllowlistCollectionType;
  phase: string;
  start_time: number;
  end_time: number;
}

export interface NextgenAllowlist {
  created_at: string;
  collection_id: number;
  merkle_root: string;
  address: string;
  spots: number;
  info: string;
  keccak: string;
  wallet_display?: string;
  phase?: string;
}
