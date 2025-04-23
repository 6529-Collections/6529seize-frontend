interface NewDelegationParams {
  collection_address: string;
  delegation_address: string;
  expiry_date: Date;
  use_case: number;
  all_tokens: boolean;
  token_id: number;
}

export interface Delegation {
  block: number;
  from_address: string;
  from_display: string;
  to_address: string;
  to_display: string;
  collection: string;
  use_case: number;
  expiry: number;
  token_id: number;
  all_tokens: boolean;
}

export interface Consolidation {
  consolidation_display: string;
  primary: string;
  wallets: string[];
}

export interface WalletConsolidation {
  block: number;
  wallet1: string;
  wallet1_display: string;
  wallet2: string;
  wallet2_display: string;
  confirmed: boolean;
}
