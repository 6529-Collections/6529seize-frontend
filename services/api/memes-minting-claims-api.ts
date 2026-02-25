import { MEMES_CONTRACT } from "@/constants/constants";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimsPageResponse } from "@/generated/models/MintingClaimsPageResponse";
import type { MintingClaimsProofsResponse } from "@/generated/models/MintingClaimsProofsResponse";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import type { MintingClaimUpdateRequest } from "@/generated/models/MintingClaimUpdateRequest";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import {
  commonApiFetch,
  commonApiPatch,
  commonApiPostWithoutBodyAndResponse,
} from "@/services/api/common-api";
import { multipartUploadCore } from "@/services/uploads/multipartUploadCore";

const MINTING_CLAIMS_BASE = `minting-claims/${encodeURIComponent(MEMES_CONTRACT)}`;
const MINTING_CLAIMS_BASE_CLAIMS = `${MINTING_CLAIMS_BASE}/claims`;
const GENERATED_STORAGE_FIELDS = new Set<string>([
  "metadata_location",
  "image_location",
  "animation_location",
]);
const ALLOWED_PATCH_FIELDS = new Set<string>([
  "edition_size",
  "description",
  "name",
  "external_url",
  "image_url",
  "attributes",
  "animation_url",
]);

function validateClaimPatchBody(body: MintingClaimUpdateRequest): void {
  const payload = body as Record<string, unknown>;
  const keys = Object.keys(payload);

  const forbiddenGeneratedFields = keys.filter((key) =>
    GENERATED_STORAGE_FIELDS.has(key)
  );

  if (forbiddenGeneratedFields.length > 0) {
    throw new Error(
      `PATCH cannot update generated storage fields: ${forbiddenGeneratedFields.join(", ")}`
    );
  }

  const unsupportedFields = keys.filter(
    (key) => !ALLOWED_PATCH_FIELDS.has(key)
  );

  if (unsupportedFields.length > 0) {
    throw new Error(
      `PATCH contains unsupported fields: ${unsupportedFields.join(", ")}`
    );
  }
}

export async function getClaimsPage(
  page: number,
  pageSize: number
): Promise<MintingClaimsPageResponse> {
  return commonApiFetch<MintingClaimsPageResponse>({
    endpoint: MINTING_CLAIMS_BASE_CLAIMS,
    params: {
      page: String(page),
      page_size: String(pageSize),
    },
  });
}

export async function getClaim(claimId: number): Promise<MintingClaim> {
  return commonApiFetch<MintingClaim>({
    endpoint: `${MINTING_CLAIMS_BASE_CLAIMS}/${claimId}`,
  });
}

export async function getMemesMintingRoots(
  cardId: number
): Promise<MintingClaimsRootItem[]> {
  return commonApiFetch<MintingClaimsRootItem[]>({
    endpoint: `${MINTING_CLAIMS_BASE}/${cardId}/roots`,
  });
}

export interface MemesMintingAirdropSummaryItem {
  phase: string;
  addresses?: number;
  total?: number;
  // Backward-compat for older backend payloads.
  addresses_count?: number;
  total_airdrops?: number;
  total_spots?: number;
}

export interface NormalizedMemesMintingAirdropSummaryItem
  extends MemesMintingAirdropSummaryItem {
  addresses: number;
  total: number;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeAirdropSummary(
  item: MemesMintingAirdropSummaryItem
): NormalizedMemesMintingAirdropSummaryItem {
  return {
    ...item,
    phase: String(item.phase ?? ""),
    addresses: toFiniteNumber(item.addresses ?? item.addresses_count, 0),
    total: toFiniteNumber(
      item.total ?? item.total_airdrops ?? item.total_spots,
      0
    ),
  };
}

export async function getMemesMintingAirdrops(
  cardId: number
): Promise<NormalizedMemesMintingAirdropSummaryItem[]> {
  const rows = await commonApiFetch<MemesMintingAirdropSummaryItem[]>({
    endpoint: `${MINTING_CLAIMS_BASE}/${cardId}/airdrops`,
  });
  return rows.map(normalizeAirdropSummary);
}

export async function getMemesMintingAllowlists(
  cardId: number
): Promise<NormalizedMemesMintingAirdropSummaryItem[]> {
  const rows = await commonApiFetch<MemesMintingAirdropSummaryItem[]>({
    endpoint: `${MINTING_CLAIMS_BASE}/${cardId}/allowlists`,
  });
  return rows.map(normalizeAirdropSummary);
}

export async function getMemesMintingProofsByAddress(
  cardId: number,
  merkleRoot: string,
  address: string
): Promise<MintingClaimsProofsResponse> {
  return commonApiFetch<MintingClaimsProofsResponse>({
    endpoint: `${MINTING_CLAIMS_BASE}/${cardId}/${encodeURIComponent(
      merkleRoot
    )}/proofs/${encodeURIComponent(address)}`,
  });
}

export async function getDistributionAirdropsArtist(
  contract: string,
  cardId: number
): Promise<PhaseAirdrop[]> {
  return commonApiFetch<PhaseAirdrop[]>({
    endpoint: `distributions/${contract}/${cardId}/airdrops_artist`,
  });
}

export async function getDistributionAirdropsTeam(
  contract: string,
  cardId: number
): Promise<PhaseAirdrop[]> {
  return commonApiFetch<PhaseAirdrop[]>({
    endpoint: `distributions/${contract}/${cardId}/airdrops_team`,
  });
}

export async function getFinalSubscriptionsByPhase(
  contract: string,
  tokenId: number,
  phaseName: string
): Promise<PhaseAirdrop[]> {
  return commonApiFetch<PhaseAirdrop[]>({
    endpoint: `subscriptions/final/${contract}/${tokenId}/phases/${encodeURIComponent(
      phaseName
    )}`,
  });
}

export async function patchClaim(
  claimId: number,
  body: MintingClaimUpdateRequest
): Promise<MintingClaim> {
  validateClaimPatchBody(body);
  return commonApiPatch<MintingClaimUpdateRequest, MintingClaim>({
    endpoint: `${MINTING_CLAIMS_BASE_CLAIMS}/${claimId}`,
    body,
  });
}

export async function postArweaveUpload(claimId: number): Promise<void> {
  return commonApiPostWithoutBodyAndResponse({
    endpoint: `${MINTING_CLAIMS_BASE_CLAIMS}/${claimId}/arweave-upload`,
  });
}

export type ClaimMediaField = "image_url" | "animation_url";

export async function uploadClaimMedia(
  _claimId: number,
  _field: ClaimMediaField,
  file: File
): Promise<string> {
  return multipartUploadCore({
    file,
    endpoints: {
      start: "drop-media/multipart-upload",
      part: "drop-media/multipart-upload/part",
      complete: "drop-media/multipart-upload/completion",
    },
  });
}
