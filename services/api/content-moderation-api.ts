import type { ApiBlockedProfile } from "@/generated/models/ApiBlockedProfile";
import type { ApiContentModerationBlockActivityItem } from "@/generated/models/ApiContentModerationBlockActivityItem";
import type { ApiContentModerationProfileListItem } from "@/generated/models/ApiContentModerationProfileListItem";
import type { ApiContentModerationProfileStatusResponse } from "@/generated/models/ApiContentModerationProfileStatusResponse";
import type { ApiContentModerationQueueItem } from "@/generated/models/ApiContentModerationQueueItem";
import type { ApiContentModerationReportRequest } from "@/generated/models/ApiContentModerationReportRequest";
import type { ApiContentModerationReportResponse } from "@/generated/models/ApiContentModerationReportResponse";
import type { ApiContentModerationReportWithdrawalResponse } from "@/generated/models/ApiContentModerationReportWithdrawalResponse";
import type { ApiContentModerationUserReport } from "@/generated/models/ApiContentModerationUserReport";
import type { ApiContentModeratorAccess } from "@/generated/models/ApiContentModeratorAccess";
import type { ApiIdentitySubscriptionActions } from "@/generated/models/ApiIdentitySubscriptionActions";
import type { ApiModerationAccess } from "@/generated/models/ApiModerationAccess";
import {
  flagItem,
  identityFollow,
  personalChange,
} from "@/lib/personal-records/personal-record-changes";
import { ownerOfProfile } from "@/lib/personal-records/record-owners";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";
import {
  commonApiDelete,
  commonApiDeleteWithResponse,
  commonApiFetch,
  commonApiPost,
  commonApiPut,
} from "@/services/api/common-api";

export const PROFILE_SUSPENDED_ERROR_CODE = "PROFILE_SUSPENDED";

export const fetchBlockedProfiles = (): Promise<ApiBlockedProfile[]> =>
  commonApiFetch<ApiBlockedProfile[]>({
    endpoint: "content-moderation/blocked-profiles",
    errorMode: "structured",
  });

/** Whether the signed-in profile follows this one, read before a block unfollows it. */
const isFollowing = async (profileId: string): Promise<boolean> =>
  (
    await commonApiFetch<ApiIdentitySubscriptionActions>({
      endpoint: `identities/${profileId}/subscriptions`,
    })
  ).actions.length > 0;

/**
 * Blocks a profile: today's route, or a private `block` item keyed by the
 * profile's owner, with the follow's unset in the same submit when the
 * signed-in profile follows it.
 */
export const blockProfile = (profileId: string): Promise<void> =>
  savePersonalSetting<void, boolean>({
    legacy: () =>
      commonApiPut<Record<string, never>, unknown>({
        endpoint: `content-moderation/profiles/${profileId}/block`,
        body: {},
      }).then(() => undefined),
    snapshot: () => isFollowing(profileId),
    change: async (following) => {
      const owner = await ownerOfProfile(profileId);
      return personalChange({
        follows: following ? [identityFollow(owner, false)] : [],
        items: [flagItem("block", owner, true)],
      });
    },
    recordsResult: () => undefined,
  });

export const unblockProfile = (profileId: string): Promise<void> =>
  savePersonalSetting({
    legacy: () =>
      commonApiDelete({
        endpoint: `content-moderation/profiles/${profileId}/block`,
        errorMode: "structured",
      }),
    change: async () =>
      personalChange({
        items: [flagItem("block", await ownerOfProfile(profileId), false)],
      }),
    recordsResult: () => undefined,
  });

const setDropHidden = (dropId: string, hidden: boolean): Promise<void> =>
  savePersonalSetting({
    legacy: () =>
      hidden
        ? commonApiPut<Record<string, never>, unknown>({
            endpoint: `content-moderation/drops/${dropId}/hide`,
            body: {},
          }).then(() => undefined)
        : commonApiDelete({
            endpoint: `content-moderation/drops/${dropId}/hide`,
            errorMode: "structured",
          }),
    change: () => personalChange({ items: [flagItem("hide", dropId, hidden)] }),
    recordsResult: () => undefined,
  });

export const hideDrop = (dropId: string): Promise<void> =>
  setDropHidden(dropId, true);

export const unhideDrop = (dropId: string): Promise<void> =>
  setDropHidden(dropId, false);

export const reportDrop = (
  dropId: string,
  request: ApiContentModerationReportRequest
): Promise<ApiContentModerationReportResponse> =>
  commonApiPost<
    ApiContentModerationReportRequest,
    ApiContentModerationReportResponse
  >({
    endpoint: `content-moderation/drops/${dropId}/reports`,
    body: request,
    errorMode: "structured",
  });

export const withdrawDropReport = (
  dropId: string
): Promise<ApiContentModerationReportWithdrawalResponse> =>
  commonApiDeleteWithResponse<ApiContentModerationReportWithdrawalResponse>({
    endpoint: `content-moderation/drops/${dropId}/reports/mine`,
    errorMode: "structured",
  });

export const fetchContentModeratorAccess = async (
  signal?: AbortSignal
): Promise<ApiContentModeratorAccess> => {
  const access = await commonApiFetch<ApiModerationAccess>({
    endpoint: "content-moderation/checks/access",
    ...(signal ? { signal } : {}),
    cache: "no-store",
    errorMode: "structured",
  });
  if (!access.developer)
    return {
      moderator: false,
      has_open_reports: false,
      open_report_count: 0,
      resolved_report_count: 0,
      suspended_profile_count: 0,
    };
  return commonApiFetch<ApiContentModeratorAccess>({
    endpoint: "content-moderation/moderator-access",
    ...(signal ? { signal } : {}),
    cache: "no-store",
    errorMode: "structured",
  });
};

export const fetchContentModerationBlockActivity = ({
  limit = 50,
  before,
  signal,
}: {
  readonly limit?: number | undefined;
  readonly before?: string | undefined;
  readonly signal?: AbortSignal;
} = {}): Promise<ApiContentModerationBlockActivityItem[]> =>
  commonApiFetch<
    ApiContentModerationBlockActivityItem[],
    Record<string, string>
  >({
    endpoint: "content-moderation/block-activity",
    params: {
      include_unblocks: "true",
      limit: String(limit),
      ...(before === undefined ? {} : { before }),
    },
    signal,
    cache: "no-store",
    errorMode: "structured",
  });

export const fetchMyContentModerationReports = ({
  limit = 50,
  before,
  signal,
}: {
  readonly limit?: number | undefined;
  readonly before?: string | undefined;
  readonly signal?: AbortSignal;
} = {}): Promise<ApiContentModerationUserReport[]> =>
  commonApiFetch<ApiContentModerationUserReport[], Record<string, string>>({
    endpoint: "content-moderation/reports/mine",
    params: {
      limit: String(limit),
      ...(before === undefined ? {} : { before }),
    },
    signal,
    cache: "no-store",
    errorMode: "structured",
  });

export const fetchContentModerationQueue = ({
  limit = 50,
  before,
  case_id,
  signal,
  view = "OPEN",
}: {
  readonly limit?: number | undefined;
  readonly before?: string | undefined;
  readonly case_id?: string | undefined;
  readonly signal?: AbortSignal;
  readonly view?: "OPEN" | "RESOLVED" | undefined;
} = {}): Promise<ApiContentModerationQueueItem[]> =>
  commonApiFetch<ApiContentModerationQueueItem[], Record<string, string>>({
    endpoint: "content-moderation/reports",
    params: {
      limit: String(limit),
      view,
      ...(case_id === undefined ? {} : { case_id }),
      ...(before === undefined ? {} : { before: String(before) }),
    },
    signal,
    cache: "no-store",
    errorMode: "structured",
  });

export const fetchSuspendedModerationProfiles = ({
  limit = 50,
  before,
  signal,
}: {
  readonly limit?: number | undefined;
  readonly before?: string | undefined;
  readonly signal?: AbortSignal;
} = {}): Promise<ApiContentModerationProfileListItem[]> =>
  commonApiFetch<ApiContentModerationProfileListItem[], Record<string, string>>(
    {
      endpoint: "content-moderation/profiles/suspended",
      params: {
        limit: String(limit),
        ...(before === undefined ? {} : { before: String(before) }),
      },
      signal,
      cache: "no-store",
      errorMode: "structured",
    }
  );

export const fetchPublicModeratedProfileStatus = (
  profileId: string
): Promise<ApiContentModerationProfileStatusResponse> =>
  commonApiFetch<ApiContentModerationProfileStatusResponse>({
    endpoint: `content-moderation/profiles/${profileId}/status`,
    errorMode: "structured",
  });
