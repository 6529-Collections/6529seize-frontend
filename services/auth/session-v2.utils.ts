import { Capacitor } from "@capacitor/core";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { setAuthJwt } from "./auth.utils";
import {
  getNativeRefreshToken,
  isNativeSecureStorageAvailable,
  removeNativeRefreshToken,
  setNativeRefreshToken,
} from "./native-refresh-token-storage";

type AuthSessionClientType = "web" | "native" | "desktop";
type RefreshTokenSessionClientType = Exclude<AuthSessionClientType, "web">;

interface SessionLoginRequest {
  readonly client_type: AuthSessionClientType;
  readonly server_signature: string;
  readonly client_signature: string;
  readonly client_address: string;
  readonly role?: string | null;
}

interface SessionWebResponse {
  readonly address: string;
  readonly role: string | null;
  readonly access_token: string;
  readonly access_token_expires_at: string;
  readonly client_type: "web";
}

interface SessionNativeResponse {
  readonly address: string;
  readonly role: string | null;
  readonly access_token: string;
  readonly access_token_expires_at: string;
  readonly client_type: RefreshTokenSessionClientType;
  readonly native_refresh_token: string;
  readonly refresh_token_expires_at: string;
}

type SessionLoginResponse = SessionWebResponse | SessionNativeResponse;
type SessionRefreshResponse = SessionWebResponse | SessionNativeResponse;
type SessionRefreshFailureCooldown =
  | {
      readonly type: "empty";
      readonly expiresAtMs: number;
    }
  | {
      readonly type: "retry";
      readonly expiresAtMs: number;
    };
type SessionRefreshInFlight = {
  readonly controller: AbortController;
  readonly promise: Promise<SessionRefreshResponse | null>;
  activeConsumers: number;
};

type ApiStatusError = {
  readonly status?: unknown;
  readonly response?: {
    readonly status?: unknown;
  };
};

interface CreateConnectionShareResponse {
  readonly connection_share_code: string;
  readonly expires_at: string;
  readonly address: string;
  readonly role: string | null;
  readonly target_client_type: RefreshTokenSessionClientType;
  readonly deep_link_path: string;
}

interface CreateLegacyDesktopConnectionShareResponse {
  readonly refresh_token: string;
  readonly address: string;
  readonly role: string | null;
  readonly deep_link_path: string;
}

interface RedeemConnectionShareResponse {
  readonly address: string;
  readonly role: string | null;
  readonly access_token: string;
  readonly access_token_expires_at: string;
  readonly client_type?: RefreshTokenSessionClientType | undefined;
  readonly native_refresh_token: string;
  readonly refresh_token_expires_at: string;
}

const SESSION_REFRESH_EMPTY_FAILURE_COOLDOWN_MS = 2000;
const SESSION_REFRESH_RETRY_COOLDOWN_MS = 250;
const sessionRefreshInFlight = new Map<string, SessionRefreshInFlight>();
const sessionRefreshFailureCooldowns = new Map<
  string,
  SessionRefreshFailureCooldown
>();

export function getSessionClientType(): AuthSessionClientType {
  return Capacitor.isNativePlatform() ? "native" : "web";
}

function isUnauthorizedApiError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const statusError = error as ApiStatusError;
  return statusError.status === 401 || statusError.response?.status === 401;
}

function getSessionRefreshKey({
  address,
  clientType,
}: {
  readonly address: string;
  readonly clientType: AuthSessionClientType;
}): string {
  return `${clientType}:${address.trim().toLowerCase()}`;
}

function createAbortError(): DOMException {
  return new DOMException("Session refresh aborted", "AbortError");
}

const isAbortError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  error.name === "AbortError";

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
  type: SessionRefreshFailureCooldown["type"]
): void {
  sessionRefreshFailureCooldowns.set(key, {
    type,
    expiresAtMs:
      Date.now() +
      (type === "empty"
        ? SESSION_REFRESH_EMPTY_FAILURE_COOLDOWN_MS
        : SESSION_REFRESH_RETRY_COOLDOWN_MS),
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

async function waitForSessionRefreshRetryCooldown({
  cooldown,
  abortSignal,
}: {
  readonly cooldown: SessionRefreshFailureCooldown;
  readonly abortSignal?: AbortSignal | undefined;
}): Promise<void> {
  const delayMs = Math.max(0, cooldown.expiresAtMs - Date.now());
  if (delayMs === 0) {
    return;
  }
  if (abortSignal?.aborted) {
    throw createAbortError();
  }

  await new Promise<void>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
    const cleanup = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      abortSignal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, delayMs);
    abortSignal?.addEventListener("abort", onAbort, { once: true });
  });
}

function settleSessionRefreshConsumer(
  entry: SessionRefreshInFlight,
  key: string
): void {
  entry.activeConsumers = Math.max(0, entry.activeConsumers - 1);
  if (
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
    if (didPersistNativeRefreshToken) {
      await logoutSessionV2({ address: response.address });
      return;
    }

    if (response.client_type === "web") {
      await logoutSessionV2({ address: response.address });
    }
  } catch {
    // Best-effort cleanup: preserve the original persistence result/error.
  }
}

export async function getSessionNonce({
  signerAddress,
}: {
  readonly signerAddress: string;
}): Promise<ApiSessionNonceResponse> {
  return await commonApiFetch<
    ApiSessionNonceResponse,
    {
      readonly signer_address: string;
      readonly client_type: AuthSessionClientType;
      readonly chain_id: string;
    }
  >({
    endpoint: "auth/session-nonce",
    params: {
      signer_address: signerAddress,
      client_type: getSessionClientType(),
      chain_id: "1",
    },
  });
}

export async function loginWithSessionV2({
  serverSignature,
  clientSignature,
  signerAddress,
  role,
}: {
  readonly serverSignature: string;
  readonly clientSignature: string;
  readonly signerAddress: string;
  readonly role: string | null;
}): Promise<SessionLoginResponse> {
  const roleBody = role === null ? {} : { role };
  const response = await commonApiPost<SessionLoginRequest, SessionLoginResponse>(
    {
      endpoint: "auth/session-login",
      body: {
        client_type: getSessionClientType(),
        server_signature: serverSignature,
        client_signature: clientSignature,
        client_address: signerAddress,
        ...roleBody,
      },
      credentials: getSessionCredentialsMode(),
    }
  );
  clearSessionRefreshFailureForSession(response);
  return response;
}

async function executeSessionRefreshV2({
  address,
  abortSignal,
  clientType,
}: {
  readonly address: string;
  readonly abortSignal?: AbortSignal | undefined;
  readonly clientType: AuthSessionClientType;
}): Promise<SessionRefreshResponse | null> {
  if (clientType !== "web") {
    const nativeRefreshToken = await getNativeRefreshToken(address);
    if (!nativeRefreshToken) {
      return null;
    }
    try {
      return await commonApiPost<
        {
          readonly client_type: RefreshTokenSessionClientType;
          readonly client_address: string;
          readonly native_refresh_token: string;
        },
        SessionNativeResponse
      >({
        endpoint: "auth/session-refresh",
        body: {
          client_type: clientType,
          client_address: address,
          native_refresh_token: nativeRefreshToken,
        },
        signal: abortSignal,
        credentials: getSessionCredentialsMode(),
        errorMode: "structured",
        includeWalletAuth: false,
      });
    } catch (error: unknown) {
      if (isUnauthorizedApiError(error)) {
        return null;
      }
      throw error;
    }
  }

  try {
    return await commonApiPost<
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
    });
  } catch (error: unknown) {
    if (isUnauthorizedApiError(error)) {
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
  if (abortSignal?.aborted) {
    throw createAbortError();
  }

  const clientType = getSessionClientType();
  const key = getSessionRefreshKey({ address, clientType });
  const cooldown = getActiveFailureCooldown(key);

  if (cooldown?.type === "empty") {
    return null;
  }
  if (cooldown?.type === "retry") {
    await waitForSessionRefreshRetryCooldown({ cooldown, abortSignal });
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
    return await withCallerAbort<SessionRefreshResponse | null>({
      entry: existingEntry,
      key,
      abortSignal,
    });
  }

  const controller = new AbortController();
  const entry: SessionRefreshInFlight = {
    controller,
    activeConsumers: 1,
    promise: executeSessionRefreshV2({
      address,
      abortSignal: abortSignal ? controller.signal : undefined,
      clientType,
    }),
  };
  sessionRefreshInFlight.set(key, entry);

  void (async () => {
    try {
      const response = await entry.promise;
      if (response) {
        clearSessionRefreshFailure(key);
        return;
      }

      rememberSessionRefreshFailure(key, "empty");
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return;
      }
      rememberSessionRefreshFailure(key, "retry");
    } finally {
      if (sessionRefreshInFlight.get(key) === entry) {
        sessionRefreshInFlight.delete(key);
      }
    }
  })();

  return await withCallerAbort<SessionRefreshResponse | null>({
    entry,
    key,
    abortSignal,
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
  response: SessionLoginResponse | SessionRefreshResponse
): Promise<boolean> {
  let didPersistNativeRefreshToken = false;
  if (response.client_type !== "web") {
    if (!isNativeSecureStorageAvailable()) {
      return false;
    }

    await setNativeRefreshToken({
      address: response.address,
      refreshToken: response.native_refresh_token,
    });
    didPersistNativeRefreshToken = true;
  }

  let didPersistAuth = false;
  try {
    didPersistAuth = setAuthJwt(
      response.address,
      response.access_token,
      null,
      response.role ?? undefined,
      { authSessionVersion: "v2" }
    );
  } catch (error) {
    await rollbackUnpersistedSession(response, didPersistNativeRefreshToken);
    throw error;
  }

  if (didPersistAuth) {
    clearSessionRefreshFailureForSession(response);
    return true;
  }

  await rollbackUnpersistedSession(response, didPersistNativeRefreshToken);
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

export async function createConnectionShare({
  signal,
  targetClientType = "native",
}: {
  readonly signal?: AbortSignal | undefined;
  readonly targetClientType?: RefreshTokenSessionClientType | undefined;
}): Promise<CreateConnectionShareResponse> {
  return await commonApiPost<
    {
      readonly target_client_type: RefreshTokenSessionClientType;
    },
    CreateConnectionShareResponse
  >({
    endpoint: "auth/connection-share",
    body: {
      target_client_type: targetClientType,
    },
    credentials: getSessionCredentialsMode(),
    signal,
  });
}

export async function createLegacyDesktopConnectionShare({
  signal,
}: {
  readonly signal?: AbortSignal | undefined;
}): Promise<CreateLegacyDesktopConnectionShareResponse> {
  return await commonApiPost<
    Record<string, never>,
    CreateLegacyDesktopConnectionShareResponse
  >({
    endpoint: "auth/connection-share/legacy-desktop",
    body: {},
    credentials: getSessionCredentialsMode(),
    signal,
  });
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
    const nativeRefreshToken = await getNativeRefreshToken(address);
    if (!nativeRefreshToken) {
      return;
    }
    try {
      await commonApiPost<
        {
          readonly client_type: RefreshTokenSessionClientType;
          readonly client_address: string;
          readonly native_refresh_token: string;
          readonly all_sessions: boolean;
        },
        void
      >({
        endpoint: "auth/session-logout",
        body: {
          client_type: clientType,
          client_address: address,
          native_refresh_token: nativeRefreshToken,
          all_sessions: allSessions,
        },
        credentials: "include",
        parseJson: false,
      });
    } finally {
      await removeNativeRefreshToken(address);
    }
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

export async function redeemConnectionShare(
  connectionShareCode: string,
  targetClientType: RefreshTokenSessionClientType = "native"
): Promise<SessionNativeResponse> {
  const response = await commonApiPost<
    {
      readonly connection_share_code: string;
      readonly target_client_type: RefreshTokenSessionClientType;
    },
    RedeemConnectionShareResponse
  >({
    endpoint: "auth/connection-share/redeem",
    body: {
      connection_share_code: connectionShareCode,
      target_client_type: targetClientType,
    },
    credentials: getSessionCredentialsMode(),
  });

  return {
    ...response,
    client_type: response.client_type ?? targetClientType,
  };
}
