import { isProfileCmsBuilderApiEnabledEnv } from "@/config/profileCmsBuilderEnv";
import type { ApiProfileCmsValidationResult } from "@/generated/models/ApiProfileCmsValidationResult";
import type { ApiProfileCmsWalletGallerySnapshot } from "@/generated/models/ApiProfileCmsWalletGallerySnapshot";
import {
  createMockWalletGallerySnapshot,
  type WalletGallerySnapshot,
  type WalletGallerySource,
} from "@/lib/profile-cms/builder/gallery";
import { normalizeWalletGallerySnapshotResponse } from "@/lib/profile-cms/builder/gallery-normalize";
import {
  normalizeLoadedProfileCmsPackageRecord,
  normalizeProfileCmsPackageRecord,
  type LoadedProfileCmsPackageRecord,
  type ProfileCmsPackageRecord,
  type ProfileCmsPackageWire,
} from "@/lib/profile-cms/builder/package-normalize";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

// Real backend contract (see D:\repos\6529seize-backend
// src/api-serverless/src/generated/routes/openapi-generated.routes.ts and
// src/api-serverless/src/profile-cms/*.handlers.ts). Publish is now wired to
// the real signed-storage flow via the orchestration in
// lib/profile-cms/builder/publish.ts.
export const PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT =
  "profile-cms/wallet-gallery/snapshot";
export const PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT = "profile-cms/packages";
export const PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT =
  "profile-cms/packages/validate";
export const PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT =
  "profile-cms/packages/{id}/publish";
export const PROFILE_CMS_BUILDER_STORAGE_UPLOAD_ENDPOINT =
  "profile-cms/packages/{id}/storage/upload";
export const PROFILE_CMS_BUILDER_ROLLBACK_ENDPOINT =
  "profile-cms/packages/{id}/rollback";
const PROFILE_CMS_BUILDER_PACKAGE_BY_ID_ENDPOINT = "profile-cms/packages/{id}";
const PROFILE_CMS_BUILDER_PROFILE_PACKAGES_ENDPOINT =
  "profile-cms/profiles/{profile_id}/packages";

export type ProfileCmsBuilderAction = "save_draft" | "validate";
export type ProfileCmsBuilderActionCode =
  | "api_disabled"
  | "missing_draft_id"
  | "missing_profile_id"
  | "profile_not_authorized"
  | "request_failed"
  | "server_validation_completed"
  | "server_validation_invalid"
  | "draft_saved";

export type ProfileCmsBuilderActionResult =
  | {
      readonly ok: true;
      readonly action: ProfileCmsBuilderAction;
      readonly code: ProfileCmsBuilderActionCode;
      readonly draftId?: string | undefined;
      readonly packageHash?: string | undefined;
      readonly payloadHash?: string | undefined;
      readonly version?: number | undefined;
    }
  | {
      readonly ok: false;
      readonly action: ProfileCmsBuilderAction;
      readonly code: ProfileCmsBuilderActionCode;
      readonly expectedEndpoint: string;
    };

export type { ProfileCmsPackageRecord } from "@/lib/profile-cms/builder/package-normalize";

/**
 * Canonical storage receipt returned by the storage-upload endpoint, mirroring
 * the backend `CmsStorageReceiptV1` / `ApiProfileCmsStorageReceipt` shape (see
 * 6529seize-backend PR #1713, branch codex/cms-arweave-storage-upload). The
 * frontend has no generated model for this yet, so the shape is pinned here.
 */
export type ProfileCmsStorageReceipt = {
  readonly provider: "ipfs" | "arweave" | "s3" | "fixture";
  readonly uri: string;
  readonly content_hash: string;
  readonly provider_content_id?: string | undefined;
  readonly pinned?: boolean | undefined;
  readonly canonical: boolean;
  readonly recorded_at: string;
};

/**
 * Publish request body. Mirrors the generated
 * `ApiPublishProfileCmsPackageRequest` model and the backend Joi
 * `PublishBodySchema`. `verifying_contract` is only set for Safe/EIP-1271.
 */
export type ProfileCmsPublishRequest = {
  readonly expected_package_hash?: string | undefined;
  readonly expected_payload_hash?: string | undefined;
  readonly signer_address: string;
  readonly signature: string;
  readonly chain_id: number;
  readonly deadline: number;
  readonly is_safe_signature?: boolean | undefined;
  readonly verifying_contract?: string | null | undefined;
};

/**
 * Rollback request body. Mirrors `ApiRollbackProfileCmsPackageRequest` and the
 * backend Joi `RollbackBodySchema`.
 */
export type ProfileCmsRollbackRequest = {
  readonly expected_current_package_id: string;
  readonly expected_current_package_hash?: string | undefined;
};

export async function runProfileCmsBuilderAction({
  action,
  cmsPackage,
  profileId,
}: {
  readonly action: ProfileCmsBuilderAction;
  readonly cmsPackage: CmsPackageV1;
  readonly profileId?: string | undefined;
}): Promise<ProfileCmsBuilderActionResult> {
  const endpoint = getEndpoint({ action });

  if (!isProfileCmsBuilderApiEnabledEnv()) {
    return {
      ok: false,
      action,
      expectedEndpoint: endpoint,
      code: "api_disabled",
    };
  }

  if (action === "save_draft" && !profileId) {
    return {
      ok: false,
      action,
      expectedEndpoint: endpoint,
      code: "missing_profile_id",
    };
  }

  const response = await postBuilderAction({
    action,
    cmsPackage,
    endpoint,
    profileId,
  });

  return {
    ok: true,
    action,
    code:
      response.serverValid === false
        ? "server_validation_invalid"
        : getSuccessCode(action),
    ...(response.draftId ? { draftId: response.draftId } : {}),
    ...(response.packageHash ? { packageHash: response.packageHash } : {}),
    ...(response.payloadHash ? { payloadHash: response.payloadHash } : {}),
    ...(response.version === undefined ? {} : { version: response.version }),
  };
}

/**
 * Upload the canonical package JSON to decentralized storage and return the
 * persisted canonical receipt. Backing endpoint:
 * `POST profile-cms/packages/:id/storage/upload` (no request body). The backend
 * writes the receipt into the stored draft's `storage` array; callers must not
 * fabricate receipts client-side.
 */
export async function uploadProfileCmsPackageStorage(
  id: string
): Promise<ProfileCmsStorageReceipt> {
  assertProfileCmsBuilderApiEnabled();
  const response = await commonApiPost<
    Record<string, never>,
    { readonly receipt: ProfileCmsStorageReceipt }
  >({
    endpoint: PROFILE_CMS_BUILDER_STORAGE_UPLOAD_ENDPOINT.replace(
      "{id}",
      encodeURIComponent(id)
    ),
    body: {},
    errorMode: "structured",
  });

  return response.receipt;
}

/**
 * Publish a saved draft as the primary CMS package after wallet signing.
 * Backing endpoint: `POST profile-cms/packages/:id/publish`.
 */
export async function publishProfileCmsPackage(
  id: string,
  request: ProfileCmsPublishRequest
): Promise<ProfileCmsPackageRecord> {
  assertProfileCmsBuilderApiEnabled();
  const response = await commonApiPost<
    ProfileCmsPublishRequest,
    ProfileCmsPackageWire
  >({
    endpoint: PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT.replace(
      "{id}",
      encodeURIComponent(id)
    ),
    body: request,
    errorMode: "structured",
  });

  return normalizeProfileCmsPackageRecord(response);
}

/**
 * Roll the primary pointer back to a previously published version.
 * Backing endpoint: `POST profile-cms/packages/:id/rollback`.
 */
export async function rollbackProfileCmsPackage(
  id: string,
  request: ProfileCmsRollbackRequest
): Promise<ProfileCmsPackageRecord> {
  assertProfileCmsBuilderApiEnabled();
  const response = await commonApiPost<
    ProfileCmsRollbackRequest,
    ProfileCmsPackageWire
  >({
    endpoint: PROFILE_CMS_BUILDER_ROLLBACK_ENDPOINT.replace(
      "{id}",
      encodeURIComponent(id)
    ),
    body: request,
    errorMode: "structured",
  });

  return normalizeProfileCmsPackageRecord(response);
}

export async function requestProfileCmsGallerySnapshot({
  handle,
  sources,
}: {
  readonly handle: string;
  readonly sources: readonly WalletGallerySource[];
}): Promise<WalletGallerySnapshot> {
  if (!isProfileCmsBuilderApiEnabledEnv()) {
    return createMockWalletGallerySnapshot({ handle, sources });
  }

  const response = await commonApiPost<
    { readonly wallets: readonly string[] },
    ApiProfileCmsWalletGallerySnapshot
  >({
    endpoint: PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT,
    body: {
      wallets: sources.map((source) => source.normalized),
    },
    errorMode: "structured",
  });

  return normalizeWalletGallerySnapshotResponse(response, sources);
}

/**
 * List saved drafts (and any published/archived versions) for a profile.
 * Backing endpoint: `GET profile-cms/profiles/:profile_id/packages`.
 */
export async function listProfileCmsPackagesForProfile(
  profileId: string
): Promise<readonly ProfileCmsPackageRecord[]> {
  assertProfileCmsBuilderApiEnabled();
  const response = await commonApiFetch<readonly ProfileCmsPackageWire[]>({
    endpoint: PROFILE_CMS_BUILDER_PROFILE_PACKAGES_ENDPOINT.replace(
      "{profile_id}",
      encodeURIComponent(profileId)
    ),
  });

  return response.map(normalizeProfileCmsPackageRecord);
}

/**
 * Load a single saved draft/package by id, including its CMS package payload
 * (validated against the local V1 schema before it can enter editor state).
 * Backing endpoint: `GET profile-cms/packages/:id`.
 */
export async function getProfileCmsPackageById(
  id: string
): Promise<LoadedProfileCmsPackageRecord> {
  assertProfileCmsBuilderApiEnabled();
  const response = await commonApiFetch<ProfileCmsPackageWire>({
    endpoint: PROFILE_CMS_BUILDER_PACKAGE_BY_ID_ENDPOINT.replace(
      "{id}",
      encodeURIComponent(id)
    ),
  });

  return normalizeLoadedProfileCmsPackageRecord(response);
}

function assertProfileCmsBuilderApiEnabled(): void {
  if (!isProfileCmsBuilderApiEnabledEnv()) {
    throw new Error("profile_cms_builder_api_disabled");
  }
}

function getEndpoint({
  action,
}: {
  readonly action: ProfileCmsBuilderAction;
}): string {
  switch (action) {
    case "save_draft":
      return PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT;
    case "validate":
      return PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT;
  }
}

type BuilderActionResponse = {
  readonly draftId?: string | undefined;
  readonly packageHash?: string | undefined;
  readonly payloadHash?: string | undefined;
  readonly serverValid?: boolean | undefined;
  readonly version?: number | undefined;
};

async function postBuilderAction({
  action,
  cmsPackage,
  endpoint,
  profileId,
}: {
  readonly action: ProfileCmsBuilderAction;
  readonly cmsPackage: CmsPackageV1;
  readonly endpoint: string;
  readonly profileId?: string | undefined;
}): Promise<BuilderActionResponse> {
  switch (action) {
    case "save_draft": {
      const response = await commonApiPost<
        { readonly cms_package: CmsPackageV1; readonly profile_id: string },
        ProfileCmsPackageWire
      >({
        endpoint,
        body: { profile_id: profileId ?? "", cms_package: cmsPackage },
        errorMode: "structured",
      });
      return {
        draftId: response.id,
        packageHash: response.package_hash,
        payloadHash: response.payload_hash,
        version: response.version,
      };
    }
    case "validate": {
      const response = await commonApiPost<
        {
          readonly allow_fixture_signatures: boolean;
          readonly allow_fixture_storage: boolean;
          readonly cms_package: CmsPackageV1;
          readonly enforce_hashes: boolean;
        },
        ApiProfileCmsValidationResult
      >({
        endpoint,
        body: {
          cms_package: cmsPackage,
          allow_fixture_signatures: true,
          allow_fixture_storage: true,
          enforce_hashes: true,
        },
        errorMode: "structured",
      });
      return {
        draftId: response.target?.draft_id,
        packageHash: response.target?.package_hash,
        serverValid: response.valid,
      };
    }
  }
}

function getSuccessCode(
  action: ProfileCmsBuilderAction
): ProfileCmsBuilderActionCode {
  switch (action) {
    case "save_draft":
      return "draft_saved";
    case "validate":
      return "server_validation_completed";
  }
}
