const SESSION_REFRESH_EMPTY_FAILURE_COOLDOWN_MS = 2000;
const SESSION_REFRESH_RETRY_COOLDOWN_MS = 250;
const SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS = 60 * 1000;

export type SessionRefreshFailureCooldownType =
  | "empty"
  | "retry"
  | "rate_limit";

type ApiStatusError = {
  readonly status?: unknown;
  readonly headers?: {
    get(name: string): string | null;
  };
  readonly response?: {
    readonly status?: unknown;
    readonly headers?: {
      get(name: string): string | null;
    };
  };
};

function getApiErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const statusError = error as ApiStatusError;
  const status = statusError.status ?? statusError.response?.status;
  return typeof status === "number" && Number.isInteger(status) ? status : null;
}

export function isRateLimitError(error: unknown): boolean {
  return getApiErrorStatus(error) === 429;
}

export function getSessionRefreshFailureCooldownMs(
  type: SessionRefreshFailureCooldownType,
  cooldownMsOverride?: number
): number {
  if (cooldownMsOverride !== undefined) {
    return cooldownMsOverride;
  }

  if (type === "empty") {
    return SESSION_REFRESH_EMPTY_FAILURE_COOLDOWN_MS;
  }

  if (type === "rate_limit") {
    return SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS;
  }

  return SESSION_REFRESH_RETRY_COOLDOWN_MS;
}

function getRetryAfterHeader(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const statusError = error as ApiStatusError;
  return (
    statusError.response?.headers?.get("Retry-After") ??
    statusError.response?.headers?.get("retry-after") ??
    statusError.headers?.get("Retry-After") ??
    statusError.headers?.get("retry-after") ??
    null
  );
}

export function getRateLimitCooldownMs(error: unknown): number {
  const retryAfter = getRetryAfterHeader(error);
  if (!retryAfter) {
    return SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS;
  }

  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.max(1000, retryAfterSeconds * 1000);
  }

  const retryAfterDateMs = Date.parse(retryAfter);
  if (Number.isFinite(retryAfterDateMs)) {
    return Math.max(1000, retryAfterDateMs - Date.now());
  }

  return SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS;
}
