export interface AirdropEntry {
  address: string;
  count: number;
}

export const AIRDROP_TOTAL = 20;

export interface PaymentInfo {
  payment_address: string;
}

export interface AllowlistBatch {
  contract: string;
  token_ids: number[];
}

export interface AllowlistBatchRaw {
  contract: string;
  token_ids_raw: string;
}

export interface AdditionalMedia {
  artist_profile_media: string[];
  artwork_commentary_media: string[];
}

export interface OperationalData {
  airdrop_config: AirdropEntry[];
  payment_info: PaymentInfo;
  allowlist_batches: AllowlistBatchRaw[];
  additional_media: AdditionalMedia;
  commentary: string;
}
