import type { ApiE2eeReportHoldRequest } from "@/generated/models/ApiE2eeReportHoldRequest";
import type { ApiE2eeTrustAndSafetyReport } from "@/generated/models/ApiE2eeTrustAndSafetyReport";
import type { ApiE2eeTrustAndSafetyReportPage } from "@/generated/models/ApiE2eeTrustAndSafetyReportPage";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

/**
 * Moderator review of reported encrypted messages (the backend's
 * trust-and-safety routes). Every list, read and hold change is written to
 * the backend's access log, so nothing here prefetches or retries reads.
 */

export interface E2eeReportsCursor {
  readonly before: number;
  readonly beforeId: string;
}

export const fetchE2eeReports = ({
  limit = 50,
  cursor,
  signal,
}: {
  readonly limit?: number | undefined;
  readonly cursor?: E2eeReportsCursor | undefined;
  readonly signal?: AbortSignal;
} = {}): Promise<ApiE2eeTrustAndSafetyReportPage> =>
  commonApiFetch<ApiE2eeTrustAndSafetyReportPage, Record<string, string>>({
    endpoint: "e2ee/trust-and-safety/reports",
    params: {
      limit: String(limit),
      ...(cursor === undefined
        ? {}
        : { before: String(cursor.before), before_id: cursor.beforeId }),
    },
    signal,
    cache: "no-store",
    errorMode: "structured",
  });

export const fetchE2eeReport = (
  reportId: string,
  signal?: AbortSignal
): Promise<ApiE2eeTrustAndSafetyReport> =>
  commonApiFetch<ApiE2eeTrustAndSafetyReport>({
    endpoint: `e2ee/trust-and-safety/reports/${encodeURIComponent(reportId)}`,
    signal,
    cache: "no-store",
    errorMode: "structured",
  });

export const setE2eeReportHold = (
  reportId: string,
  onHold: boolean
): Promise<ApiE2eeTrustAndSafetyReport> =>
  commonApiPost<ApiE2eeReportHoldRequest, ApiE2eeTrustAndSafetyReport>({
    endpoint: `e2ee/trust-and-safety/reports/${encodeURIComponent(reportId)}/hold`,
    body: { on_hold: onHold },
    errorMode: "structured",
  });
