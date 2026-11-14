import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
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
  loginWithSessionV2,
  logoutSessionV2,
  persistSessionResponse,
  redeemConnectionShare,
  refreshSessionV2,
} from "@/services/auth/session-v2.utils";
import type { DesktopNativeAuthSessionResponse } from "@/types/desktop-shell";

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
  WebPlugin: class {
    readonly pluginName = "mock";
  },
  registerPlugin: jest.fn(),
}));

jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock("@/services/notifications/push-installation", () => ({
  queueNativePushLogout: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(),
  getWalletAddress: jest.fn(),
  setAuthJwt: jest.fn(() => true),
}));

const ADDRESS = "0x1111111111111111111111111111111111111111";

const desktopSession = (
  overrides: Partial<DesktopNativeAuthSessionResponse> = {}
): DesktopNativeAuthSessionResponse => ({
  client_type: "desktop",
  address: ADDRESS,
  role: null,
  access_token: "desktop-access-token",
  access_token_expires_at: "2026-11-14T00:00:00.000Z",
  native_refresh_token: "",
  refresh_token_expires_at: "2026-12-14T00:00:00.000Z",
  ...overrides,
});

const createNativeAuth = () => ({
  sessionLogin: jest.fn().mockResolvedValue(desktopSession()),
  sessionRefresh: jest.fn().mockResolvedValue(desktopSession()),
  sessionLogout: jest.fn().mockResolvedValue(undefined),
  removeRefreshToken: jest.fn().mockResolvedValue(undefined),
  createConnectionShare: jest.fn().mockResolvedValue({
    connection_share_code: "share-code",
    expires_at: "2026-11-14T00:00:00.000Z",
    address: ADDRESS,
    role: null,
    target_client_type: "native",
    deep_link_path: "/accept-connection-sharing",
  }),
  createLegacyDesktopConnectionShare: jest.fn().mockResolvedValue({
    refresh_token: "legacy-share-token",
    address: ADDRESS,
    role: null,
    deep_link_path: "/accept-connection-sharing",
  }),
  redeemConnectionShare: jest.fn().mockResolvedValue(desktopSession()),
});

let nativeAuth: ReturnType<typeof createNativeAuth>;

const setBridge = (key: "api" | "nativeAuth", value: unknown) => {
  Object.defineProperty(window, key, {
    configurable: true,
    writable: true,
    value,
  });
};

describe("desktop sessions through window.nativeAuth", () => {
  beforeEach(() => {
    __resetSessionRefreshStateForTests();
    jest.clearAllMocks();
    nativeAuth = createNativeAuth();
    setBridge("api", { openExternal: jest.fn() });
    setBridge("nativeAuth", nativeAuth);
    jest.mocked(getAuthJwt).mockReturnValue("page-access-token");
    jest.mocked(getWalletAddress).mockReturnValue(ADDRESS);
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
  });

  it("signs in through the shell instead of calling the API from the page", async () => {
    const response = await loginWithSessionV2({
      serverSignature: "server-signature",
      clientSignature: "client-signature",
      signerAddress: ADDRESS,
      role: "0x2222222222222222222222222222222222222222",
      deviceLabel: "ignored on desktop",
    });

    expect(nativeAuth.sessionLogin).toHaveBeenCalledWith({
      client_type: "desktop",
      server_signature: "server-signature",
      client_signature: "client-signature",
      client_address: ADDRESS,
      role: "0x2222222222222222222222222222222222222222",
    });
    expect(commonApiPost).not.toHaveBeenCalled();
    expect(response.native_refresh_token).toBe("");
  });

  it("stores the access token without touching page refresh-token storage", async () => {
    await expect(persistSessionResponse(desktopSession())).resolves.toBe(true);

    expect(SecureStoragePlugin.set).not.toHaveBeenCalled();
  });

  it("refreshes through the shell", async () => {
    await expect(refreshSessionV2({ address: ADDRESS })).resolves.toEqual(
      desktopSession()
    );

    expect(nativeAuth.sessionRefresh).toHaveBeenCalledWith({
      client_type: "desktop",
      client_address: ADDRESS,
    });
    expect(commonApiPost).not.toHaveBeenCalled();
    expect(commonApiFetch).not.toHaveBeenCalled();
  });

  it("treats a 401 from the shell as a signed-out session", async () => {
    nativeAuth.sessionRefresh.mockResolvedValue({
      kind: "native-auth-api-error",
      status: 401,
      message: "Unauthorized",
    });

    await expect(refreshSessionV2({ address: ADDRESS })).resolves.toBeNull();
  });

  it("keeps the status and Retry-After of a rate-limited refresh", async () => {
    nativeAuth.sessionRefresh.mockResolvedValue({
      kind: "native-auth-api-error",
      status: 429,
      message: "Too many requests",
      retryAfter: "30",
    });

    const error = await refreshSessionV2({ address: ADDRESS }).catch(
      (caught: unknown) => caught
    );

    expect(error).toMatchObject({ status: 429, message: "Too many requests" });
    expect((error as { headers: Headers }).headers.get("Retry-After")).toBe(
      "30"
    );
  });

  it("rejects a refresh for a different wallet", async () => {
    nativeAuth.sessionRefresh.mockResolvedValue(
      desktopSession({ address: "0x3333333333333333333333333333333333333333" })
    );

    await expect(refreshSessionV2({ address: ADDRESS })).rejects.toThrow(
      "Session refresh returned a different wallet"
    );
  });

  it("lets the shell finish a refresh when the only caller stops waiting", async () => {
    let resolveRefresh: (
      value: DesktopNativeAuthSessionResponse
    ) => void = () => undefined;
    nativeAuth.sessionRefresh.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      })
    );
    const caller = new AbortController();

    const firstCaller = refreshSessionV2({
      address: ADDRESS,
      abortSignal: caller.signal,
    });
    caller.abort();
    await expect(firstCaller).rejects.toMatchObject({ name: "AbortError" });

    // The in-flight shell refresh is shared, not cancelled: a new caller joins
    // it instead of starting a second rotation.
    const secondCaller = refreshSessionV2({ address: ADDRESS });
    resolveRefresh(desktopSession());

    await expect(secondCaller).resolves.toEqual(desktopSession());
    expect(nativeAuth.sessionRefresh).toHaveBeenCalledTimes(1);
  });

  it("logs out through the shell and drops the shell's refresh token", async () => {
    await logoutSessionV2({ address: ADDRESS, allSessions: true });

    expect(nativeAuth.sessionLogout).toHaveBeenCalledWith({
      access_token: "page-access-token",
      client_type: "desktop",
      client_address: ADDRESS,
      all_sessions: true,
    });
    expect(nativeAuth.removeRefreshToken).toHaveBeenCalledWith({
      client_type: "desktop",
      client_address: ADDRESS,
    });
    expect(commonApiPost).not.toHaveBeenCalled();
  });

  it("still drops the refresh token when shell logout fails", async () => {
    nativeAuth.sessionLogout.mockRejectedValue(new Error("offline"));

    await expect(logoutSessionV2({ address: ADDRESS })).rejects.toThrow(
      "offline"
    );
    expect(nativeAuth.removeRefreshToken).toHaveBeenCalledWith({
      client_type: "desktop",
      client_address: ADDRESS,
    });
  });

  it("creates connection shares through the shell", async () => {
    await createConnectionShare({ encryptedDeviceSetup: "sealed-setup" });

    expect(nativeAuth.createConnectionShare).toHaveBeenCalledWith({
      access_token: "page-access-token",
      target_client_type: "native",
      encrypted_device_setup: "sealed-setup",
      client_type: "desktop",
      client_address: ADDRESS,
    });
    expect(commonApiPost).not.toHaveBeenCalled();
  });

  it("creates legacy desktop shares through the shell", async () => {
    await createLegacyDesktopConnectionShare({});

    expect(nativeAuth.createLegacyDesktopConnectionShare).toHaveBeenCalledWith({
      access_token: "page-access-token",
      client_type: "desktop",
      client_address: ADDRESS,
    });
    expect(commonApiPost).not.toHaveBeenCalled();
  });

  it("redeems connection shares as a desktop session through the shell", async () => {
    const response = await redeemConnectionShare("share-code");

    expect(nativeAuth.redeemConnectionShare).toHaveBeenCalledWith({
      access_token: "page-access-token",
      connection_share_code: "share-code",
      target_client_type: "desktop",
    });
    expect(response).toMatchObject({
      client_type: "desktop",
      native_refresh_token: "",
      encrypted_device_setup: null,
    });
    expect(commonApiPost).not.toHaveBeenCalled();
  });

  describe("bridge result validation", () => {
    const failure = {
      kind: "native-auth-api-error",
      status: 403,
      message: "Forbidden",
    };
    const login = () =>
      loginWithSessionV2({
        serverSignature: "server-signature",
        clientSignature: "client-signature",
        signerAddress: ADDRESS,
        role: null,
      });
    const cases = [
      {
        name: "sessionLogin",
        mock: () => nativeAuth.sessionLogin,
        call: login,
      },
      {
        name: "createConnectionShare",
        mock: () => nativeAuth.createConnectionShare,
        call: () => createConnectionShare({}),
      },
      {
        name: "createLegacyDesktopConnectionShare",
        mock: () => nativeAuth.createLegacyDesktopConnectionShare,
        call: () => createLegacyDesktopConnectionShare({}),
      },
      {
        name: "redeemConnectionShare",
        mock: () => nativeAuth.redeemConnectionShare,
        call: () => redeemConnectionShare("share-code"),
      },
    ] as const;

    it.each(cases)(
      "turns a failure-shaped $name result into a status error",
      async ({ mock, call }) => {
        mock().mockResolvedValue(failure);

        await expect(call()).rejects.toMatchObject({
          status: 403,
          message: "Forbidden",
        });
      }
    );

    it.each(cases)(
      "rejects a malformed $name result",
      async ({ name, mock, call }) => {
        mock().mockResolvedValue({ address: ADDRESS });

        await expect(call()).rejects.toThrow(
          `Invalid desktop ${name} response`
        );
      }
    );

    it.each(cases)(
      "rejects a non-object $name result",
      async ({ mock, call }) => {
        mock().mockResolvedValue(null);

        await expect(call()).rejects.toThrow(
          "Invalid desktop sign-in bridge response"
        );
      }
    );

    it("rejects a session that carries a refresh token into the page", async () => {
      nativeAuth.sessionLogin.mockResolvedValue({
        ...desktopSession(),
        native_refresh_token: "leaked-refresh-token",
      });

      await expect(login()).rejects.toThrow(
        "Invalid desktop sessionLogin response"
      );
    });

    it("drops unknown fields from a session result", async () => {
      nativeAuth.sessionLogin.mockResolvedValue({
        ...desktopSession(),
        unexpected: "value",
      });

      await expect(login()).resolves.toEqual(desktopSession());
    });

    it("keeps the device setup returned with a redeemed share", async () => {
      nativeAuth.redeemConnectionShare.mockResolvedValue({
        ...desktopSession(),
        encrypted_device_setup: "v1.sealed",
      });

      await expect(redeemConnectionShare("share-code")).resolves.toMatchObject({
        encrypted_device_setup: "v1.sealed",
      });
    });
  });

  it("fails clearly when the shell lacks a sign-in method", async () => {
    setBridge("nativeAuth", { sessionLogin: jest.fn() });

    await expect(refreshSessionV2({ address: ADDRESS })).rejects.toThrow(
      "Desktop sign-in bridge method sessionRefresh is unavailable"
    );
  });
});

describe("refresh-token storage in the desktop shell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nativeAuth = createNativeAuth();
    setBridge("api", { openExternal: jest.fn() });
    setBridge("nativeAuth", nativeAuth);
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
  });

  it("never writes or reads refresh tokens in the page", async () => {
    expect(isNativeSecureStorageAvailable()).toBe(true);

    await setNativeRefreshToken({
      address: ADDRESS,
      refreshToken: "must-not-be-stored",
    });

    await expect(getNativeRefreshToken(ADDRESS)).resolves.toBeNull();
    expect(SecureStoragePlugin.set).not.toHaveBeenCalled();
    expect(SecureStoragePlugin.get).not.toHaveBeenCalled();
  });

  it("removes refresh tokens through the shell", async () => {
    await removeNativeRefreshToken(ADDRESS);

    expect(nativeAuth.removeRefreshToken).toHaveBeenCalledWith({
      client_type: "desktop",
      client_address: ADDRESS,
    });
    expect(SecureStoragePlugin.remove).not.toHaveBeenCalled();
  });

  it("is unavailable in a plain browser", () => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");

    expect(isNativeSecureStorageAvailable()).toBe(false);
  });
});
