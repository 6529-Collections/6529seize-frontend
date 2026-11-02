/**
 * Local mirror of the contract 4.1 OpenAPI schemas (ApiE2ee*). The engine keeps
 * these local types so it does not depend on the generated client layout; the
 * generated models (when present) are structurally identical.
 */

import type { E2eeEligibilityReason } from "./types";

export type ApiE2eePlatform = "web" | "desktop" | "phone";

export interface ApiE2eeDeviceGrant {
  wallet: string;
  device_key: string;
  ciphersuite: number;
  issued_at: number;
  expires_at: number;
  origin: string;
}

export interface ApiE2eeDeviceRevocation {
  revoker_device_key: string;
  revoked_at: number;
  signature: string;
}

export interface ApiE2eeDevice {
  device_key: string;
  profile_id: string;
  grant: ApiE2eeDeviceGrant;
  grant_id: string;
  wallet_signature: string;
  verified_via: string;
  label: string;
  platform: string;
  created_at: number;
  last_seen_at: number | null;
  revoked_at: number | null;
  revocation: ApiE2eeDeviceRevocation | null;
  /**
   * Combined sign-in grant (NC8): the exact SIWE message the wallet signed.
   * Then wallet_signature is its EIP-191 signature and grant_id its EIP-191
   * hash. Absent or null for EIP-712 MlsDeviceGrant grants.
   */
  grant_message?: string | null;
}

export interface ApiE2eeRegisterDeviceRequest {
  grant: ApiE2eeDeviceGrant;
  wallet_signature: string;
  label?: string;
  platform: string;
}

/** Registers the MLS key a combined sign-in grant also granted (NC8). */
export interface ApiE2eeRegisterLoginGrantDeviceRequest {
  grant_id: string;
  label?: string;
  platform: string;
}

export interface ApiE2eeRevokeDeviceRequest {
  revoker_device_key: string;
  revoked_at: number;
  signature: string;
}

export interface ApiE2eeKeyPackageUpload {
  data: string;
  last_resort: boolean;
  expires_at: number;
}

export interface ApiE2eeUploadKeyPackagesRequest {
  key_packages: ApiE2eeKeyPackageUpload[];
}

export interface ApiE2eeKeyPackageStatus {
  device_key: string;
  one_time_available: number;
  last_resort_expires_at: number | null;
}

export interface ApiE2eeMe {
  profile_id: string;
  devices: ApiE2eeDevice[];
  key_packages: ApiE2eeKeyPackageStatus[];
  max_devices: number;
  /** Absent from servers older than the attachment switch (they accept them). */
  attachments_enabled?: boolean;
}

export interface ApiE2eeClaimTarget {
  profile_id: string;
  device_keys?: string[];
}

export interface ApiE2eeClaimKeyPackagesRequest {
  targets: ApiE2eeClaimTarget[];
  group?: string;
  claimer_device_key: string;
}

interface ApiE2eeClaimedKeyPackage {
  device: ApiE2eeDevice;
  key_package: string;
  last_resort: boolean;
}

export type ApiE2eePolicyStatus = "OK" | "POLICY" | "BLOCKED" | "NO_DEVICES";

export interface ApiE2eeClaimResult {
  profile_id: string;
  status: ApiE2eePolicyStatus;
  key_packages: ApiE2eeClaimedKeyPackage[];
}

export interface ApiE2eeClaimKeyPackagesResponse {
  results: ApiE2eeClaimResult[];
}

export interface ApiE2eeEligibilityRequest {
  profile_ids: string[];
}

export interface ApiE2eeEligibilityItem {
  profile_id: string;
  status: ApiE2eePolicyStatus;
  active_devices: number;
  /** Shared DM admission code behind POLICY or BLOCKED; absent otherwise. */
  reason?: E2eeEligibilityReason | null;
}

export interface ApiE2eeEligibilityResponse {
  results: ApiE2eeEligibilityItem[];
}

export interface ApiE2eeCreateGroupRequest {
  group: string;
  commit_key: string;
  creator_device_key: string;
}

export interface ApiE2eeRosterDevice {
  device_key: string;
  profile_id: string;
  joined_epoch: number;
}

export interface ApiE2eeGroup {
  group: string;
  epoch: number;
  commit_key: string;
  last_seq: number;
  created_at: number;
  updated_at: number;
  roster: ApiE2eeRosterDevice[];
}

export interface ApiE2eeWelcomeUpload {
  data: string;
  ratchet_tree?: string;
  targets: string[];
}

export type ApiE2eeEntryKind = "commit" | "proposal";

export interface ApiE2eeSubmitEntryRequest {
  kind: ApiE2eeEntryKind;
  epoch: number;
  data: string;
  entry_hash: string;
  epoch_commitment: string;
  next_commit_key: string;
  signature: string;
  sender_device_key: string;
  roster_add?: string[];
  roster_remove?: string[];
  welcome?: ApiE2eeWelcomeUpload;
}

export interface ApiE2eeLogItem {
  seq: number;
  type: "entry" | "message";
  epoch: number;
  kind: ApiE2eeEntryKind | null;
  data: string;
  entry_hash: string | null;
  epoch_commitment: string | null;
  next_commit_key: string | null;
  signature: string | null;
  roster_add: string[];
  roster_remove: string[];
  epoch_fp: string | null;
  created_at: number;
}

export interface ApiE2eeLogPage {
  items: ApiE2eeLogItem[];
  next_after_seq: number | null;
  group: ApiE2eeGroup;
}

export type ApiE2eeNotifyKind = "message" | "mention" | "reply";

export interface ApiE2eeNotifyHint {
  profile_id: string;
  kind: ApiE2eeNotifyKind;
}

export interface ApiE2eeSendMessageRequest {
  epoch: number;
  data: string;
  epoch_fp: string;
  sender_device_key: string;
  notify?: ApiE2eeNotifyHint[];
}

export interface ApiE2eeSendMessageResponse {
  seq: number;
  created_at: number;
}

export interface ApiE2eeRosterRepairRequest {
  epoch: number;
  device_keys: string[];
  requester_device_key: string;
  signature: string;
}

export interface ApiE2eeWelcome {
  id: string;
  group: string;
  epoch: number;
  data: string;
  ratchet_tree: string | null;
  added_by_profile_id: string;
  added_by_device_key: string;
  created_at: number;
}

export interface ApiE2eeDeviceGroup {
  group: string;
  epoch: number;
  last_seq: number;
  joined_epoch: number;
  updated_at: number;
}

export interface ApiE2eeCreateBlobRequest {
  group: string;
  uploader_device_key: string;
  size: number;
  chunk_count: number;
}

export interface ApiE2eeBlob {
  blob_id: string;
  group: string;
  size: number;
  chunk_count: number;
  complete: boolean;
  created_at: number;
}

export interface ApiE2eeBlobChunk {
  data: string;
}

export interface ApiE2eeReportRequest {
  group: string;
  epoch: number;
  body: string;
  signature: string;
  sender_device_key: string;
  reporter_device_key: string;
  reason: string;
  notes?: string;
}

export interface ApiE2eeReport {
  id: string;
  verified: boolean;
  sender_profile_id: string | null;
  created_at: number;
}
