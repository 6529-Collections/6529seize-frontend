const SESSION_REFRESH_RETRY_COOLDOWN_MS = 250;
const SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS = 60 * 1000;
// Invalid sessions require user action; successful auth persistence clears this block.
const SESSION_REFRESH_INVALID_SESSION_COOLDOWN_MS = Number.POSITIVE_INFINITY;

export type SessionRefreshFailureCooldownType =
  | "empty"
  | "retry"
  | "rate_limit";

type ApiStatusError = {
  readonly status?: unknown;
  readonly headers?: Headers;
  readonly response?: {
    readonly status?: unknown;
    readonly headers?: Headers;
    readonly body?: unknown;
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
    return SESSION_REFRESH_INVALID_SESSION_COOLDOWN_MS;
  }

  if (type === "rate_limit") {
    return SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS;
  }

  return SESSION_REFRESH_RETRY_COOLDOWN_MS;
}

export class SessionRefreshRateLimitError extends Error {
  readonly status = 429;
  constructor(readonly retryAtMs: number) {
    super("Session refresh is temporarily busy. Please try again shortly.");
    this.name = "SessionRefreshRateLimitError";
  }
}

export function getRateLimitCooldownMs(error?: unknown): number {
  if (error instanceof SessionRefreshRateLimitError) {
    return Math.min(
      SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS,
      Math.max(0, error.retryAtMs - Date.now())
    );
  }
  if (typeof error !== "object" || error === null) {
    return SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS;
  }
  const apiError = error as ApiStatusError;
  const retryAfter = (apiError.headers ?? apiError.response?.headers)?.get(
    "Retry-After"
  );
  if (retryAfter) {
    const seconds = /^\d+$/.test(retryAfter) ? Number(retryAfter) : null;
    const delay =
      seconds === null ? Date.parse(retryAfter) - Date.now() : seconds * 1000;
    if (Number.isFinite(delay) && delay >= 0)
      return Math.min(delay, SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS);
  }
  let body = apiError.response?.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body) as unknown;
    } catch {
      body = null;
    }
  }
  if (
    typeof body === "object" &&
    body !== null &&
    "retryAfter" in body &&
    typeof body.retryAfter === "number" &&
    Number.isFinite(body.retryAfter) &&
    body.retryAfter >= 0
  ) {
    return Math.min(
      body.retryAfter * 1000,
      SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS
    );
  }
  return SESSION_REFRESH_RATE_LIMIT_COOLDOWN_MS;
}
