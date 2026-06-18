import { Capacitor } from "@capacitor/core";
import { publicEnv } from "@/config/env";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { setAuthJwt } from "./auth.utils";
import {
  getNativeRefreshToken,
  isNativeSecureStorageAvailable,
  removeNativeRefreshToken,
  setNativeRefreshToken,
} from "./native-refresh-token-storage";

type AuthSessionClientType = "web" | "native";

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
  readonly client_type: "native";
  readonly native_refresh_token: string;
  readonly refresh_token_expires_at: string;
}

type SessionLoginResponse = SessionWebResponse | SessionNativeResponse;
type SessionRefreshResponse = SessionWebResponse | SessionNativeResponse;

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
  readonly target_client_type: "native";
  readonly deep_link_path: string;
}

interface RedeemConnectionShareResponse {
  readonly address: string;
  readonly role: string | null;
  readonly access_token: string;
  readonly access_token_expires_at: string;
  readonly native_refresh_token: string;
  readonly refresh_token_expires_at: string;
}

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

function canUseWebCookieSession(): boolean {
  if (globalThis.window === undefined) {
    return true;
  }

  return isWebSessionCredentialApiOriginAllowed(
    new URL(publicEnv.API_ENDPOINT).origin,
    globalThis.window.location.origin
  );
}

function isWebSessionCredentialApiOriginAllowed(
  apiOrigin: string,
  windowOrigin: string
): boolean {
  if (apiOrigin === windowOrigin) {
    return true;
  }

  return getConfiguredWebSessionCredentialApiOrigins().includes(apiOrigin);
}

function getConfiguredWebSessionCredentialApiOrigins(): string[] {
  return (publicEnv.WEB_SESSION_CREDENTIAL_API_ORIGINS ?? "")
    .split(",")
    .map(normalizeWebSessionCredentialOrigin)
    .filter((origin): origin is string => origin !== null);
}

function normalizeWebSessionCredentialOrigin(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function getSessionCredentialsMode(): RequestCredentials | undefined {
  if (getSessionClientType() !== "web") {
    return "include";
  }

  return canUseWebCookieSession() ? "include" : undefined;
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
  return await commonApiPost<SessionLoginRequest, SessionLoginResponse>({
    endpoint: "auth/session-login",
    body: {
      client_type: getSessionClientType(),
      server_signature: serverSignature,
      client_signature: clientSignature,
      client_address: signerAddress,
      ...roleBody,
    },
    credentials: getSessionCredentialsMode(),
  });
}

export async function refreshSessionV2({
  address,
  abortSignal,
}: {
  readonly address: string;
  readonly abortSignal?: AbortSignal | undefined;
}): Promise<SessionRefreshResponse | null> {
  const clientType = getSessionClientType();
  if (clientType === "native") {
    const nativeRefreshToken = await getNativeRefreshToken(address);
    if (!nativeRefreshToken) {
      return null;
    }
    try {
      return await commonApiPost<
        {
          readonly client_type: "native";
          readonly client_address: string;
          readonly native_refresh_token: string;
        },
        SessionNativeResponse
      >({
        endpoint: "auth/session-refresh",
        body: {
          client_type: "native",
          client_address: address,
          native_refresh_token: nativeRefreshToken,
        },
        signal: abortSignal,
        credentials: "include",
        errorMode: "structured",
      });
    } catch (error: unknown) {
      if (isUnauthorizedApiError(error)) {
        return null;
      }
      throw error;
    }
  }

  if (!canUseWebCookieSession()) {
    return null;
  }

  try {
    return await commonApiPost<
      {
        readonly client_type: "web";
      },
      SessionWebResponse
    >({
      endpoint: "auth/session-refresh",
      body: {
        client_type: "web",
      },
      signal: abortSignal,
      credentials: "include",
      errorMode: "structured",
    });
  } catch (error: unknown) {
    if (isUnauthorizedApiError(error)) {
      return null;
    }
    throw error;
  }
}

export async function persistSessionResponse(
  response: SessionLoginResponse | SessionRefreshResponse
): Promise<boolean> {
  let didPersistNativeRefreshToken = false;
  if (response.client_type === "native") {
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

  if (!didPersistAuth) {
    await rollbackUnpersistedSession(response, didPersistNativeRefreshToken);
  }

  return didPersistAuth;
}

export async function createConnectionShare({
  signal,
}: {
  readonly signal?: AbortSignal | undefined;
}): Promise<CreateConnectionShareResponse> {
  return await commonApiPost<
    {
      readonly target_client_type: "native";
    },
    CreateConnectionShareResponse
  >({
    endpoint: "auth/connection-share",
    body: {
      target_client_type: "native",
    },
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
  if (clientType === "native") {
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
          readonly client_type: "native";
          readonly client_address: string;
          readonly native_refresh_token: string;
          readonly all_sessions: boolean;
        },
        void
      >({
        endpoint: "auth/session-logout",
        body: {
          client_type: "native",
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

  if (!canUseWebCookieSession()) {
    return;
  }

  await commonApiPost<
    {
      readonly client_type: "web";
      readonly all_sessions: boolean;
    },
    void
  >({
    endpoint: "auth/session-logout",
    body: {
      client_type: "web",
      all_sessions: allSessions,
    },
    credentials: "include",
    parseJson: false,
  });
}

export async function redeemConnectionShare(
  connectionShareCode: string
): Promise<SessionNativeResponse> {
  const response = await commonApiPost<
    {
      readonly connection_share_code: string;
      readonly target_client_type: "native";
    },
    RedeemConnectionShareResponse
  >({
    endpoint: "auth/connection-share/redeem",
    body: {
      connection_share_code: connectionShareCode,
      target_client_type: "native",
    },
    credentials: getSessionCredentialsMode(),
  });

  return {
    ...response,
    client_type: "native",
  };
}
