import { isProfileCmsBuilderApiEnabledEnv } from "@/config/profileCmsBuilderEnv";
import type { ApiProfileCmsValidationIssue } from "@/generated/models/ApiProfileCmsValidationIssue";
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
// src/api-serverless/src/profile-cms/*.handlers.ts). Publish stays hard
// blocked client-side below regardless of what the backend exposes.
export const PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT =
  "profile-cms/wallet-gallery/snapshot";
export const PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT = "profile-cms/packages";
export const PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT =
  "profile-cms/packages/validate";
export const PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT =
  "profile-cms/packages/{id}/publish";
const PROFILE_CMS_BUILDER_PACKAGE_BY_ID_ENDPOINT = "profile-cms/packages/{id}";
const PROFILE_CMS_BUILDER_PROFILE_PACKAGES_ENDPOINT =
  "profile-cms/profiles/{profile_id}/packages";

export type ProfileCmsBuilderAction = "save_draft" | "validate" | "publish";
export type ProfileCmsBuilderActionCode =
  | "api_disabled"
  | "missing_draft_id"
  | "missing_profile_id"
  | "profile_not_authorized"
  | "publish_requires_signed_storage"
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
    }
  | {
      readonly ok: false;
      readonly action: ProfileCmsBuilderAction;
      readonly code: ProfileCmsBuilderActionCode;
      readonly expectedEndpoint: string;
      // A rejected server validation is a completed request whose outcome is
      // "not valid": the server can still return the validation target (and,
      // if it persisted one, a draft id) plus the blocking issues to display.
      readonly draftId?: string | undefined;
      readonly packageHash?: string | undefined;
      readonly serverIssues?:
        | readonly ApiProfileCmsValidationIssue[]
        | undefined;
    };

export type { ProfileCmsPackageRecord } from "@/lib/profile-cms/builder/package-normalize";

export async function runProfileCmsBuilderAction({
  action,
  cmsPackage,
  draftId,
  profileId,
}: {
  readonly action: ProfileCmsBuilderAction;
  readonly cmsPackage: CmsPackageV1;
  readonly draftId?: string | undefined;
  readonly profileId?: string | undefined;
}): Promise<ProfileCmsBuilderActionResult> {
  const endpoint = getEndpoint({ action, draftId });

  if (action === "publish") {
    return {
      ok: false,
      action,
      expectedEndpoint: endpoint,
      code: "publish_requires_signed_storage",
    };
  }

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

  if (response.serverValid === false) {
    return {
      ok: false,
      action,
      code: "server_validation_invalid",
      expectedEndpoint: endpoint,
      ...(response.draftId ? { draftId: response.draftId } : {}),
      ...(response.packageHash ? { packageHash: response.packageHash } : {}),
      ...(response.issues?.length ? { serverIssues: response.issues } : {}),
    };
  }

  return {
    ok: true,
    action,
    code: getSuccessCode(action),
    ...(response.draftId ? { draftId: response.draftId } : {}),
    ...(response.packageHash ? { packageHash: response.packageHash } : {}),
  };
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
  draftId,
}: {
  readonly action: ProfileCmsBuilderAction;
  readonly draftId?: string | undefined;
}): string {
  switch (action) {
    case "save_draft":
      return PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT;
    case "validate":
      return PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT;
    case "publish":
      return draftId
        ? PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT.replace(
            "{id}",
            encodeURIComponent(draftId)
          )
        : PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT.replace("{id}", ":id");
  }
}

type BuilderActionResponse = {
  readonly draftId?: string | undefined;
  readonly packageHash?: string | undefined;
  readonly serverValid?: boolean | undefined;
  readonly issues?: readonly ApiProfileCmsValidationIssue[] | undefined;
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
        issues: response.issues,
      };
    }
    case "publish":
      throw new Error("unsupported_publish_action");
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
    case "publish":
      return "publish_requires_signed_storage";
  }
}
