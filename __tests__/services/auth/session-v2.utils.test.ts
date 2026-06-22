import { Capacitor } from "@capacitor/core";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { setAuthJwt } from "@/services/auth/auth.utils";
import {
  getNativeRefreshToken,
  isNativeSecureStorageAvailable,
  removeNativeRefreshToken,
  setNativeRefreshToken,
} from "@/services/auth/native-refresh-token-storage";
import {
  createConnectionShare,
  getSessionNonce,
  loginWithSessionV2,
  logoutSessionV2,
  persistSessionResponse,
  redeemConnectionShare,
  refreshSessionV2,
} from "@/services/auth/session-v2.utils";

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
  WebPlugin: class {
    readonly pluginName = "mock";
  },
  registerPlugin: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  setAuthJwt: jest.fn(),
}));

jest.mock("@/services/auth/native-refresh-token-storage", () => ({
  getNativeRefreshToken: jest.fn(),
  isNativeSecureStorageAvailable: jest.fn(),
  removeNativeRefreshToken: jest.fn(),
  setNativeRefreshToken: jest.fn(),
}));

describe("session-v2.utils", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (commonApiFetch as jest.Mock).mockResolvedValue(undefined);
    (commonApiPost as jest.Mock).mockResolvedValue(undefined);
    (getNativeRefreshToken as jest.Mock).mockResolvedValue(null);
    (isNativeSecureStorageAvailable as jest.Mock).mockReturnValue(true);
    (setAuthJwt as jest.Mock).mockReturnValue(true);
  });

  it("requests web session nonce with only session-v2 query params", async () => {
    const nonceResponse = {
      signable_message: "6529 Authentication\nDomain: example.com",
      server_signature: "server-signature",
    };
    (commonApiFetch as jest.Mock).mockResolvedValueOnce(nonceResponse);

    await expect(getSessionNonce({ signerAddress: "0xabc" })).resolves.toBe(
      nonceResponse
    );

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "auth/session-nonce",
      params: {
        signer_address: "0xabc",
        client_type: "web",
        chain_id: "1",
      },
    });
  });

  it("requests native session nonce with client_type native", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    const nonceResponse = {
      signable_message: "6529 Authentication\nDomain: native",
      server_signature: "server-signature",
    };
    (commonApiFetch as jest.Mock).mockResolvedValueOnce(nonceResponse);

    await expect(getSessionNonce({ signerAddress: "0xabc" })).resolves.toBe(
      nonceResponse
    );

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "auth/session-nonce",
      params: {
        signer_address: "0xabc",
        client_type: "native",
        chain_id: "1",
      },
    });
  });

  it("revokes a native session when auth persistence fails", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (getNativeRefreshToken as jest.Mock).mockResolvedValue(
      "native-refresh-token"
    );
    (setAuthJwt as jest.Mock).mockReturnValue(false);

    await expect(
      persistSessionResponse({
        client_type: "native",
        address: "0xabc",
        role: null,
        access_token: "access-token",
        access_token_expires_at: "2026-06-10T00:00:00.000Z",
        native_refresh_token: "native-refresh-token",
        refresh_token_expires_at: "2026-07-10T00:00:00.000Z",
      })
    ).resolves.toBe(false);

    expect(setNativeRefreshToken).toHaveBeenCalledWith({
      address: "0xabc",
      refreshToken: "native-refresh-token",
    });
    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/session-logout",
      body: {
        client_type: "native",
        client_address: "0xabc",
        native_refresh_token: "native-refresh-token",
        all_sessions: false,
      },
      credentials: "include",
      parseJson: false,
    });
    expect(removeNativeRefreshToken).toHaveBeenCalledWith("0xabc");
  });

  it("marks persisted web auth as session v2", async () => {
    await expect(
      persistSessionResponse({
        client_type: "web",
        address: "0xabc",
        role: null,
        access_token: "access-token",
        access_token_expires_at: "2026-06-10T00:00:00.000Z",
      })
    ).resolves.toBe(true);

    expect(setAuthJwt).toHaveBeenCalledWith(
      "0xabc",
      "access-token",
      null,
      undefined,
      { authSessionVersion: "v2" }
    );
  });

  it("posts the strict session-login request contract with credentials for web login", async () => {
    const sessionResponse = {
      client_type: "web",
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };
    (commonApiPost as jest.Mock).mockResolvedValueOnce(sessionResponse);

    await expect(
      loginWithSessionV2({
        serverSignature: "server-signature",
        clientSignature: "client-signature",
        signerAddress: "0xabc",
        role: null,
      })
    ).resolves.toBe(sessionResponse);

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/session-login",
      body: {
        client_type: "web",
        server_signature: "server-signature",
        client_signature: "client-signature",
        client_address: "0xabc",
      },
      credentials: "include",
    });
  });

  it("includes credentials for native session-login", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    const sessionResponse = {
      client_type: "native",
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
      native_refresh_token: "native-refresh-token",
      refresh_token_expires_at: "2026-07-10T00:00:00.000Z",
    };
    (commonApiPost as jest.Mock).mockResolvedValueOnce(sessionResponse);

    await expect(
      loginWithSessionV2({
        serverSignature: "server-signature",
        clientSignature: "client-signature",
        signerAddress: "0xabc",
        role: null,
      })
    ).resolves.toBe(sessionResponse);

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/session-login",
      body: {
        client_type: "native",
        server_signature: "server-signature",
        client_signature: "client-signature",
        client_address: "0xabc",
      },
      credentials: "include",
    });
  });

  it("revokes a web session cookie when auth persistence fails", async () => {
    (setAuthJwt as jest.Mock).mockReturnValue(false);

    await expect(
      persistSessionResponse({
        client_type: "web",
        address: "0xabc",
        role: null,
        access_token: "access-token",
        access_token_expires_at: "2026-06-10T00:00:00.000Z",
      })
    ).resolves.toBe(false);

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/session-logout",
      body: {
        client_type: "web",
        client_address: "0xabc",
        all_sessions: false,
      },
      credentials: "include",
      parseJson: false,
    });
  });

  it("attempts web session refresh with credentials", async () => {
    const sessionResponse = {
      client_type: "web",
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };
    (commonApiPost as jest.Mock).mockResolvedValueOnce(sessionResponse);

    await expect(refreshSessionV2({ address: "0xabc" })).resolves.toBe(
      sessionResponse
    );

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/session-refresh",
      body: {
        client_type: "web",
        client_address: "0xabc",
      },
      signal: undefined,
      credentials: "include",
      errorMode: "structured",
    });
  });

  it("treats unauthorized web refresh as an invalid session", async () => {
    const unauthorizedError = Object.assign(new Error("Unauthorized"), {
      status: 401,
      response: { status: 401 },
    });
    (commonApiPost as jest.Mock).mockRejectedValueOnce(unauthorizedError);

    await expect(refreshSessionV2({ address: "0xabc" })).resolves.toBeNull();

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/session-refresh",
      body: {
        client_type: "web",
        client_address: "0xabc",
      },
      signal: undefined,
      credentials: "include",
      errorMode: "structured",
    });
  });

  it("treats unauthorized native refresh as an invalid session", async () => {
    const unauthorizedError = Object.assign(new Error("Unauthorized"), {
      status: 401,
      response: { status: 401 },
    });
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (getNativeRefreshToken as jest.Mock).mockResolvedValue(
      "native-refresh-token"
    );
    (commonApiPost as jest.Mock).mockRejectedValueOnce(unauthorizedError);

    await expect(refreshSessionV2({ address: "0xabc" })).resolves.toBeNull();

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/session-refresh",
      body: {
        client_type: "native",
        client_address: "0xabc",
        native_refresh_token: "native-refresh-token",
      },
      signal: undefined,
      credentials: "include",
      errorMode: "structured",
    });
  });

  it("revokes an existing native session", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (getNativeRefreshToken as jest.Mock).mockResolvedValue(
      "native-refresh-token"
    );

    await logoutSessionV2({ address: "0xabc", allSessions: true });

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/session-logout",
      body: {
        client_type: "native",
        client_address: "0xabc",
        native_refresh_token: "native-refresh-token",
        all_sessions: true,
      },
      credentials: "include",
      parseJson: false,
    });
    expect(removeNativeRefreshToken).toHaveBeenCalledWith("0xabc");
  });

  it("removes the native refresh token when native logout fails", async () => {
    const logoutError = new Error("logout failed");
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (getNativeRefreshToken as jest.Mock).mockResolvedValue(
      "native-refresh-token"
    );
    (commonApiPost as jest.Mock).mockRejectedValueOnce(logoutError);

    await expect(
      logoutSessionV2({ address: "0xabc", allSessions: true })
    ).rejects.toBe(logoutError);

    expect(removeNativeRefreshToken).toHaveBeenCalledWith("0xabc");
  });

  it("attempts web session logout with credentials", async () => {
    await logoutSessionV2({ address: "0xabc", allSessions: true });

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/session-logout",
      body: {
        client_type: "web",
        client_address: "0xabc",
        all_sessions: true,
      },
      credentials: "include",
      parseJson: false,
    });
  });

  it("creates a native connection share with bearer auth and session credentials", async () => {
    const shareResponse = {
      connection_share_code: "share-code",
      expires_at: "2026-06-10T00:00:00.000Z",
      address: "0xabc",
      role: null,
      target_client_type: "native",
      deep_link_path:
        "/accept-connection-sharing?connection_share_code=share-code",
    };
    (commonApiPost as jest.Mock).mockResolvedValueOnce(shareResponse);

    await expect(createConnectionShare({})).resolves.toBe(shareResponse);

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/connection-share",
      body: {
        target_client_type: "native",
      },
      credentials: "include",
      signal: undefined,
    });
  });

  it("redeems a connection share as a native session", async () => {
    (commonApiPost as jest.Mock).mockResolvedValueOnce({
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
      native_refresh_token: "native-refresh-token",
      refresh_token_expires_at: "2026-07-10T00:00:00.000Z",
    });

    await expect(redeemConnectionShare("share-code")).resolves.toEqual({
      client_type: "native",
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
      native_refresh_token: "native-refresh-token",
      refresh_token_expires_at: "2026-07-10T00:00:00.000Z",
    });

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/connection-share/redeem",
      body: {
        connection_share_code: "share-code",
        target_client_type: "native",
      },
      credentials: "include",
    });
  });
});
