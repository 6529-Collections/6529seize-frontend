export interface NewDelegationParams {
  collection_address: string;
  delegation_address: string;
  expiry_date: Date;
  use_case: number;
  all_tokens: boolean;
  token_id: number;
}
