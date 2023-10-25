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
  timePeriod: number;
  salesOption: number;
  delAddress: string;
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
  image?: string;
  name: string;
  description: string;
  attributes: Attributes[];
}

export const EMPTY_TOKEN_URI: TokenURI = {
  id: 0,
  collection: 0,
  uri: "",
  name: "",
  description: "",
  attributes: [],
};

export interface Attributes {
  trait_type: string;
  value: string;
}

export enum Status {
  UPCOMING,
  LIVE,
  COMPLETE,
  UNAVAILABLE,
}
