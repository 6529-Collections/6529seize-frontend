import type { ApiMonitoringSentryOverview } from "@/generated/models/ApiMonitoringSentryOverview";
import type { ApiMonitoringAccess } from "@/generated/models/ApiMonitoringAccess";
import type { ApiMonitoringSentryHistory } from "@/generated/models/ApiMonitoringSentryHistory";
import { commonApiFetch } from "./common-api";

export const fetchMonitoringAccess = (
  signal?: AbortSignal
): Promise<ApiMonitoringAccess> =>
  commonApiFetch<ApiMonitoringAccess>({
    endpoint: "monitoring/access",
    ...(signal ? { signal } : {}),
    cache: "no-store",
    errorMode: "structured",
  });

export const fetchMonitoringSentryOverview = (
  signal?: AbortSignal
): Promise<ApiMonitoringSentryOverview> =>
  commonApiFetch<ApiMonitoringSentryOverview>({
    endpoint: "monitoring/sentry",
    ...(signal ? { signal } : {}),
    cache: "no-store",
    errorMode: "structured",
  });

export const fetchMonitoringSentryHistory = (
  signal?: AbortSignal
): Promise<ApiMonitoringSentryHistory> =>
  commonApiFetch<ApiMonitoringSentryHistory>({
    endpoint: "monitoring/sentry/history",
    ...(signal ? { signal } : {}),
    cache: "no-store",
    errorMode: "structured",
  });
