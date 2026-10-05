import {
  getAuthJwt,
  getWalletAddress,
  getWalletRole,
  hasActiveSessionV2Auth,
  isAuthJwtUsable,
} from "./auth.utils";
import { persistSessionResponse, refreshSessionV2 } from "./session-v2.utils";
import {
  createAbortError,
  withSessionRefreshAbort,
  waitForSessionRefreshRetryCooldown,
} from "./session-refresh-coordination.utils";
import { jwtDecode } from "jwt-decode";
import {
  installSessionRecoveryHandler,
  type SessionRecoveryOptions,
} from "./session-recovery-handler";
import {
  getRateLimitCooldownMs,
  isRateLimitError,
} from "./session-refresh-rate-limit.utils";

const pendingSessions = new Map<string, Promise<string>>();
const PROACTIVE_SESSION_MAX_AGE_SECONDS = 60 * 60;

function needsProactiveRefresh(
  jwt: string | null,
  nowSeconds: number
): boolean {
  if (!jwt) return true;
  const { iat } = jwtDecode<{ iat?: number }>(jwt);
  // Access tokens can outlive refresh sessions. Keep active sessions renewed
  // without making protected requests wait while their JWT is still usable.
  return (
    typeof iat === "number" &&
    nowSeconds - iat >= PROACTIVE_SESSION_MAX_AGE_SECONDS
  );
}

export class SessionRecoveryError extends Error {
  readonly status: number;
  constructor(
    readonly terminal: boolean,
    options?: ErrorOptions
  ) {
    super(
      terminal
        ? "Your session has expired. Reconnect your wallet."
        : "Couldn't refresh your session. Please try again shortly.",
      options
    );
    this.name = "SessionRecoveryError";
    this.status = terminal ? 401 : 503;
  }
}

async function recoverSession(
  address: string,
  initialJwt: string | null
): Promise<string> {
  const role = getWalletRole() ?? null;
  const isCurrent = () =>
    getWalletAddress()?.toLowerCase() === address &&
    getAuthJwt() === initialJwt &&
    (getWalletRole() ?? null) === role &&
    hasActiveSessionV2Auth({ address });
  try {
    const response = await refreshWithRateLimitRetry(address, isCurrent);
    if (!isCurrent()) {
      const current = getAuthJwt();
      if (
        getWalletAddress()?.toLowerCase() === address &&
        isAuthJwtUsable(current) &&
        (getWalletRole() ?? null) === role
      )
        return current!;
      throw createAbortError();
    }
    if (!response) throw new SessionRecoveryError(true);
    const payload = jwtDecode<{ sub: string; role?: string }>(
      response.access_token
    );
    if (
      response.address.toLowerCase() !== address ||
      payload.sub.toLowerCase() !== address ||
      (payload.role === "" ? null : (payload.role ?? null)) !== role ||
      !isAuthJwtUsable(response.access_token)
    ) {
      throw new SessionRecoveryError(true);
    }
    if (
      !(await persistSessionResponse(response, { shouldPersist: isCurrent }))
    ) {
      throw new SessionRecoveryError(false);
    }
    return response.access_token;
  } catch (error) {
    if (
      error instanceof SessionRecoveryError ||
      (error instanceof Error && error.name === "AbortError")
    )
      throw error;
    throw new SessionRecoveryError(false, { cause: error });
  }
}

async function refreshWithRateLimitRetry(
  address: string,
  isCurrent: () => boolean
) {
  try {
    return await refreshSessionV2({ address });
  } catch (error) {
    if (!isRateLimitError(error)) throw error;
    await waitForSessionRefreshRetryCooldown({
      cooldown: {
        expiresAtMs: Date.now() + getRateLimitCooldownMs(error),
      },
    });
    if (!isCurrent()) throw createAbortError();
    return refreshSessionV2({ address });
  }
}

/** Returns immediately for a usable token; all expired-token callers share renewal. */
export async function ensureActiveSession({
  signal,
  force = false,
  renewBeforeSeconds = 0,
}: SessionRecoveryOptions = {}): Promise<string | null> {
  if (signal?.aborted) throw createAbortError();
  const address = getWalletAddress()?.toLowerCase();
  const jwt = getAuthJwt();
  if (!address || !hasActiveSessionV2Auth({ address })) return jwt;
  const nowSeconds = Date.now() / 1000;
  if (
    !force &&
    isAuthJwtUsable(jwt, nowSeconds + renewBeforeSeconds) &&
    (renewBeforeSeconds === 0 || !needsProactiveRefresh(jwt, nowSeconds))
  )
    return jwt;
  const key = JSON.stringify([address, jwt]);
  let pending = pendingSessions.get(key);
  if (!pending) {
    pending = recoverSession(address, jwt);
    pendingSessions.set(key, pending);
    const current = pending;
    void pending
      .finally(() => {
        if (pendingSessions.get(key) === current) pendingSessions.delete(key);
      })
      .catch(() => undefined);
  }
  return signal
    ? withSessionRefreshAbort({ abortSignal: signal, task: () => pending })
    : pending;
}

installSessionRecoveryHandler(ensureActiveSession);
