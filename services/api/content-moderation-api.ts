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
import type { ApiModerationAccess } from "@/generated/models/ApiModerationAccess";
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

export const blockProfile = (profileId: string): Promise<void> =>
  commonApiPut<Record<string, never>, unknown>({
    endpoint: `content-moderation/profiles/${profileId}/block`,
    body: {},
  }).then(() => undefined);

export const unblockProfile = (profileId: string): Promise<void> =>
  commonApiDelete({
    endpoint: `content-moderation/profiles/${profileId}/block`,
    errorMode: "structured",
  });

export const hideDrop = (dropId: string): Promise<void> =>
  commonApiPut<Record<string, never>, unknown>({
    endpoint: `content-moderation/drops/${dropId}/hide`,
    body: {},
  }).then(() => undefined);

export const unhideDrop = (dropId: string): Promise<void> =>
  commonApiDelete({
    endpoint: `content-moderation/drops/${dropId}/hide`,
    errorMode: "structured",
  });

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
}: {
  readonly limit?: number | undefined;
  readonly before?: string | undefined;
} = {}): Promise<ApiContentModerationUserReport[]> =>
  commonApiFetch<ApiContentModerationUserReport[], Record<string, string>>({
    endpoint: "content-moderation/reports/mine",
    params: {
      limit: String(limit),
      ...(before === undefined ? {} : { before }),
    },
    errorMode: "structured",
  });

export const fetchContentModerationQueue = ({
  limit = 50,
  before,
  signal,
  view = "OPEN",
}: {
  readonly limit?: number | undefined;
  readonly before?: string | undefined;
  readonly signal?: AbortSignal;
  readonly view?: "OPEN" | "RESOLVED" | undefined;
} = {}): Promise<ApiContentModerationQueueItem[]> =>
  commonApiFetch<ApiContentModerationQueueItem[], Record<string, string>>({
    endpoint: "content-moderation/reports",
    params: {
      limit: String(limit),
      view,
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
