import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import {
  canStoreAnotherWalletAccount,
  getConnectedWalletAccounts,
  getAuthJwt,
  getRefreshToken,
  getStagingAuth,
  getWalletAddress,
  removeAuthJwt,
  setActiveWalletAccount,
  setAuthJwt,
  syncWalletRoleWithServer,
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
    expect(Cookies.set).toHaveBeenCalledWith("wallet-auth", "jwt", {
      secure: true,
      sameSite: "strict",
      expires: 2,
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

  it("setAuthJwt clears role storage when role is missing", () => {
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);
    setAuthJwt("Addr", "jwt", "refresh");
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(
      "6529-wallet-role"
    );
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith("auth-role-addr");
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
    publicEnv.USE_DEV_AUTH = "false";
    (Cookies.get as jest.Mock).mockReturnValue("cookie");
    expect(getAuthJwt()).toBe("cookie");
  });

  it("getStagingAuth returns cookie or env", () => {
    const { publicEnv } = require("@/config/env");
    (Cookies.get as jest.Mock).mockReturnValueOnce("c");
    expect(getStagingAuth()).toBe("c");
    (Cookies.get as jest.Mock).mockReturnValueOnce(undefined);
    publicEnv.STAGING_API_KEY = "e";
    expect(getStagingAuth()).toBe("e");
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

  it("removeAuthJwt clears storage and cookie", () => {
    (safeLocalStorage.getItem as jest.Mock).mockReturnValue("Addr");
    removeAuthJwt();
    expect(Cookies.remove).toHaveBeenCalledWith("wallet-auth", {
      secure: true,
      sameSite: "strict",
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
    expect(Cookies.set).toHaveBeenLastCalledWith("wallet-auth", "jwt-a", {
      secure: true,
      sameSite: "strict",
      expires: 2,
    });
    expect(
      getConnectedWalletAccounts().map((account) => account.address)
    ).toEqual(["0xAaA", "0xBbB"]);
  });

  it("removeAuthJwt promotes next connected account", () => {
    const storage = setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0x111", "jwt-1", "refresh-1", "role-1");
    setAuthJwt("0x222", "jwt-2", "refresh-2", "role-2");

    removeAuthJwt();

    expect(getWalletAddress()).toBe("0x111");
    expect(getRefreshToken()).toBe("refresh-1");
    expect(storage.get("6529-wallet-active-address")).toBe("0x111");
    const remainingAccounts = getConnectedWalletAccounts();
    expect(remainingAccounts).toHaveLength(1);
    expect(remainingAccounts[0]?.address).toBe("0x111");
  });

  it("enforces max connected profiles when adding new addresses", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0x001", "jwt-1", "refresh-1", "role-1");
    setAuthJwt("0x002", "jwt-2", "refresh-2", "role-2");
    setAuthJwt("0x003", "jwt-3", "refresh-3", "role-3");

    expect(canStoreAnotherWalletAccount()).toBe(false);
    expect(canStoreAnotherWalletAccount("0x004")).toBe(false);
    expect(canStoreAnotherWalletAccount("0x003")).toBe(true);
  });

  it("does not add a new account when already at max profiles", () => {
    setupStorageMocks();
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    jest.spyOn(Date, "now").mockReturnValue(0);

    setAuthJwt("0x001", "jwt-1", "refresh-1", "role-1");
    setAuthJwt("0x002", "jwt-2", "refresh-2", "role-2");
    setAuthJwt("0x003", "jwt-3", "refresh-3", "role-3");

    const didStore = setAuthJwt("0x004", "jwt-4", "refresh-4", "role-4");
    expect(didStore).toBe(false);
    expect(
      getConnectedWalletAccounts().map((account) => account.address)
    ).toEqual(["0x001", "0x002", "0x003"]);
  });
});
