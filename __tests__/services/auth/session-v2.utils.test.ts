import { Capacitor } from "@capacitor/core";
import { publicEnv } from "@/config/env";
import { commonApiPost } from "@/services/api/common-api";
import { setAuthJwt } from "@/services/auth/auth.utils";
import {
  getNativeRefreshToken,
  isNativeSecureStorageAvailable,
  removeNativeRefreshToken,
  setNativeRefreshToken,
} from "@/services/auth/native-refresh-token-storage";
import {
  logoutSessionV2,
  persistSessionResponse,
  refreshSessionV2,
} from "@/services/auth/session-v2.utils";

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
  WebPlugin: class {},
  registerPlugin: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
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
    publicEnv.AUTH_SESSION_V2_ENABLED = "false";
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (commonApiPost as jest.Mock).mockResolvedValue(undefined);
    (getNativeRefreshToken as jest.Mock).mockResolvedValue(null);
    (isNativeSecureStorageAvailable as jest.Mock).mockReturnValue(true);
    (setAuthJwt as jest.Mock).mockReturnValue(true);
  });

  it("rolls back a native refresh token when auth persistence fails", async () => {
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
    expect(removeNativeRefreshToken).toHaveBeenCalledWith("0xabc");
  });

  it("revokes a web session cookie when auth persistence fails", async () => {
    publicEnv.AUTH_SESSION_V2_ENABLED = "true";
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
        all_sessions: false,
      },
      credentials: "include",
      parseJson: false,
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
      },
      signal: undefined,
      credentials: "include",
      errorMode: "structured",
    });
  });

  it("revokes an existing native session even when the rollout flag is disabled", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (getNativeRefreshToken as jest.Mock).mockResolvedValue("native-refresh-token");

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

  it("does not call web session logout when session v2 is disabled", async () => {
    await logoutSessionV2({ address: "0xabc" });

    expect(commonApiPost).not.toHaveBeenCalled();
  });
});
