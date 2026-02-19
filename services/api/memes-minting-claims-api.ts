import { publicEnv } from "@/config/env";
import type { MemeClaim } from "@/generated/models/MemeClaim";
import type { MemeClaimUpdateRequest } from "@/generated/models/MemeClaimUpdateRequest";
import type { MemesMintingClaimsPageResponse } from "@/generated/models/MemesMintingClaimsPageResponse";
import type { MemesMintingProofsResponse } from "@/generated/models/MemesMintingProofsResponse";
import type { MemesMintingRootItem } from "@/generated/models/MemesMintingRootItem";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import { commonApiFetch, commonApiPatch } from "@/services/api/common-api";
import { multipartUploadCore } from "@/services/uploads/multipartUploadCore";
import { getAuthJwt, getStagingAuth } from "../auth/auth.utils";

const CLAIMS_BASE = "memes-minting/claims";
const GENERATED_STORAGE_FIELDS = new Set<string>([
  "metadata_location",
  "image_location",
  "animation_location",
]);
const ALLOWED_PATCH_FIELDS = new Set<string>([
  "season",
  "edition_size",
  "description",
  "name",
  "image_url",
  "attributes",
  "animation_url",
]);

function validateClaimPatchBody(body: MemeClaimUpdateRequest): void {
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

function getHeaders(): Record<string, string> {
  const apiAuth = getStagingAuth();
  const walletAuth = getAuthJwt();
  return {
    "Content-Type": "application/json",
    ...(apiAuth ? { "x-6529-auth": apiAuth } : {}),
    ...(walletAuth ? { Authorization: `Bearer ${walletAuth}` } : {}),
  };
}

export async function getClaimsPage(
  page: number,
  pageSize: number
): Promise<MemesMintingClaimsPageResponse> {
  return commonApiFetch<MemesMintingClaimsPageResponse>({
    endpoint: CLAIMS_BASE,
    params: {
      page: String(page),
      page_size: String(pageSize),
    },
  });
}

export async function getClaim(memeId: number): Promise<MemeClaim> {
  return commonApiFetch<MemeClaim>({
    endpoint: `${CLAIMS_BASE}/${memeId}`,
  });
}

export async function getMemesMintingRoots(
  contract: string,
  cardId: number
): Promise<MemesMintingRootItem[]> {
  return commonApiFetch<MemesMintingRootItem[]>({
    endpoint: `memes-minting/${contract}/${cardId}/roots`,
  });
}

export interface MemesMintingAirdropSummaryItem {
  phase: string;
  addresses: number;
  total: number;
  // Backward-compat for older backend payloads.
  addresses_count?: number;
  total_airdrops?: number;
  total_spots?: number;
}

export async function getMemesMintingAirdrops(
  contract: string,
  cardId: number
): Promise<MemesMintingAirdropSummaryItem[]> {
  return commonApiFetch<MemesMintingAirdropSummaryItem[]>({
    endpoint: `memes-minting/${contract}/${cardId}/airdrops`,
  });
}

export async function getMemesMintingAllowlists(
  contract: string,
  cardId: number
): Promise<MemesMintingAirdropSummaryItem[]> {
  return commonApiFetch<MemesMintingAirdropSummaryItem[]>({
    endpoint: `memes-minting/${contract}/${cardId}/allowlists`,
  });
}

export async function getMemesMintingProofsByAddress(
  contract: string,
  cardId: number,
  merkleRoot: string,
  address: string
): Promise<MemesMintingProofsResponse> {
  return commonApiFetch<MemesMintingProofsResponse>({
    endpoint: `memes-minting/${encodeURIComponent(contract)}/${cardId}/${encodeURIComponent(
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
  memeId: number,
  body: MemeClaimUpdateRequest
): Promise<MemeClaim> {
  validateClaimPatchBody(body);
  return commonApiPatch<MemeClaimUpdateRequest, MemeClaim>({
    endpoint: `${CLAIMS_BASE}/${memeId}`,
    body,
  });
}

export async function postArweaveUpload(memeId: number): Promise<void> {
  const url = `${publicEnv.API_ENDPOINT}/api/${CLAIMS_BASE}/${memeId}/arweave-upload`;
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: "",
  });
  if (res.status === 409) {
    throw new Error("Already published");
  }
  if (res.status === 403) {
    throw new Error("Not authorized");
  }
  if (!res.ok) {
    let errorMessage: string;
    try {
      const body = await res.json();
      errorMessage = (body as { error?: string })?.error ?? res.statusText ?? "Request failed";
    } catch {
      errorMessage = res.statusText ?? "Request failed";
    }
    throw new Error(errorMessage);
  }
}

export type ClaimMediaField = "image_url" | "animation_url";

export async function uploadClaimMedia(
  _memeId: number,
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
