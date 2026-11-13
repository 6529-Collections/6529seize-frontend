import type { ApiRedeemConnectionShareResponse } from "@/generated/models/ApiRedeemConnectionShareResponse";
import { commonApiPost } from "@/services/api/common-api";
import { getAuthJwt, getWalletAddress } from "./auth.utils";
import {
  parseDesktopConnectionShareResponse,
  parseDesktopLegacyConnectionShareResponse,
  parseDesktopSessionResponse,
  requireDesktopNativeAuthMethod,
  runDesktopNativeAuthRequest,
} from "./desktop-native-auth";
import { getNativeRefreshToken } from "./native-refresh-token-storage";
import { getSessionClientType } from "./session-client-type";
import type {
  RefreshTokenSessionClientType,
  SessionNativeResponse,
} from "./session-v2.types";

// Connection-share requests carry the session cookie on the web.
const SESSION_CREDENTIALS: RequestCredentials = "include";

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

type RedeemConnectionShareResponse = Omit<
  ApiRedeemConnectionShareResponse,
  "client_type"
> & { readonly client_type?: RefreshTokenSessionClientType | undefined };

interface NativeConnectionShareSourceProof {
  readonly client_type: RefreshTokenSessionClientType;
  readonly client_address: string;
  readonly native_refresh_token?: string | undefined;
}

async function getNativeConnectionShareSourceProof(): Promise<NativeConnectionShareSourceProof | null> {
  const clientType = getSessionClientType();
  if (clientType === "web") {
    return null;
  }

  const address = getWalletAddress();
  if (!address) {
    throw new Error(
      `Connection sharing requires an active ${clientType} session`
    );
  }

  if (clientType === "desktop") {
    // The shell proves the desktop session with the refresh token it holds.
    return { client_type: clientType, client_address: address };
  }

  const nativeRefreshToken = await getNativeRefreshToken(address);
  if (!nativeRefreshToken) {
    throw new Error(
      `Connection sharing requires an active ${clientType} session`
    );
  }

  return {
    client_type: clientType,
    client_address: address,
    native_refresh_token: nativeRefreshToken,
  };
}

export async function createConnectionShare({
  signal,
  targetClientType = "native",
  encryptedDeviceSetup,
}: {
  readonly signal?: AbortSignal | undefined;
  readonly targetClientType?: RefreshTokenSessionClientType | undefined;
  readonly encryptedDeviceSetup?: string | undefined;
}): Promise<CreateConnectionShareResponse> {
  const sourceProof = await getNativeConnectionShareSourceProof();
  if (sourceProof?.client_type === "desktop") {
    const createDesktopConnectionShare = requireDesktopNativeAuthMethod(
      "createConnectionShare"
    );
    return await runDesktopNativeAuthRequest({
      signal,
      request: async () =>
        parseDesktopConnectionShareResponse(
          await createDesktopConnectionShare({
            access_token: getAuthJwt(),
            target_client_type: targetClientType,
            ...(encryptedDeviceSetup === undefined
              ? {}
              : { encrypted_device_setup: encryptedDeviceSetup }),
            client_type: sourceProof.client_type,
            client_address: sourceProof.client_address,
          })
        ),
    });
  }

  const body = sourceProof
    ? {
        target_client_type: targetClientType,
        encrypted_device_setup: encryptedDeviceSetup,
        ...sourceProof,
      }
    : {
        target_client_type: targetClientType,
        encrypted_device_setup: encryptedDeviceSetup,
      };

  return await commonApiPost<
    {
      readonly target_client_type: RefreshTokenSessionClientType;
      readonly client_type?: RefreshTokenSessionClientType | undefined;
      readonly client_address?: string | undefined;
      readonly native_refresh_token?: string | undefined;
    },
    CreateConnectionShareResponse
  >({
    endpoint: "auth/connection-share",
    body,
    credentials: SESSION_CREDENTIALS,
    signal,
  });
}

export async function createLegacyDesktopConnectionShare({
  signal,
}: {
  readonly signal?: AbortSignal | undefined;
}): Promise<CreateLegacyDesktopConnectionShareResponse> {
  const sourceProof = await getNativeConnectionShareSourceProof();
  if (sourceProof?.client_type === "desktop") {
    const createDesktopLegacyConnectionShare = requireDesktopNativeAuthMethod(
      "createLegacyDesktopConnectionShare"
    );
    return await runDesktopNativeAuthRequest({
      signal,
      request: async () =>
        parseDesktopLegacyConnectionShareResponse(
          await createDesktopLegacyConnectionShare({
            access_token: getAuthJwt(),
            client_type: sourceProof.client_type,
            client_address: sourceProof.client_address,
          })
        ),
    });
  }

  return await commonApiPost<
    Partial<NativeConnectionShareSourceProof>,
    CreateLegacyDesktopConnectionShareResponse
  >({
    endpoint: "auth/connection-share/legacy-desktop",
    body: sourceProof ?? {},
    credentials: SESSION_CREDENTIALS,
    signal,
  });
}

export async function redeemConnectionShare(
  connectionShareCode: string,
  targetClientType: RefreshTokenSessionClientType = getSessionClientType() ===
  "desktop"
    ? "desktop"
    : "native"
): Promise<
  SessionNativeResponse &
    Pick<RedeemConnectionShareResponse, "encrypted_device_setup">
> {
  if (getSessionClientType() === "desktop") {
    const redeemDesktopConnectionShare = requireDesktopNativeAuthMethod(
      "redeemConnectionShare"
    );
    const { encrypted_device_setup, ...desktopResponse } =
      parseDesktopSessionResponse(
        "redeemConnectionShare",
        await redeemDesktopConnectionShare({
          access_token: getAuthJwt(),
          connection_share_code: connectionShareCode,
          target_client_type: targetClientType,
        })
      );
    return {
      ...desktopResponse,
      encrypted_device_setup: encrypted_device_setup ?? null,
    };
  }

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
    credentials: SESSION_CREDENTIALS,
  });

  return {
    ...response,
    role: response.role ?? null,
    access_token_expires_at: new Date(
      response.access_token_expires_at
    ).toISOString(),
    refresh_token_expires_at: new Date(
      response.refresh_token_expires_at
    ).toISOString(),
    client_type: response.client_type ?? targetClientType,
  };
}
