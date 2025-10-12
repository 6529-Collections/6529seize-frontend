import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import {
  getAuthJwt,
  getStagingAuth,
  getWalletAddress,
  removeAuthJwt,
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
  beforeEach(() => {
    jest.resetAllMocks();
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
});
