export enum MemesSubmissionAdditionalInfoKey {
  AIRDROP_CONFIG = "airdrop_config",
  PAYMENT_INFO = "payment_info",
  ALLOWLIST_BATCHES = "allowlist_batches",
  ADDITIONAL_MEDIA = "additional_media",
  COMMENTARY = "commentary",
  ABOUT_ARTIST = "about_artist",
}

export const MEMES_SUBMISSION_ADDITIONAL_INFO_KEYS: string[] =
  Object.values(MemesSubmissionAdditionalInfoKey);

export interface AirdropEntry {
  id: string;
  address: string;
  count: number;
}

export const AIRDROP_TOTAL = 20;

export interface PaymentInfo {
  payment_address: string;
  has_designated_payee: boolean;
  designated_payee_name: string;
}

export interface AllowlistBatch {
  contract: string;
  token_ids: number[];
}

export interface AllowlistBatchRaw {
  id: string;
  contract: string;
  token_ids_raw: string;
}

export interface AdditionalMedia {
  artist_profile_media: string[];
  artwork_commentary_media: string[];
  preview_image: string;
}

export interface OperationalData {
  airdrop_config: AirdropEntry[];
  payment_info: PaymentInfo;
  allowlist_batches: AllowlistBatchRaw[];
  additional_media: AdditionalMedia;
  commentary: string;
  about_artist: string;
}
