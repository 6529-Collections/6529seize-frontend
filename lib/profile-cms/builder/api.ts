import { isProfileCmsBuilderApiEnabledEnv } from "@/config/profileCmsBuilderEnv";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import { commonApiPost } from "@/services/api/common-api";

export const PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT = "profile-cms/packages";
export const PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT =
  "profile-cms/packages/validate";
export const PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT =
  "profile-cms/packages/{id}/publish";

export type ProfileCmsBuilderAction = "save_draft" | "validate" | "publish";
export type ProfileCmsBuilderActionCode =
  | "api_disabled"
  | "missing_draft_id"
  | "missing_profile_id"
  | "profile_not_authorized"
  | "publish_requires_signed_storage"
  | "request_failed"
  | "server_validation_completed"
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
    };

type BuilderActionResponse = {
  readonly draft_id?: string | undefined;
  readonly package_hash?: string | undefined;
  readonly message?: string | undefined;
};

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

  return {
    ok: true,
    action,
    code: getSuccessCode(action),
    ...(response.draft_id ? { draftId: response.draft_id } : {}),
    ...(response.package_hash ? { packageHash: response.package_hash } : {}),
  };
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
    case "save_draft":
      return await commonApiPost<
        { readonly cms_package: CmsPackageV1; readonly profile_id: string },
        BuilderActionResponse
      >({
        endpoint,
        body: { profile_id: profileId ?? "", cms_package: cmsPackage },
        errorMode: "structured",
      });
    case "validate":
      return await commonApiPost<
        {
          readonly allow_fixture_signatures: boolean;
          readonly allow_fixture_storage: boolean;
          readonly cms_package: CmsPackageV1;
          readonly enforce_hashes: boolean;
        },
        BuilderActionResponse
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
