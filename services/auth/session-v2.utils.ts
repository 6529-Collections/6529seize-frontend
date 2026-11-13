import { queueNativePushLogout } from "@/services/notifications/push-installation";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { getAuthJwt, setAuthJwt } from "./auth.utils";
import { getSessionClientType } from "./session-client-type";
import {
  parseDesktopSessionResponse,
  requireDesktopNativeAuthMethod,
} from "./desktop-native-auth";
import {
  getNativeRefreshToken,
  getNativeRefreshRequestId,
  persistRotatedNativeRefreshToken,
  removeNativeRefreshToken,
} from "./native-refresh-token-storage";
import {
  assertSessionPersistenceIsCurrent,
  persistNativeRefreshTokenIfNeeded,
  type PersistSessionResponseOptions,
} from "./session-persistence.utils";
import {
  getSessionRefreshTelemetryTimestamp,
  isUnauthorizedSessionRefreshError,
  recordSessionRefreshFailureOutcome,
  recordSessionRefreshOutcome,
  withSessionRefreshAbortTelemetry,
} from "./session-refresh-telemetry.utils";
import {
  getRateLimitCooldownMs,
  getSessionRefreshFailureCooldownMs,
  isRateLimitError,
  SessionRefreshRateLimitError,
  type SessionRefreshFailureCooldownType,
} from "./session-refresh-rate-limit.utils";
import {
  createAbortError,
  createSessionRefreshEntry,
  getSessionRefreshKey,
  isAbortError,
  waitForSessionRefreshRetryCooldown,
  withCrossTabWebSessionRefreshLock,
  withSessionRefreshAbort,
  type AuthSessionClientType,
  type SessionRefreshEntry,
} from "./session-refresh-coordination.utils";
import type {
  RefreshTokenSessionClientType,
  SessionLoginRequest,
  SessionNativeResponse,
  SessionNonceDeviceGrantParams,
  SessionWebResponse,
} from "./session-v2.types";

export { getSessionClientType } from "./session-client-type";
export {
  createConnectionShare,
  createLegacyDesktopConnectionShare,
  redeemConnectionShare,
} from "./connection-share.utils";

type SessionLoginResponse = SessionWebResponse | SessionNativeResponse;
type SessionRefreshResponse = SessionWebResponse | SessionNativeResponse;
type SessionRefreshFailureCooldown = {
  readonly type: SessionRefreshFailureCooldownType;
  readonly expiresAtMs: number;
};
type SessionRefreshInFlight =
  SessionRefreshEntry<SessionRefreshResponse | null>;

const sessionRefreshInFlight = new Map<string, SessionRefreshInFlight>();
const persistedNativeRefreshResponses = new WeakSet<SessionRefreshResponse>();
const refreshedResponses = new WeakSet<SessionRefreshResponse>();
const sessionRefreshFailureCooldowns = new Map<
  string,
  SessionRefreshFailureCooldown
>();

function getActiveFailureCooldown(
  key: string
): SessionRefreshFailureCooldown | null {
  const cooldown = sessionRefreshFailureCooldowns.get(key);
  if (!cooldown) {
    return null;
  }

  if (cooldown.expiresAtMs <= Date.now()) {
    sessionRefreshFailureCooldowns.delete(key);
    return null;
  }

  return cooldown;
}

function rememberSessionRefreshFailure(
  key: string,
  type: SessionRefreshFailureCooldownType,
  cooldownMsOverride?: number
): void {
  sessionRefreshFailureCooldowns.set(key, {
    type,
    expiresAtMs:
      Date.now() + getSessionRefreshFailureCooldownMs(type, cooldownMsOverride),
  });
}

function clearSessionRefreshFailure(key: string): void {
  sessionRefreshFailureCooldowns.delete(key);
}

function clearSessionRefreshFailureForSession(
  response: SessionLoginResponse | SessionRefreshResponse
): void {
  clearSessionRefreshFailure(
    getSessionRefreshKey({
      address: response.address,
      clientType: response.client_type,
    })
  );
}

function settleSessionRefreshConsumer(
  entry: SessionRefreshInFlight,
  key: string
): void {
  entry.activeConsumers = Math.max(0, entry.activeConsumers - 1);
  // Native callers cannot cancel rotation before its credential is persisted.
  // Desktop refresh rotates in the shell, which stores the new credential
  // itself, so it also runs to completion. Web cookies are transport-owned and
  // retain their existing lock cancellation.
  if (
    key.startsWith("web:") &&
    entry.activeConsumers === 0 &&
    sessionRefreshInFlight.get(key) === entry
  ) {
    sessionRefreshInFlight.delete(key);
    entry.controller.abort();
  }
}

async function withCallerAbort<T>({
  entry,
  key,
  abortSignal,
}: {
  readonly entry: SessionRefreshInFlight;
  readonly key: string;
  readonly abortSignal?: AbortSignal | undefined;
}): Promise<T> {
  if (!abortSignal) {
    return (await entry.promise) as T;
  }

  if (abortSignal.aborted) {
    settleSessionRefreshConsumer(entry, key);
    throw createAbortError();
  }

  let didSettle = false;
  return await new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      if (didSettle) {
        return;
      }
      didSettle = true;
      abortSignal.removeEventListener("abort", onAbort);
      settleSessionRefreshConsumer(entry, key);
      reject(createAbortError());
    };

    abortSignal.addEventListener("abort", onAbort, { once: true });
    void entry.promise
      .then((value) => {
        if (didSettle) {
          return;
        }
        didSettle = true;
        abortSignal.removeEventListener("abort", onAbort);
        resolve(value as T);
      })
      .catch((error: unknown) => {
        if (didSettle) {
          return;
        }
        didSettle = true;
        abortSignal.removeEventListener("abort", onAbort);
        reject(error);
      });
  });
}

function getSessionCredentialsMode(): RequestCredentials {
  return "include";
}

async function rollbackUnpersistedSession(
  response: SessionLoginResponse | SessionRefreshResponse,
  didPersistNativeRefreshToken: boolean
): Promise<void> {
  try {
    if (didPersistNativeRefreshToken || response.client_type === "web") {
      await logoutSessionV2({ address: response.address });
    }
  } catch {
    // Best-effort cleanup: preserve the original persistence result/error.
  }
  if (didPersistNativeRefreshToken) {
    try {
      await removeNativeRefreshToken(response.address);
    } catch {
      // Preserve the original persistence result/error.
    }
  }
}

export async function getSessionNonce({
  signerAddress,
  deviceGrant,
}: {
  readonly signerAddress: string;
  readonly deviceGrant?: SessionNonceDeviceGrantParams | undefined;
}): Promise<ApiSessionNonceResponse> {
  const clientType = getSessionClientType();
  // Only web (SIWE) challenges can carry a device grant.
  const deviceGrantParams =
    deviceGrant && clientType === "web" ? deviceGrant : {};
  return await commonApiFetch<
    ApiSessionNonceResponse,
    {
      readonly signer_address: string;
      readonly client_type: AuthSessionClientType;
      readonly chain_id: string;
    } & Partial<SessionNonceDeviceGrantParams>
  >({
    endpoint: "auth/session-nonce",
    params: {
      signer_address: signerAddress,
      client_type: clientType,
      chain_id: "1",
      ...deviceGrantParams,
    },
    errorMode: "structured",
  });
}

export async function loginWithSessionV2({
  serverSignature,
  clientSignature,
  signerAddress,
  role,
  deviceLabel,
}: {
  readonly serverSignature: string;
  readonly clientSignature: string;
  readonly signerAddress: string;
  readonly role: string | null;
  readonly deviceLabel?: string | undefined;
}): Promise<SessionLoginResponse> {
  if (getSessionClientType() === "desktop") {
    // The desktop shell calls the API itself and keeps the refresh token.
    const sessionLogin = requireDesktopNativeAuthMethod("sessionLogin");
    const desktopResponse = parseDesktopSessionResponse(
      "sessionLogin",
      await sessionLogin({
        client_type: "desktop",
        server_signature: serverSignature,
        client_signature: clientSignature,
        client_address: signerAddress,
        ...(role === null ? {} : { role }),
      })
    );
    clearSessionRefreshFailureForSession(desktopResponse);
    return desktopResponse;
  }

  const response = await commonApiPost<
    SessionLoginRequest,
    SessionLoginResponse
  >({
    endpoint: "auth/session-login",
    body: {
      client_type: getSessionClientType(),
      server_signature: serverSignature,
      client_signature: clientSignature,
      client_address: signerAddress,
      ...(role === null ? {} : { role }),
      ...(deviceLabel ? { device_label: deviceLabel } : {}),
    },
    credentials: getSessionCredentialsMode(),
    errorMode: "structured",
  });
  clearSessionRefreshFailureForSession(response);
  return response;
}

async function executeSessionRefreshV2({
  address,
  abortSignal,
  clientType,
  refreshKey,
}: {
  readonly address: string;
  readonly abortSignal: AbortSignal;
  readonly clientType: AuthSessionClientType;
  readonly refreshKey: string;
}): Promise<SessionRefreshResponse | null> {
  if (clientType === "desktop") {
    return await executeDesktopSessionRefresh({ address, abortSignal });
  }

  if (clientType !== "web") {
    const nativeRefreshToken = await getNativeRefreshToken(address);
    if (abortSignal.aborted) {
      throw createAbortError();
    }
    if (!nativeRefreshToken) {
      recordSessionRefreshOutcome({
        clientType,
        outcome: "unauthorized",
      });
      return null;
    }

    const refreshRequestId = await getNativeRefreshRequestId(
      address,
      nativeRefreshToken
    );
    const response = await executeSessionRefreshRequest({
      abortSignal,
      clientType,
      request: () =>
        commonApiPost<
          {
            readonly client_type: RefreshTokenSessionClientType;
            readonly client_address: string;
            readonly native_refresh_token: string;
            readonly refresh_request_id: string;
          },
          SessionNativeResponse
        >({
          endpoint: "auth/session-refresh",
          body: {
            client_type: clientType,
            client_address: address,
            native_refresh_token: nativeRefreshToken,
            refresh_request_id: refreshRequestId,
          },
          signal: abortSignal,
          credentials: getSessionCredentialsMode(),
          errorMode: "structured",
          includeWalletAuth: false,
        }),
    });
    if (response) {
      if (response.address.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Session refresh returned a different wallet");
      }
      await persistRotatedNativeRefreshToken(
        address,
        nativeRefreshToken,
        response.native_refresh_token
      );
      persistedNativeRefreshResponses.add(response);
    }
    return response;
  }

  return await withCrossTabWebSessionRefreshLock({
    refreshKey,
    abortSignal,
    task: async () =>
      await executeSessionRefreshRequest({
        abortSignal,
        clientType,
        request: () =>
          commonApiPost<
            {
              readonly client_type: "web";
              readonly client_address: string;
            },
            SessionWebResponse
          >({
            endpoint: "auth/session-refresh",
            body: {
              client_type: "web",
              client_address: address,
            },
            signal: abortSignal,
            credentials: getSessionCredentialsMode(),
            errorMode: "structured",
            includeWalletAuth: false,
          }),
      }),
  });
}

/** Desktop refresh runs in the shell, which holds the refresh token. */
async function executeDesktopSessionRefresh({
  address,
  abortSignal,
}: {
  readonly address: string;
  readonly abortSignal: AbortSignal;
}): Promise<SessionNativeResponse | null> {
  const sessionRefresh = requireDesktopNativeAuthMethod("sessionRefresh");
  const response = await executeSessionRefreshRequest({
    abortSignal,
    clientType: "desktop",
    request: async () =>
      parseDesktopSessionResponse(
        "sessionRefresh",
        await sessionRefresh({
          client_type: "desktop",
          client_address: address,
        })
      ),
  });
  if (response && response.address.toLowerCase() !== address.toLowerCase()) {
    throw new Error("Session refresh returned a different wallet");
  }
  return response;
}

async function executeSessionRefreshRequest<T extends SessionRefreshResponse>({
  abortSignal,
  clientType,
  request,
}: {
  readonly abortSignal: AbortSignal;
  readonly clientType: AuthSessionClientType;
  readonly request: () => Promise<T>;
}): Promise<T | null> {
  const startedAtMs = getSessionRefreshTelemetryTimestamp();
  recordSessionRefreshOutcome({
    clientType,
    outcome: "started",
  });

  try {
    const response = await withSessionRefreshAbort({
      abortSignal,
      task: request,
    });
    refreshedResponses.add(response);
    recordSessionRefreshOutcome({
      clientType,
      outcome: "success",
      startedAtMs,
    });
    return response;
  } catch (error: unknown) {
    recordSessionRefreshFailureOutcome({
      clientType,
      error,
      startedAtMs,
    });

    if (isUnauthorizedSessionRefreshError(error)) {
      return null;
    }
    throw error;
  }
}

export async function refreshSessionV2({
  address,
  abortSignal,
}: {
  readonly address: string;
  readonly abortSignal?: AbortSignal | undefined;
}): Promise<SessionRefreshResponse | null> {
  const clientType = getSessionClientType();
  if (abortSignal?.aborted) {
    recordSessionRefreshOutcome({
      clientType,
      outcome: "aborted",
    });
    throw createAbortError();
  }

  const key = getSessionRefreshKey({ address, clientType });
  const cooldown = getActiveFailureCooldown(key);

  if (cooldown?.type === "empty" || cooldown?.type === "rate_limit") {
    recordSessionRefreshOutcome({
      clientType,
      outcome:
        cooldown.type === "empty"
          ? "cooldown_used_empty"
          : "cooldown_used_rate_limit",
    });
    if (cooldown.type === "rate_limit") {
      throw new SessionRefreshRateLimitError(cooldown.expiresAtMs);
    }
    return null;
  }
  if (cooldown?.type === "retry") {
    recordSessionRefreshOutcome({
      clientType,
      outcome: "cooldown_used_retry",
    });
    await withSessionRefreshAbortTelemetry({
      clientType,
      task: () => waitForSessionRefreshRetryCooldown({ cooldown, abortSignal }),
    });
    if (sessionRefreshFailureCooldowns.get(key) === cooldown) {
      sessionRefreshFailureCooldowns.delete(key);
    }
  }

  let existingEntry = sessionRefreshInFlight.get(key);
  if (existingEntry?.controller.signal.aborted) {
    sessionRefreshInFlight.delete(key);
    existingEntry = undefined;
  }

  if (existingEntry) {
    existingEntry.activeConsumers += 1;
    recordSessionRefreshOutcome({
      clientType,
      outcome: "deduped_in_flight",
    });
    return await withSessionRefreshAbortTelemetry({
      clientType,
      task: () =>
        withCallerAbort<SessionRefreshResponse | null>({
          entry: existingEntry,
          key,
          abortSignal,
        }),
    });
  }

  const entry = createSessionRefreshEntry((signal) =>
    executeSessionRefreshV2({
      address,
      abortSignal: signal,
      clientType,
      refreshKey: key,
    })
  );
  sessionRefreshInFlight.set(key, entry);

  void (async () => {
    try {
      const response = await entry.promise;
      if (sessionRefreshInFlight.get(key) !== entry) {
        return;
      }
      if (response) {
        clearSessionRefreshFailure(key);
        return;
      }

      rememberSessionRefreshFailure(key, "empty");
    } catch (error: unknown) {
      if (sessionRefreshInFlight.get(key) !== entry) {
        return;
      }
      if (isAbortError(error)) {
        return;
      }
      if (isRateLimitError(error)) {
        rememberSessionRefreshFailure(
          key,
          "rate_limit",
          getRateLimitCooldownMs(error)
        );
        return;
      }
      rememberSessionRefreshFailure(key, "retry");
    } finally {
      if (sessionRefreshInFlight.get(key) === entry) {
        sessionRefreshInFlight.delete(key);
      }
    }
  })();

  return await withSessionRefreshAbortTelemetry({
    clientType,
    task: () =>
      withCallerAbort<SessionRefreshResponse | null>({
        entry,
        key,
        abortSignal,
      }),
  });
}

export function __resetSessionRefreshStateForTests(): void {
  for (const entry of sessionRefreshInFlight.values()) {
    entry.controller.abort();
  }
  sessionRefreshInFlight.clear();
  sessionRefreshFailureCooldowns.clear();
}

export async function persistSessionResponse(
  response: SessionLoginResponse | SessionRefreshResponse,
  options: PersistSessionResponseOptions = {}
): Promise<boolean> {
  if (
    persistedNativeRefreshResponses.has(response) &&
    response.client_type !== "web"
  ) {
    let currentToken: string | null;
    try {
      currentToken = await getNativeRefreshToken(response.address);
    } catch {
      // Storage availability is transient; retain the saved session and let
      // callers report that access-token persistence could not finish.
      return false;
    }
    if (currentToken !== response.native_refresh_token)
      throw createAbortError();
  }
  const nativeRefreshTokenResult = persistedNativeRefreshResponses.has(response)
    ? "not-required"
    : await persistNativeRefreshTokenIfNeeded(response, options);
  if (nativeRefreshTokenResult === "unavailable") {
    return false;
  }
  const didPersistNativeRefreshToken = nativeRefreshTokenResult === "persisted";

  let didPersistAuth = false;
  try {
    assertSessionPersistenceIsCurrent(options);
    didPersistAuth = setAuthJwt(
      response.address,
      response.access_token,
      null,
      response.role ?? undefined,
      { authSessionVersion: "v2" }
    );
  } catch (error) {
    if (!refreshedResponses.has(response)) {
      await rollbackUnpersistedSession(response, didPersistNativeRefreshToken);
    }
    throw error;
  }

  if (didPersistAuth) {
    clearSessionRefreshFailureForSession(response);
    return true;
  }

  if (!refreshedResponses.has(response)) {
    await rollbackUnpersistedSession(response, didPersistNativeRefreshToken);
  }
  return false;
}

export async function verifyActiveSessionV2WebSession({
  address,
  abortSignal,
}: {
  readonly address: string;
  readonly abortSignal?: AbortSignal | undefined;
}): Promise<boolean> {
  if (getSessionClientType() !== "web") {
    return true;
  }

  const refreshedSession = await refreshSessionV2({
    address,
    abortSignal,
  });
  if (refreshedSession?.client_type !== "web") {
    return false;
  }

  // Share creation needs the refreshed bearer token immediately. If local auth
  // cannot persist, fail closed instead of minting a share with stale auth.
  return await persistSessionResponse(refreshedSession);
}

export async function logoutSessionV2({
  address,
  allSessions = false,
}: {
  readonly address: string | null;
  readonly allSessions?: boolean | undefined;
}): Promise<void> {
  const clientType = getSessionClientType();
  if (clientType !== "web") {
    if (!address) {
      return;
    }
    if (clientType === "desktop") {
      await logoutDesktopSession({ address, allSessions });
      return;
    }
    // Native logout is local to this profile/device; device-wide logout uses
    // clearAllAuthenticatedProfiles. allSessions retains its web-only meaning.
    await queueNativePushLogout(address, false);
    await removeNativeRefreshToken(address);
    return;
  }

  await commonApiPost<
    {
      readonly client_type: "web";
      readonly client_address: string | null;
      readonly all_sessions: boolean;
    },
    void
  >({
    endpoint: "auth/session-logout",
    body: {
      client_type: "web",
      client_address: address,
      all_sessions: allSessions,
    },
    credentials: "include",
    parseJson: false,
  });
}

/** Revoke the desktop session in the shell, then drop its refresh token. */
async function logoutDesktopSession({
  address,
  allSessions,
}: {
  readonly address: string;
  readonly allSessions: boolean;
}): Promise<void> {
  try {
    const sessionLogout = requireDesktopNativeAuthMethod("sessionLogout");
    await sessionLogout({
      access_token: getAuthJwt(),
      client_type: "desktop",
      client_address: address,
      all_sessions: allSessions,
    });
  } finally {
    await removeNativeRefreshToken(address);
  }
}
