export interface NewDelegationParams {
  collection_address: string;
  delegation_address: string;
  expiry_date: Date;
  use_case: number;
  all_tokens: boolean;
  token_id: number;
}

export interface Delegation {
  from_address: string;
  to_address: string;
  collection: string;
  use_case: number;
}

export interface Consolidation {
  consolidation_display: string;
  primary: string;
  wallets: string[];
}
