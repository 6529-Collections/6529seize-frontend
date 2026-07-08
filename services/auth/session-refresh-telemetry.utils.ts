import { bucketMs } from "@/utils/monitoring/mobileLaunchTimingBuckets";
import * as Sentry from "@sentry/nextjs";

type SessionRefreshTelemetryClientType = "web" | "native" | "desktop";
type SessionRefreshTelemetryOutcome =
  | "started"
  | "success"
  | "unauthorized"
  | "aborted"
  | "network_error"
  | "backend_error"
  | "cooldown_used_empty"
  | "cooldown_used_retry"
  | "deduped_in_flight";
type SessionRefreshTelemetryAttrs = {
  readonly source: "refreshSessionV2";
  readonly client_type: SessionRefreshTelemetryClientType;
  readonly auth_refresh_outcome: SessionRefreshTelemetryOutcome;
  readonly outcome: SessionRefreshTelemetryOutcome;
  readonly status_code?: number;
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
      Sentry.logger.warn("auth_session_refresh", attrs);
      return;
    }

    Sentry.logger.info("auth_session_refresh", attrs);
  } catch {
    // Telemetry must not affect auth state transitions.
  }
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
  recordSessionRefreshTelemetry({
    source: "refreshSessionV2",
    client_type: clientType,
    auth_refresh_outcome: outcome,
    outcome,
    ...(statusCode !== undefined ? { status_code: statusCode } : {}),
    ...(startedAtMs !== undefined
      ? {
          duration_bucket_ms: bucketMs(
            getSessionRefreshTelemetryTimestamp() - startedAtMs
          ),
        }
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
