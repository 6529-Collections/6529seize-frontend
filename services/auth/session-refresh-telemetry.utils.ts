import { bucketMs } from "@/utils/monitoring/mobileLaunchTimingBuckets";
import * as Sentry from "@sentry/nextjs";

export const SESSION_REFRESH_SIGNAL_NAME = "auth_session_refresh";

type SessionRefreshTelemetryClientType = "web" | "native" | "desktop";
type SessionRefreshTelemetryOutcome =
  | "started"
  | "success"
  | "unauthorized"
  | "aborted"
  | "network_error"
  | "backend_error"
  | "cooldown_used_empty"
  | "cooldown_used_rate_limit"
  | "cooldown_used_retry"
  | "deduped_in_flight";
type SessionRefreshTelemetryStatusBucket =
  | "not_applicable"
  | "aborted"
  | "network_error"
  | "unauthorized"
  | "http_401"
  | "http_4xx"
  | "http_5xx"
  | "http_other";
type SessionRefreshTelemetryAttrs = {
  readonly source: "refreshSessionV2";
  readonly refresh_source: "refreshSessionV2";
  readonly client_type: SessionRefreshTelemetryClientType;
  readonly refresh_client_type: SessionRefreshTelemetryClientType;
  readonly refresh_result: SessionRefreshTelemetryOutcome;
  readonly auth_refresh_outcome: SessionRefreshTelemetryOutcome;
  readonly outcome: SessionRefreshTelemetryOutcome;
  readonly refresh_status_bucket: SessionRefreshTelemetryStatusBucket;
  readonly refresh_status_code?: number;
  readonly status_code?: number;
  readonly refresh_duration_bucket_ms?: string;
  readonly duration_bucket_ms?: string;
};
type ApiStatusError = {
  readonly status?: unknown;
  readonly response?: {
    readonly status?: unknown;
  };
};

export function getSessionRefreshTelemetryTimestamp(): number {
  if (globalThis.performance?.now) {
    return globalThis.performance.now();
  }
  return Date.now();
}

function getKnownApiStatusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const statusError = error as ApiStatusError;
  const status = statusError.status ?? statusError.response?.status;
  return typeof status === "number" && Number.isInteger(status)
    ? status
    : undefined;
}

export function isUnauthorizedSessionRefreshError(error: unknown): boolean {
  return getKnownApiStatusCode(error) === 401;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

function isNetworkApiError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("network request failed") ||
    message.includes("network error") ||
    message.includes("failed to fetch") ||
    message.includes("load failed")
  );
}

function recordSessionRefreshTelemetry(
  attrs: SessionRefreshTelemetryAttrs
): void {
  try {
    if (
      attrs.outcome === "backend_error" ||
      attrs.outcome === "network_error"
    ) {
      Sentry.logger.warn(SESSION_REFRESH_SIGNAL_NAME, attrs);
      return;
    }

    Sentry.logger.info(SESSION_REFRESH_SIGNAL_NAME, attrs);
  } catch {
    // Telemetry must not affect auth state transitions.
  }
}

function getRefreshStatusBucket({
  outcome,
  statusCode,
}: {
  readonly outcome: SessionRefreshTelemetryOutcome;
  readonly statusCode?: number | undefined;
}): SessionRefreshTelemetryStatusBucket {
  if (statusCode === 401) {
    return "http_401";
  }
  if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
    return "http_4xx";
  }
  if (statusCode !== undefined && statusCode >= 500 && statusCode < 600) {
    return "http_5xx";
  }
  if (statusCode !== undefined) {
    return "http_other";
  }
  if (outcome === "network_error") {
    return "network_error";
  }
  if (outcome === "aborted") {
    return "aborted";
  }
  if (outcome === "unauthorized") {
    return "unauthorized";
  }
  return "not_applicable";
}

export function recordSessionRefreshOutcome({
  clientType,
  outcome,
  statusCode,
  startedAtMs,
}: {
  readonly clientType: SessionRefreshTelemetryClientType;
  readonly outcome: SessionRefreshTelemetryOutcome;
  readonly statusCode?: number | undefined;
  readonly startedAtMs?: number | undefined;
}): void {
  const durationBucketMs =
    startedAtMs !== undefined
      ? bucketMs(getSessionRefreshTelemetryTimestamp() - startedAtMs)
      : undefined;

  recordSessionRefreshTelemetry({
    source: "refreshSessionV2",
    refresh_source: "refreshSessionV2",
    client_type: clientType,
    refresh_client_type: clientType,
    refresh_result: outcome,
    auth_refresh_outcome: outcome,
    outcome,
    refresh_status_bucket: getRefreshStatusBucket({ outcome, statusCode }),
    ...(statusCode !== undefined ? { refresh_status_code: statusCode } : {}),
    ...(statusCode !== undefined ? { status_code: statusCode } : {}),
    ...(durationBucketMs !== undefined
      ? { refresh_duration_bucket_ms: durationBucketMs }
      : {}),
    ...(durationBucketMs !== undefined
      ? { duration_bucket_ms: durationBucketMs }
      : {}),
  });
}

export function recordSessionRefreshFailureOutcome({
  clientType,
  error,
  startedAtMs,
}: {
  readonly clientType: SessionRefreshTelemetryClientType;
  readonly error: unknown;
  readonly startedAtMs: number;
}): void {
  const statusCode = getKnownApiStatusCode(error);
  if (isUnauthorizedSessionRefreshError(error)) {
    recordSessionRefreshOutcome({
      clientType,
      outcome: "unauthorized",
      statusCode,
      startedAtMs,
    });
    return;
  }

  if (statusCode !== undefined) {
    recordSessionRefreshOutcome({
      clientType,
      outcome: "backend_error",
      statusCode,
      startedAtMs,
    });
    return;
  }

  if (isNetworkApiError(error)) {
    recordSessionRefreshOutcome({
      clientType,
      outcome: "network_error",
      startedAtMs,
    });
  }
}

export async function withSessionRefreshAbortTelemetry<T>({
  clientType,
  task,
}: {
  readonly clientType: SessionRefreshTelemetryClientType;
  readonly task: () => Promise<T>;
}): Promise<T> {
  try {
    return await task();
  } catch (error: unknown) {
    if (isAbortError(error)) {
      recordSessionRefreshOutcome({
        clientType,
        outcome: "aborted",
      });
    }
    throw error;
  }
}
