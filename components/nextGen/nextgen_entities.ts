export interface Info {
  name: string;
  artist: string;
  description: string;
  website: string;
  licence: string;
  base_uri: string;
}

export interface LibraryScript {
  library: string;
  dependency_script: string;
  script: string[];
}

export interface AdditionalData {
  artist_address: string;
  max_purchases: number;
  circulation_supply: number;
  total_supply: number;
  final_supply_after_mint: number;
  randomizer: string;
}

export interface MintingDetails {
  mint_cost: number;
  end_mint_cost: number;
  rate: number;
  time_period: number;
  sales_option: number;
  del_address: string;
}

export interface PhaseTimes {
  allowlist_start_time: number;
  allowlist_end_time: number;
  merkle_root: string;
  public_start_time: number;
  public_end_time: number;
  al_status: Status;
  public_status: Status;
}

export interface TokensPerAddress {
  airdrop: number;
  allowlist: number;
  public: number;
  total: number;
}

export enum AllowlistType {
  ALLOWLIST = "allowlist",
  EXTERNAL_BURN = "external_burn",
}

export interface CollectionWithMerkle {
  collection_id: number;
  merkle_root: string;
  merkle_tree: any;
  al_type: AllowlistType;
  phase: string;
  burn_collection: string;
  burn_collection_id: number;
  min_token_index: number;
  max_token_index: number;
  burn_address: string;
  status: boolean;
}

export interface ProofResponseBurn {
  keccak: string;
  info: any;
  proof: string[];
}

export interface ProofResponse extends ProofResponseBurn {
  spots: number;
}

export enum Status {
  UPCOMING = "UPCOMING",
  LIVE = "LIVE",
  COMPLETE = "COMPLETE",
  UNAVAILABLE = "UNAVAILABLE",
}
