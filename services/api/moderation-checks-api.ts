import type { ApiModerationCheck } from "@/generated/models/ApiModerationCheck";
import type { ApiModerationCheckDetail } from "@/generated/models/ApiModerationCheckDetail";
import type { ApiModerationCheckPage } from "@/generated/models/ApiModerationCheckPage";
import type { ApiModerationCounts } from "@/generated/models/ApiModerationCounts";
import type { ApiModerationActionRequest } from "@/generated/models/ApiModerationActionRequest";
import { commonApiFetch, commonApiPost } from "./common-api";

export interface ModerationCheckFilters {
  subject_type?: ApiModerationCheck["subject_type"];
  outcome?: ApiModerationCheck["outcome"];
  policy_family?: ApiModerationCheck["policy_family"];
  review_status?: ApiModerationCheck["review_status"];
  trigger?: string;
  from?: number;
  to?: number;
  profile_id?: string;
  subject_id?: string;
}

export const fetchModerationChecks = (
  filters: ModerationCheckFilters,
  before: string | undefined,
  signal: AbortSignal
): Promise<ApiModerationCheckPage> =>
  commonApiFetch({
    endpoint: "content-moderation/checks",
    params: Object.fromEntries(
      Object.entries({ ...filters, before, limit: 30 })
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    ),
    signal,
    cache: "no-store",
    errorMode: "structured",
  });

export const fetchModerationCounts = (
  signal: AbortSignal
): Promise<ApiModerationCounts> =>
  commonApiFetch({
    endpoint: "content-moderation/checks/counts",
    signal,
    cache: "no-store",
    errorMode: "structured",
  });

export const fetchModerationCheck = (
  id: string,
  signal: AbortSignal
): Promise<ApiModerationCheckDetail> =>
  commonApiFetch({
    endpoint: `content-moderation/checks/${encodeURIComponent(id)}`,
    signal,
    cache: "no-store",
    errorMode: "structured",
  });

export const fetchModerationReportCheck = (
  id: string,
  signal: AbortSignal
): Promise<ApiModerationCheckDetail> =>
  commonApiFetch({
    endpoint: `content-moderation/checks/report/${encodeURIComponent(id)}`,
    signal,
    cache: "no-store",
    errorMode: "structured",
  });

export const fetchModerationProfileCheck = (
  id: string,
  signal: AbortSignal
): Promise<ApiModerationCheckDetail> =>
  commonApiFetch({
    endpoint: `content-moderation/checks/profile/${encodeURIComponent(id)}`,
    signal,
    cache: "no-store",
    errorMode: "structured",
  });

export const applyModerationAction = (
  id: string,
  body: ApiModerationActionRequest
): Promise<ApiModerationCheckDetail> =>
  commonApiPost({
    endpoint: `content-moderation/checks/${encodeURIComponent(id)}/actions`,
    body,
    errorMode: "structured",
  });
