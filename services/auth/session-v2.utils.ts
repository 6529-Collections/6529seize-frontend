import { Capacitor } from "@capacitor/core";
import { publicEnv } from "@/config/env";
import { commonApiPost } from "@/services/api/common-api";
import { setAuthJwt } from "./auth.utils";
import {
  getNativeRefreshToken,
  isNativeSecureStorageAvailable,
  removeNativeRefreshToken,
  setNativeRefreshToken,
} from "./native-refresh-token-storage";

export type AuthSessionClientType = "web" | "native";

export interface SessionLoginRequest {
  readonly client_type: AuthSessionClientType;
  readonly server_signature: string;
  readonly client_signature: string;
  readonly is_safe_wallet: boolean;
  readonly client_address: string;
  readonly role?: string | null;
  readonly wallet_kind_hint?: "eoa" | "contract" | "unknown" | null;
  readonly version?: number;
}

export interface SessionWebResponse {
  readonly address: string;
  readonly role: string | null;
  readonly access_token: string;
  readonly access_token_expires_at: string;
  readonly client_type: "web";
}

export interface SessionNativeResponse {
  readonly address: string;
  readonly role: string | null;
  readonly access_token: string;
  readonly access_token_expires_at: string;
  readonly client_type: "native";
  readonly native_refresh_token: string;
  readonly refresh_token_expires_at: string;
}

export type SessionLoginResponse = SessionWebResponse | SessionNativeResponse;
export type SessionRefreshResponse = SessionWebResponse | SessionNativeResponse;

export interface CreateConnectionTransferResponse {
  readonly transfer_code: string;
  readonly expires_at: string;
  readonly address: string;
  readonly role: string | null;
  readonly target_client_type: "native";
  readonly deep_link_path: string;
}

export interface RedeemConnectionTransferResponse {
  readonly address: string;
  readonly role: string | null;
  readonly access_token: string;
  readonly access_token_expires_at: string;
  readonly native_refresh_token: string;
  readonly refresh_token_expires_at: string;
}

export function isWalletAuthSessionV2Enabled(): boolean {
  return publicEnv.AUTH_SESSION_V2_ENABLED === "true";
}

export function isAuthTransferCodesEnabled(): boolean {
  return publicEnv.AUTH_TRANSFER_CODES_ENABLED === "true";
}

export function isLegacyRefreshEnabled(): boolean {
  return publicEnv.AUTH_LEGACY_REFRESH_ENABLED !== "false";
}

export function isConnectionTransferV2Enabled(): boolean {
  return isWalletAuthSessionV2Enabled() && isAuthTransferCodesEnabled();
}

export function getSessionClientType(): AuthSessionClientType {
  return Capacitor.isNativePlatform() ? "native" : "web";
}

export async function loginWithSessionV2({
  serverSignature,
  clientSignature,
  signerAddress,
  role,
  isSafeWallet,
}: {
  readonly serverSignature: string;
  readonly clientSignature: string;
  readonly signerAddress: string;
  readonly role: string | null;
  readonly isSafeWallet: boolean;
}): Promise<SessionLoginResponse> {
  return await commonApiPost<SessionLoginRequest, SessionLoginResponse>({
    endpoint: "auth/session-login",
    body: {
      client_type: getSessionClientType(),
      server_signature: serverSignature,
      client_signature: clientSignature,
      is_safe_wallet: isSafeWallet,
      client_address: signerAddress,
      ...(role != null ? { role } : {}),
      wallet_kind_hint: isSafeWallet ? "contract" : "eoa",
      version: 2,
    },
    credentials: "include",
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
    });
  }

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
  });
}

export async function persistSessionResponse(
  response: SessionLoginResponse | SessionRefreshResponse
): Promise<boolean> {
  if (response.client_type === "native") {
    if (!isNativeSecureStorageAvailable()) {
      return false;
    }

    await setNativeRefreshToken({
      address: response.address,
      refreshToken: response.native_refresh_token,
    });
  }

  return setAuthJwt(
    response.address,
    response.access_token,
    null,
    response.role ?? undefined
  );
}

export async function createConnectionTransfer({
  role,
  signal,
}: {
  readonly role: string | null;
  readonly signal?: AbortSignal | undefined;
}): Promise<CreateConnectionTransferResponse> {
  return await commonApiPost<
    {
      readonly target_client_type: "native";
      readonly role?: string | null;
    },
    CreateConnectionTransferResponse
  >({
    endpoint: "auth/connection-transfer",
    body: {
      target_client_type: "native",
      ...(role != null ? { role } : {}),
    },
    credentials: "include",
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
  if (!isWalletAuthSessionV2Enabled()) {
    return;
  }

  const clientType = getSessionClientType();
  if (clientType === "native") {
    if (!address) {
      return;
    }
    const nativeRefreshToken = await getNativeRefreshToken(address);
    if (!nativeRefreshToken) {
      return;
    }
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
    await removeNativeRefreshToken(address);
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

export async function redeemConnectionTransfer(
  transferCode: string
): Promise<SessionNativeResponse> {
  const response = await commonApiPost<
    {
      readonly transfer_code: string;
      readonly target_client_type: "native";
    },
    RedeemConnectionTransferResponse
  >({
    endpoint: "auth/connection-transfer/redeem",
    body: {
      transfer_code: transferCode,
      target_client_type: "native",
    },
    credentials: "include",
  });

  return {
    ...response,
    client_type: "native",
  };
}
