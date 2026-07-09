const SESSION_REFRESH_EMPTY_FAILURE_COOLDOWN_MS = 2000;
const SESSION_REFRESH_RETRY_COOLDOWN_MS = 250;
const SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS = 60 * 1000;

export type SessionRefreshFailureCooldownType =
  | "empty"
  | "retry"
  | "rate_limit";

type ApiStatusError = {
  readonly status?: unknown;
  readonly response?: {
    readonly status?: unknown;
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

export function getRateLimitCooldownMs(): number {
  return SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS;
}
