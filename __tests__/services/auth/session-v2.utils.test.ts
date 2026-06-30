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
  __resetSessionRefreshStateForTests,
  createConnectionShare,
  createLegacyDesktopConnectionShare,
  getSessionNonce,
  loginWithSessionV2,
  logoutSessionV2,
  persistSessionResponse,
  redeemConnectionShare,
  refreshSessionV2,
  verifyActiveSessionV2WebSession,
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
    __resetSessionRefreshStateForTests();
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
      includeWalletAuth: false,
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
      includeWalletAuth: false,
    });
  });

  it("shares concurrent refreshes for the same web session context", async () => {
    const sessionResponse = {
      client_type: "web",
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };
    let resolveRefresh:
      | ((response: typeof sessionResponse) => void)
      | undefined = undefined;
    const refreshPromise = new Promise<typeof sessionResponse>((resolve) => {
      resolveRefresh = resolve;
    });
    (commonApiPost as jest.Mock).mockReturnValueOnce(refreshPromise);

    const firstRefresh = refreshSessionV2({ address: "0xabc" });
    const secondRefresh = refreshSessionV2({ address: "0xABC" });

    expect(commonApiPost).toHaveBeenCalledTimes(1);
    expect(resolveRefresh).toBeDefined();
    resolveRefresh?.(sessionResponse);

    await expect(firstRefresh).resolves.toBe(sessionResponse);
    await expect(secondRefresh).resolves.toBe(sessionResponse);
  });

  it("keeps a shared refresh alive when one consumer aborts", async () => {
    const abortController = new AbortController();
    const sessionResponse = {
      client_type: "web",
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };
    let resolveRefresh:
      | ((response: typeof sessionResponse) => void)
      | undefined = undefined;
    let internalSignal: AbortSignal | undefined = undefined;
    const refreshPromise = new Promise<typeof sessionResponse>((resolve) => {
      resolveRefresh = resolve;
    });
    (commonApiPost as jest.Mock).mockImplementationOnce(
      ({ signal }: { readonly signal?: AbortSignal | undefined }) => {
        internalSignal = signal;
        return refreshPromise;
      }
    );

    const abortingRefresh = refreshSessionV2({
      address: "0xabc",
      abortSignal: abortController.signal,
    });
    const waitingRefresh = refreshSessionV2({ address: "0xABC" });

    expect(commonApiPost).toHaveBeenCalledTimes(1);
    abortController.abort();

    await expect(abortingRefresh).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(internalSignal?.aborted).toBe(false);

    expect(resolveRefresh).toBeDefined();
    resolveRefresh?.(sessionResponse);
    await expect(waitingRefresh).resolves.toBe(sessionResponse);
    expect(commonApiPost).toHaveBeenCalledTimes(1);
  });

  it("cooldowns failed web refreshes for the same session context", async () => {
    const unauthorizedError = Object.assign(new Error("Unauthorized"), {
      status: 401,
      response: { status: 401 },
    });
    (commonApiPost as jest.Mock).mockRejectedValueOnce(unauthorizedError);

    await expect(refreshSessionV2({ address: "0xabc" })).resolves.toBeNull();
    await expect(refreshSessionV2({ address: "0xABC" })).resolves.toBeNull();

    expect(commonApiPost).toHaveBeenCalledTimes(1);
  });

  it("clears a failed refresh cooldown after successful auth persistence", async () => {
    const unauthorizedError = Object.assign(new Error("Unauthorized"), {
      status: 401,
      response: { status: 401 },
    });
    const sessionResponse = {
      client_type: "web",
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };
    (commonApiPost as jest.Mock)
      .mockRejectedValueOnce(unauthorizedError)
      .mockResolvedValueOnce(sessionResponse);

    await expect(refreshSessionV2({ address: "0xabc" })).resolves.toBeNull();
    await expect(persistSessionResponse(sessionResponse)).resolves.toBe(true);
    await expect(refreshSessionV2({ address: "0xABC" })).resolves.toBe(
      sessionResponse
    );

    expect(commonApiPost).toHaveBeenCalledTimes(2);
  });

  it("delays transport failure retries without replaying a stale error", async () => {
    jest.useFakeTimers();
    const networkError = new Error("Failed to fetch");
    const sessionResponse = {
      client_type: "web",
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };
    (commonApiPost as jest.Mock)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(sessionResponse);

    try {
      await expect(refreshSessionV2({ address: "0xabc" })).rejects.toThrow(
        "Failed to fetch"
      );

      const retriedRefresh = refreshSessionV2({ address: "0xABC" });
      expect(commonApiPost).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(250);
      await expect(retriedRefresh).resolves.toBe(sessionResponse);
      expect(commonApiPost).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it("starts a new refresh immediately after the previous caller aborts", async () => {
    const abortController = new AbortController();
    const sessionResponse = {
      client_type: "web",
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };

    (commonApiPost as jest.Mock)
      .mockImplementationOnce(
        ({ signal }: { readonly signal?: AbortSignal | undefined }) =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener(
              "abort",
              () => reject(new DOMException("aborted", "AbortError")),
              { once: true }
            );
          })
      )
      .mockResolvedValueOnce(sessionResponse);

    const abortedRefresh = refreshSessionV2({
      address: "0xabc",
      abortSignal: abortController.signal,
    });

    expect(commonApiPost).toHaveBeenCalledTimes(1);
    abortController.abort();

    await expect(abortedRefresh).rejects.toMatchObject({
      name: "AbortError",
    });
    await expect(refreshSessionV2({ address: "0xABC" })).resolves.toBe(
      sessionResponse
    );

    expect(commonApiPost).toHaveBeenCalledTimes(2);
  });

  it("verifies an active web session and persists the refreshed auth", async () => {
    const sessionResponse = {
      client_type: "web",
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };
    (commonApiPost as jest.Mock).mockResolvedValueOnce(sessionResponse);

    await expect(
      verifyActiveSessionV2WebSession({ address: "0xabc" })
    ).resolves.toBe(true);

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/session-refresh",
      body: {
        client_type: "web",
        client_address: "0xabc",
      },
      signal: undefined,
      credentials: "include",
      errorMode: "structured",
      includeWalletAuth: false,
    });
    expect(setAuthJwt).toHaveBeenCalledWith(
      "0xabc",
      "access-token",
      null,
      undefined,
      { authSessionVersion: "v2" }
    );
  });

  it("returns false when refreshed web session auth cannot be persisted", async () => {
    const sessionResponse = {
      client_type: "web",
      address: "0xabc",
      role: null,
      access_token: "access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };
    (setAuthJwt as jest.Mock).mockReturnValue(false);
    (commonApiPost as jest.Mock)
      .mockResolvedValueOnce(sessionResponse)
      .mockResolvedValueOnce(undefined);

    await expect(
      verifyActiveSessionV2WebSession({ address: "0xabc" })
    ).resolves.toBe(false);

    expect(commonApiPost).toHaveBeenNthCalledWith(2, {
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

  it("returns false when the active web session cannot be refreshed", async () => {
    const unauthorizedError = Object.assign(new Error("Unauthorized"), {
      status: 401,
      response: { status: 401 },
    });
    (commonApiPost as jest.Mock).mockRejectedValueOnce(unauthorizedError);

    await expect(
      verifyActiveSessionV2WebSession({ address: "0xabc" })
    ).resolves.toBe(false);
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
      includeWalletAuth: false,
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

  it("creates a legacy desktop connection share with bearer auth and session credentials", async () => {
    const shareResponse = {
      refresh_token: "legacy-refresh-token",
      address: "0xabc",
      role: null,
      deep_link_path:
        "/accept-connection-sharing?token=legacy-refresh-token&address=0xabc",
    };
    const abortController = new AbortController();
    (commonApiPost as jest.Mock).mockResolvedValueOnce(shareResponse);

    await expect(
      createLegacyDesktopConnectionShare({ signal: abortController.signal })
    ).resolves.toBe(shareResponse);

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "auth/connection-share/legacy-desktop",
      body: {},
      credentials: "include",
      signal: abortController.signal,
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
