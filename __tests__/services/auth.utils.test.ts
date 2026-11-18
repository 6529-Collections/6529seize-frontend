import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import {
  AGENT_LOGIN_ACTIVE_ADDRESS_STORAGE_KEY,
  AUTH_TOKEN_CHANGED_EVENT,
  canStoreAnotherWalletAccount,
  clearAllWalletAuth,
  clearAgentLoginActiveAddress,
  getAgentLoginActiveAddress,
  getConnectedWalletAccounts,
  getAuthJwt,
  getRefreshToken,
  getStagingAuth,
  getWalletAddress,
  hasActiveSessionV2Auth,
  invalidateAuthSessionForAddress,
  isAuthAddressAuthorized,
  PROFILE_SWITCHED_EVENT,
  removeAuthJwt,
  setAgentLoginActiveAddress,
  setActiveWalletAccount,
  setAuthJwt,
  syncConnectedWalletProfile,
  syncWalletAuthCookie,
  syncWalletRoleWithServer,
  WALLET_AUTH_COOKIE,
} from "@/services/auth/auth.utils";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

jest.mock("js-cookie", () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("jwt-decode", () => ({ jwtDecode: jest.fn() }));
jest.mock("@/helpers/safeLocalStorage", () => ({
  safeLocalStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));
jest.mock("@/services/auth/native-refresh-token-storage", () => ({
  removeNativeRefreshToken: jest.fn(),
}));

describe("auth.utils", () => {
  const setupStorageMocks = () => {
    const storage = new Map<string, string>();
    (safeLocalStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      storage.has(key) ? storage.get(key)! : null
    );
    (safeLocalStorage.setItem as jest.Mock).mockImplementation(
      (key: string, value: string) => {
        storage.set(key, value);
      }
    );
    (safeLocalStorage.removeItem as jest.Mock).mockImplementation(
      (key: string) => {
        storage.delete(key);
      }
    );
    return storage;
  };

  const maxConnectedProfileFixtures = [
    ["0x001", "jwt-1", "refresh-1", "role-1"],
    ["0x002", "jwt-2", "refresh-2", "role-2"],
    ["0x003", "jwt-3", "refresh-3", "role-3"],
    ["0x004", "jwt-4", "refresh-4", "role-4"],
    ["0x005", "jwt-5", "refresh-5", "role-5"],
  ] as const;

  const storeMaxConnectedProfiles = (): string[] => {
    for (const [
      address,
      jwt,
      refreshToken,
      role,
    ] of maxConnectedProfileFixtures) {
      setAuthJwt(address, jwt, refreshToken, role);
    }
    return maxConnectedProfileFixtures.map(([address]) => address);
  };

  beforeEach(() => {
    jest.resetAllMocks();
    const { publicEnv } = require("@/config/env");
    publicEnv.USE_DEV_AUTH = "false";
    publicEnv.DEV_MODE_AUTH_JWT = null;
    publicEnv.DEV_MODE_WALLET_ADDRESS = null;
  });

  it("setAuthJwt stores tokens and cookie", () => {
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);
    setAuthJwt("addr", "jwt", "refresh", "role");
    expect(Cookies.set).toHaveBeenCalledWith("__Host-wallet-auth", "jwt", {
      secure: true,
      sameSite: "strict",
      path: "/",
      expires: 2,
    });
    expect(Cookies.remove).toHaveBeenCalledWith("wallet-auth", {
      secure: true,
      sameSite: "strict",
      path: "/",
    });
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "6529-wallet-address",
      "addr"
    );
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "6529-wallet-refresh-token",
      "refresh"
    );
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "6529-wallet-role",
      "role"
    );
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "auth-role-addr",
      "role"
    );
  });

  it("emits an auth token changed event when the wallet auth cookie changes", () => {
    setupStorageMocks();
    const listener = jest.fn();
    globalThis.addEventListener(AUTH_TOKEN_CHANGED_EVENT, listener);
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("addr", "jwt", "refresh", "role");

    expect(listener).toHaveBeenCalledTimes(1);
    globalThis.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, listener);
  });

  it("does not emit an auth token changed event when the wallet auth cookie value is unchanged", () => {
    setupStorageMocks();
    const listener = jest.fn();
    globalThis.addEventListener(AUTH_TOKEN_CHANGED_EVENT, listener);
    (Cookies.get as jest.Mock).mockReturnValue("jwt");
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("addr", "jwt", "refresh", "role");

    expect(listener).not.toHaveBeenCalled();
    globalThis.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, listener);
  });

  it("setAuthJwt clears role storage when role is missing", () => {
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);
    setAuthJwt("Addr", "jwt", "refresh");
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(
      "6529-wallet-role"
    );
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith("auth-role-addr");
  });

  it("setAuthJwt supports web sessions without a refresh token", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    const didStore = setAuthJwt("0xAaA", "jwt-a", null, "role-a");

    expect(didStore).toBe(true);
    expect(getConnectedWalletAccounts()[0]).toEqual(
      expect.objectContaining({
        address: "0xAaA",
        refreshToken: null,
        jwt: "jwt-a",
      })
    );
    expect(getRefreshToken()).toBeNull();
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(
      "6529-wallet-refresh-token"
    );
  });

  it("setAuthJwt preserves an existing legacy refresh token during v2 web auth", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0xAaA", "legacy-jwt", "legacy-refresh", "role-a");
    const didStore = setAuthJwt("0xAaA", "v2-jwt", null, "role-a", {
      authSessionVersion: "v2",
    });

    expect(didStore).toBe(true);
    expect(getConnectedWalletAccounts()[0]).toEqual(
      expect.objectContaining({
        address: "0xAaA",
        refreshToken: "legacy-refresh",
        jwt: "v2-jwt",
        authSessionVersion: "v2",
      })
    );
    expect(getRefreshToken()).toBe("legacy-refresh");
  });

  it("syncWalletRoleWithServer stores server role", () => {
    syncWalletRoleWithServer("Admin", "0xABC");
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "6529-wallet-role",
      "Admin"
    );
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "auth-role-0xabc",
      "Admin"
    );
  });

  it("syncWalletRoleWithServer clears role when server role is missing", () => {
    syncWalletRoleWithServer(null, "0xAbC");
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(
      "6529-wallet-role"
    );
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith("auth-role-0xabc");
  });

  it("getAuthJwt prefers dev mode", () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.USE_DEV_AUTH = "true";
    publicEnv.DEV_MODE_AUTH_JWT = "dev";
    expect(getAuthJwt()).toBe("dev");

    jest.resetAllMocks();
    publicEnv.USE_DEV_AUTH = "false";
    (Cookies.get as jest.Mock).mockReturnValue("cookie");
    expect(getAuthJwt()).toBeNull();
    expect(Cookies.get).not.toHaveBeenCalled();
  });

  it("getAuthJwt falls back to the active account jwt when the cookie is unavailable", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);
    (Cookies.get as jest.Mock).mockReturnValue(undefined);

    setAuthJwt("0xAaA", "jwt-a", null, "role-a");

    expect(getAuthJwt()).toBe("jwt-a");
  });

  describe("session cookie", () => {
    const cookieJar = (cookies: Record<string, string>) => {
      (Cookies.get as jest.Mock).mockImplementation(
        (name: string) => cookies[name]
      );
    };
    const decodeAs = (claims: Record<string, Record<string, unknown>>) => {
      (jwtDecode as jest.Mock).mockImplementation(
        (jwt: string) => claims[jwt] ?? { exp: 86400 * 2 }
      );
    };

    beforeEach(() => {
      jest.spyOn(Date, "now").mockReturnValue(0);
    });

    it("uses the prefixed host-only cookie name", () => {
      expect(WALLET_AUTH_COOKIE).toBe("__Host-wallet-auth");
    });

    it("uses the cookie when it was issued for the active account", () => {
      setupStorageMocks();
      decodeAs({ "jwt-cookie": { sub: "0xaaa", exp: 86400 * 2 } });
      setAuthJwt("0xAaA", "jwt-a", null);
      cookieJar({ "__Host-wallet-auth": "jwt-cookie" });

      expect(getAuthJwt()).toBe("jwt-cookie");
    });

    it("ignores a cookie issued for another address", () => {
      setupStorageMocks();
      decodeAs({ "jwt-other": { sub: "0xbbb", exp: 86400 * 2 } });
      setAuthJwt("0xAaA", "jwt-a", null);
      cookieJar({ "__Host-wallet-auth": "jwt-other" });

      expect(getAuthJwt()).toBe("jwt-a");
    });

    it("ignores a cookie without a readable subject", () => {
      setupStorageMocks();
      decodeAs({ "jwt-no-sub": { exp: 86400 * 2 } });
      setAuthJwt("0xAaA", "jwt-a", null);
      cookieJar({ "__Host-wallet-auth": "jwt-no-sub" });
      expect(getAuthJwt()).toBe("jwt-a");

      (jwtDecode as jest.Mock).mockImplementation(() => {
        throw new Error("invalid token");
      });
      cookieJar({ "__Host-wallet-auth": "not-a-jwt" });
      expect(getAuthJwt()).toBe("jwt-a");
    });

    it("never reads the cookie name used before the prefix", () => {
      setupStorageMocks();
      decodeAs({ "jwt-legacy": { sub: "0xaaa", exp: 86400 * 2 } });
      setAuthJwt("0xAaA", "jwt-a", null);
      cookieJar({ "wallet-auth": "jwt-legacy" });

      expect(getAuthJwt()).toBe("jwt-a");
      expect(Cookies.get).not.toHaveBeenCalledWith("wallet-auth");
    });

    it("checks a cookie's subject once per token and address", () => {
      setupStorageMocks();
      decodeAs({ "jwt-memo": { sub: "0xaaa", exp: 86400 * 2 } });
      setAuthJwt("0xAaA", "jwt-a", null);
      cookieJar({ "__Host-wallet-auth": "jwt-memo" });
      (jwtDecode as jest.Mock).mockClear();

      expect(getAuthJwt()).toBe("jwt-memo");
      expect(getAuthJwt()).toBe("jwt-memo");
      expect(getAuthJwt()).toBe("jwt-memo");
      expect(
        (jwtDecode as jest.Mock).mock.calls.filter(
          ([jwt]) => jwt === "jwt-memo"
        )
      ).toHaveLength(1);

      setAuthJwt("0xBbB", "jwt-b", null);
      expect(getAuthJwt()).toBe("jwt-b");
    });

    it("returns no token without a stored account, whatever the cookies hold", () => {
      setupStorageMocks();
      decodeAs({ "jwt-cookie": { sub: "0xaaa", exp: 86400 * 2 } });
      cookieJar({
        "__Host-wallet-auth": "jwt-cookie",
        "wallet-auth": "jwt-cookie",
      });

      expect(getAuthJwt()).toBeNull();
    });

    it("migrates a stored session to the prefixed cookie without a token change event", () => {
      setupStorageMocks();
      decodeAs({});
      setAuthJwt("0xAaA", "jwt-a", null);
      jest.clearAllMocks();
      cookieJar({ "wallet-auth": "jwt-a" });
      const listener = jest.fn();
      globalThis.addEventListener(AUTH_TOKEN_CHANGED_EVENT, listener);

      syncWalletAuthCookie();

      expect(Cookies.set).toHaveBeenCalledWith("__Host-wallet-auth", "jwt-a", {
        secure: true,
        sameSite: "strict",
        path: "/",
        expires: 2,
      });
      expect(Cookies.remove).toHaveBeenCalledWith("wallet-auth", {
        secure: true,
        sameSite: "strict",
        path: "/",
      });
      expect(listener).not.toHaveBeenCalled();
      expect(Cookies.get).not.toHaveBeenCalledWith("wallet-auth");
      globalThis.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, listener);
    });

    it("removes both cookies when no stored session remains", () => {
      setupStorageMocks();
      cookieJar({ "__Host-wallet-auth": "stale", "wallet-auth": "stale" });

      syncWalletAuthCookie();

      expect(Cookies.set).not.toHaveBeenCalled();
      expect(Cookies.remove).toHaveBeenCalledWith("__Host-wallet-auth", {
        secure: true,
        sameSite: "strict",
        path: "/",
      });
      expect(Cookies.remove).toHaveBeenCalledWith("wallet-auth", {
        secure: true,
        sameSite: "strict",
        path: "/",
      });
    });

    it("does not touch cookies under development auth", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.USE_DEV_AUTH = "true";

      syncWalletAuthCookie();

      expect(Cookies.set).not.toHaveBeenCalled();
      expect(Cookies.remove).not.toHaveBeenCalled();
    });
  });

  it("tracks whether the active account was authenticated with session v2", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0xAaA", "jwt-a", null, "role-a", {
      authSessionVersion: "v2",
    });

    expect(hasActiveSessionV2Auth({ address: "0xaaa" })).toBe(true);
    expect(hasActiveSessionV2Auth({ address: "0xbbb" })).toBe(false);
  });

  it("returns the active agent-login address only when the marker matches session v2 auth", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0xAaA", "jwt-a", null, "role-a", {
      authSessionVersion: "v2",
    });
    setAgentLoginActiveAddress("0xaaa");

    expect(getAgentLoginActiveAddress()).toBe("0xAaA");

    setAgentLoginActiveAddress("0xbbb");

    expect(getAgentLoginActiveAddress()).toBeNull();
  });

  it("does not return an agent-login address for unmarked session v2 auth", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0xAaA", "jwt-a", null, "role-a", {
      authSessionVersion: "v2",
    });

    expect(getAgentLoginActiveAddress()).toBeNull();
  });

  it("clears the agent-login marker when the active account changes", () => {
    const storage = setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0xAaA", "jwt-a", null, "role-a", {
      authSessionVersion: "v2",
    });
    setAgentLoginActiveAddress("0xAaA");

    setAuthJwt("0xBbB", "jwt-b", null, "role-b", {
      authSessionVersion: "v2",
    });

    expect(storage.get(AGENT_LOGIN_ACTIVE_ADDRESS_STORAGE_KEY)).toBeUndefined();
    expect(getAgentLoginActiveAddress()).toBeNull();
  });

  it("clears the explicit agent-login marker", () => {
    const storage = setupStorageMocks();

    setAgentLoginActiveAddress("0xAaA");
    clearAgentLoginActiveAddress();

    expect(storage.get(AGENT_LOGIN_ACTIVE_ADDRESS_STORAGE_KEY)).toBeUndefined();
  });

  it("tracks session v2 auth per stored account instead of only the active account", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0xAaA", "jwt-a", null, "role-a", {
      authSessionVersion: "v2",
    });
    setAuthJwt("0xBbB", "jwt-b", null, "role-b", {
      authSessionVersion: "v2",
    });

    expect(getWalletAddress()).toBe("0xBbB");
    expect(hasActiveSessionV2Auth({ address: "0xaaa" })).toBe(true);
    expect(hasActiveSessionV2Auth({ address: "0xbbb" })).toBe(true);
    expect(hasActiveSessionV2Auth({ address: "0xccc" })).toBe(false);
  });

  it("getStagingAuth returns only the access cookie", () => {
    (Cookies.get as jest.Mock).mockReturnValueOnce("c");
    expect(getStagingAuth()).toBe("c");
    (Cookies.get as jest.Mock).mockReturnValueOnce(undefined);
    expect(getStagingAuth()).toBeNull();
  });

  describe("outside a development or test runtime", () => {
    const { publicEnv } = require("@/config/env");
    const originalNodeEnv = publicEnv.NODE_ENV;

    beforeEach(() => {
      publicEnv.NODE_ENV = "production";
      publicEnv.USE_DEV_AUTH = "true";
      publicEnv.DEV_MODE_AUTH_JWT = "dev-jwt";
      publicEnv.DEV_MODE_WALLET_ADDRESS = "0xDev";
    });

    afterEach(() => {
      publicEnv.NODE_ENV = originalNodeEnv;
    });

    it("ignores the dev auth jwt", () => {
      setupStorageMocks();
      (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
      jest.spyOn(Date, "now").mockReturnValue(0);
      setAuthJwt("0xAaA", "jwt-a", null);
      expect(getAuthJwt()).toBe("jwt-a");
    });

    it("ignores the dev auth wallet address", () => {
      (safeLocalStorage.getItem as jest.Mock).mockReturnValue("stored");
      expect(getWalletAddress()).toBe("stored");
    });

    it("does not authorize the dev auth address", () => {
      expect(
        isAuthAddressAuthorized({ address: "0xdev", connectedAccounts: [] })
      ).toBe(false);
    });
  });

  it("getWalletAddress respects dev mode and storage", () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.USE_DEV_AUTH = "true";
    publicEnv.DEV_MODE_WALLET_ADDRESS = "devaddr";
    expect(getWalletAddress()).toBe("devaddr");
    publicEnv.USE_DEV_AUTH = "false";
    (safeLocalStorage.getItem as jest.Mock).mockReturnValue("stored");
    expect(getWalletAddress()).toBe("stored");
  });

  it("authorizes a stored connected address", () => {
    expect(
      isAuthAddressAuthorized({
        address: "0xAbC",
        connectedAccounts: [{ address: "0xabc" }],
      })
    ).toBe(true);
  });

  it("authorizes a matching dev-auth address and jwt without stored accounts", () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.USE_DEV_AUTH = "true";
    publicEnv.DEV_MODE_WALLET_ADDRESS = "0xDev";
    publicEnv.DEV_MODE_AUTH_JWT = "dev-jwt";

    expect(
      isAuthAddressAuthorized({
        address: "0xdev",
        connectedAccounts: [],
      })
    ).toBe(true);
  });

  it("does not authorize dev auth when the active address differs", () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.USE_DEV_AUTH = "true";
    publicEnv.DEV_MODE_WALLET_ADDRESS = "0xDev";
    publicEnv.DEV_MODE_AUTH_JWT = "dev-jwt";

    expect(
      isAuthAddressAuthorized({
        address: "0xother",
        connectedAccounts: [],
      })
    ).toBe(false);
  });

  it("does not authorize dev auth when the jwt is missing", () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.USE_DEV_AUTH = "true";
    publicEnv.DEV_MODE_WALLET_ADDRESS = "0xDev";
    publicEnv.DEV_MODE_AUTH_JWT = null;

    expect(
      isAuthAddressAuthorized({
        address: "0xdev",
        connectedAccounts: [],
      })
    ).toBe(false);
  });

  it("removeAuthJwt clears storage and cookie", async () => {
    (safeLocalStorage.getItem as jest.Mock).mockReturnValue("Addr");
    await removeAuthJwt();
    expect(Cookies.remove).toHaveBeenCalledWith("__Host-wallet-auth", {
      secure: true,
      sameSite: "strict",
      path: "/",
    });
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(
      "6529-wallet-address"
    );
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(
      "6529-wallet-refresh-token"
    );
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(
      "6529-wallet-role"
    );
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith("auth-role-addr");
  });

  it("stores and switches multiple wallet accounts", () => {
    const storage = setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0xAaA", "jwt-a", "refresh-a", "role-a");
    setAuthJwt("0xBbB", "jwt-b", "refresh-b", "role-b");

    const accounts = getConnectedWalletAccounts();
    expect(accounts).toHaveLength(2);
    expect(accounts[0]?.address).toBe("0xAaA");
    expect(accounts[0]?.refreshToken).toBe("refresh-a");
    expect(accounts[1]?.address).toBe("0xBbB");
    expect(storage.get("6529-wallet-active-address")).toBe("0xBbB");
    expect(getWalletAddress()).toBe("0xBbB");
    expect(getRefreshToken()).toBe("refresh-b");

    const switched = setActiveWalletAccount("0xAaA");
    expect(switched).toBe(true);
    expect(storage.get("6529-wallet-active-address")).toBe("0xAaA");
    expect(getWalletAddress()).toBe("0xAaA");
    expect(getRefreshToken()).toBe("refresh-a");
    expect(Cookies.set).toHaveBeenLastCalledWith(
      "__Host-wallet-auth",
      "jwt-a",
      {
        secure: true,
        sameSite: "strict",
        path: "/",
        expires: 2,
      }
    );
    expect(
      getConnectedWalletAccounts().map((account) => account.address)
    ).toEqual(["0xAaA", "0xBbB"]);
  });

  it("removeAuthJwt promotes next connected account", async () => {
    const {
      removeNativeRefreshToken,
    } = require("@/services/auth/native-refresh-token-storage");
    const storage = setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0x111", "jwt-1", "refresh-1", "role-1");
    setAuthJwt("0x222", "jwt-2", "refresh-2", "role-2");

    await removeAuthJwt();

    expect(removeNativeRefreshToken).toHaveBeenCalledWith("0x222");
    expect(getWalletAddress()).toBe("0x111");
    expect(getRefreshToken()).toBe("refresh-1");
    expect(storage.get("6529-wallet-active-address")).toBe("0x111");
    const remainingAccounts = getConnectedWalletAccounts();
    expect(remainingAccounts).toHaveLength(1);
    expect(remainingAccounts[0]?.address).toBe("0x111");
  });

  it("invalidates one session without disconnecting its profile", async () => {
    const {
      removeNativeRefreshToken,
    } = require("@/services/auth/native-refresh-token-storage");
    const storage = setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0xAaA", "jwt-a", "refresh-a", "role-a", {
      authSessionVersion: "v2",
    });
    syncConnectedWalletProfile("0xAaA", "profile-1", "alice");
    setAgentLoginActiveAddress("0xaaa");

    await expect(invalidateAuthSessionForAddress("0xaaa")).resolves.toBe(true);

    expect(removeNativeRefreshToken).toHaveBeenCalledWith("0xAaA");
    expect(getWalletAddress()).toBe("0xAaA");
    expect(storage.get("6529-wallet-active-address")).toBe("0xAaA");
    expect(getConnectedWalletAccounts()).toEqual([
      expect.objectContaining({
        address: "0xAaA",
        jwt: null,
        refreshToken: null,
        role: "role-a",
        profileId: "profile-1",
        profileHandle: "alice",
        authSessionVersion: null,
      }),
    ]);
    expect(getAgentLoginActiveAddress()).toBeNull();
  });

  it("emits a profile switched event when removing auth promotes another account", async () => {
    setupStorageMocks();
    const listener = jest.fn();
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, listener);
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0x111", "jwt-1", "refresh-1", "role-1");
    setAuthJwt("0x222", "jwt-2", "refresh-2", "role-2");
    listener.mockClear();

    await removeAuthJwt();

    expect(listener).toHaveBeenCalledTimes(1);
    globalThis.removeEventListener(PROFILE_SWITCHED_EVENT, listener);
  });

  it("clearAllWalletAuth clears all accounts and cookie", async () => {
    const {
      removeNativeRefreshToken,
    } = require("@/services/auth/native-refresh-token-storage");
    const storage = setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0x111", "jwt-1", "refresh-1", "role-1");
    setAuthJwt("0x222", "jwt-2", "refresh-2", "role-2");
    expect(getConnectedWalletAccounts()).toHaveLength(2);
    expect(getWalletAddress()).toBe("0x222");

    await clearAllWalletAuth();

    expect(removeNativeRefreshToken).toHaveBeenCalledWith("0x111");
    expect(removeNativeRefreshToken).toHaveBeenCalledWith("0x222");
    expect(getConnectedWalletAccounts()).toHaveLength(0);
    expect(getWalletAddress()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(Cookies.remove).toHaveBeenCalledWith("__Host-wallet-auth", {
      secure: true,
      sameSite: "strict",
      path: "/",
    });
    expect(storage.get("6529-wallet-accounts")).toBeUndefined();
    expect(storage.get("6529-wallet-active-address")).toBeUndefined();
  });

  it("clearAllWalletAuth removes the stored role of every signed-out account", async () => {
    const storage = setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0x111", "jwt-1", "refresh-1", "role-1");
    setAuthJwt("0x222", "jwt-2", "refresh-2", "role-2");
    storage.set("auth-role-0x333", "role-3");
    expect(storage.get("auth-role-0x111")).toBe("role-1");
    expect(storage.get("auth-role-0x222")).toBe("role-2");

    await clearAllWalletAuth();

    expect(storage.has("auth-role-0x111")).toBe(false);
    expect(storage.has("auth-role-0x222")).toBe(false);
    expect(storage.get("auth-role-0x333")).toBe("role-3");
  });

  it("invalidating an expired session keeps the account's stored role", async () => {
    const storage = setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0x111", "jwt-1", "refresh-1", "role-1");

    await invalidateAuthSessionForAddress("0x111");

    expect(storage.get("auth-role-0x111")).toBe("role-1");
    expect(getConnectedWalletAccounts()).toHaveLength(1);
  });

  it("clearAllWalletAuth removes native token for legacy-only wallet address", async () => {
    const {
      removeNativeRefreshToken,
    } = require("@/services/auth/native-refresh-token-storage");
    const storage = setupStorageMocks();
    storage.set("6529-wallet-address", "0xlegacy");

    await clearAllWalletAuth();

    expect(removeNativeRefreshToken).toHaveBeenCalledWith("0xlegacy");
    expect(getConnectedWalletAccounts()).toHaveLength(0);
    expect(getWalletAddress()).toBeNull();
  });

  it("enforces max connected profiles when adding new addresses", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    storeMaxConnectedProfiles();

    expect(canStoreAnotherWalletAccount()).toBe(false);
    expect(canStoreAnotherWalletAccount("0x006")).toBe(false);
    expect(canStoreAnotherWalletAccount("0x005")).toBe(true);
    expect(
      canStoreAnotherWalletAccount("0x006", {
        allowAdditionalAccounts: false,
      })
    ).toBe(false);
    expect(
      canStoreAnotherWalletAccount("0x005", {
        allowAdditionalAccounts: false,
      })
    ).toBe(true);
  });

  it("allows the first account but blocks additional accounts when requested", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    expect(
      canStoreAnotherWalletAccount("0x001", {
        allowAdditionalAccounts: false,
      })
    ).toBe(true);

    setAuthJwt("0x001", "jwt-1", "refresh-1", "role-1");

    expect(
      canStoreAnotherWalletAccount("0x002", {
        allowAdditionalAccounts: false,
      })
    ).toBe(false);
    expect(
      canStoreAnotherWalletAccount("0x001", {
        allowAdditionalAccounts: false,
      })
    ).toBe(true);
  });

  it("does not add a new account when already at max profiles", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    const storedAddresses = storeMaxConnectedProfiles();

    const didStore = setAuthJwt("0x006", "jwt-6", "refresh-6", "role-6");
    expect(didStore).toBe(false);
    expect(
      getConnectedWalletAccounts().map((account) => account.address)
    ).toEqual(storedAddresses);
  });

  it("syncs and updates stored profile metadata for connected wallet accounts", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0xAaA", "jwt-a", "refresh-a", "role-a");
    syncConnectedWalletProfile("0xAaA", "profile-1", "alice");

    expect(getConnectedWalletAccounts()[0]).toEqual(
      expect.objectContaining({
        address: "0xAaA",
        profileId: "profile-1",
        profileHandle: "alice",
      })
    );

    // Re-auth should not wipe previously synced profile metadata.
    setAuthJwt("0xAaA", "jwt-a2", "refresh-a2", "role-a");
    expect(getConnectedWalletAccounts()[0]).toEqual(
      expect.objectContaining({
        address: "0xAaA",
        refreshToken: "refresh-a2",
        profileId: "profile-1",
        profileHandle: "alice",
      })
    );

    // Metadata updates should overwrite stale values.
    syncConnectedWalletProfile("0xAaA", "profile-2", "alice-updated");
    expect(getConnectedWalletAccounts()[0]).toEqual(
      expect.objectContaining({
        profileId: "profile-2",
        profileHandle: "alice-updated",
      })
    );
  });
});
