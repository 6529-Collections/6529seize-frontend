export interface AirdropInfo {
  airdrop_artist_address: string;
  airdrop_artist_count: number;
  airdrop_choice_address: string;
  airdrop_choice_count: number;
}

export interface PaymentInfo {
  payment_address: string;
}

export interface AllowlistBatch {
  contract: string;
  token_ids: number[];
}

export interface AdditionalMedia {
  artist_profile_media: string[];
  artwork_commentary_media: string[];
}

export interface OperationalData {
  airdrop_info: AirdropInfo;
  payment_info: PaymentInfo;
  allowlist_batches: AllowlistBatch[];
  additional_media: AdditionalMedia;
  commentary: string;
}
