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
  distribution_plan: string;
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
  opensea_link: string;
}

export interface NextGenToken {
  created_at: string;
  updated_at: string;
  id: number;
  normalised_id: number;
  name: string;
  collection_id: number;
  collection_name: string;
  mint_date: Date;
  mint_price: number;
  metadata_url: string;
  image_url: string;
  icon_url?: string;
  thumbnail_url: string;
  animation_url: string;
  generator?: {
    html: string;
    metadata: string;
    image: string;
  };
  owner: string;
  pending: boolean;
  burnt: boolean;
  burnt_date?: string;
  hodl_rate: number;
  mint_data: string;
  rarity_score: number;
  rarity_score_rank: number;
  rarity_score_normalised: number;
  rarity_score_normalised_rank: number;
  rarity_score_trait_count: number;
  rarity_score_trait_count_rank: number;
  rarity_score_trait_count_normalised: number;
  rarity_score_trait_count_normalised_rank: number;
  statistical_score: number;
  statistical_score_rank: number;
  statistical_score_normalised: number;
  statistical_score_normalised_rank: number;
  statistical_score_trait_count: number;
  statistical_score_trait_count_rank: number;
  statistical_score_trait_count_normalised: number;
  statistical_score_trait_count_normalised_rank: number;
  single_trait_rarity_score: number;
  single_trait_rarity_score_rank: number;
  single_trait_rarity_score_normalised: number;
  single_trait_rarity_score_normalised_rank: number;
  single_trait_rarity_score_trait_count: number;
  single_trait_rarity_score_trait_count_rank: number;
  single_trait_rarity_score_trait_count_normalised: number;
  single_trait_rarity_score_trait_count_normalised_rank: number;
  price: number;
  opensea_price: number;
  opensea_royalty: number;
  blur_price: number;
  me_price: number;
  me_royalty: number;
  last_sale_value: number;
  last_sale_date: Date;
  max_sale_value: number;
  max_sale_date: Date;
  normalised_handle: string;
  handle: string;
  level: number;
  tdh: number;
  rep_score: number;
}

export interface NextGenLog {
  created_at: string;
  id: number;
  transaction: string;
  block: number;
  block_timestamp: number;
  heading: string;
  log: string;
  collection_id: number;
  source: string;
  from_address: string;
  to_address: string;
  from_display: string;
  to_display: string;
  value: number;
  royalties: number;
  gas_gwei: number;
  gas_price: number;
  gas: number;
  gas_price_gwei: number;
}

export interface NextGenTrait {
  created_at: string;
  updated_at: string;
  token_id: number;
  collection_id: number;
  trait: string;
  value: string;
  rarity_score: number;
  rarity_score_rank: number;
  rarity_score_normalised: number;
  rarity_score_normalised_rank: number;
  rarity_score_trait_count_normalised: number;
  rarity_score_trait_count_normalised_rank: number;
  statistical_rarity: number;
  statistical_rarity_rank: number;
  statistical_rarity_normalised: number;
  statistical_rarity_normalised_rank: number;
  single_trait_rarity_score_normalised: number;
  single_trait_rarity_score_normalised_rank: number;
  token_count: number;
  trait_count: number;
  value_count: number;
}

export interface TraitValues {
  trait: string;
  values: string[];
  value_counts: {
    key: string;
    count: number;
  }[];
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
  mint_price: number;
  collection_name: string;
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

export interface NextgenTraitSet {
  owner: string;
  normalised_handle: string;
  handle: string;
  level: number;
  tdh: number;
  consolidation_display: string;
  rep_score: number;
  distinct_values_count: number;
  token_ids: number[];
  token_values: {
    value: string;
    tokens: number[];
  }[];
}
