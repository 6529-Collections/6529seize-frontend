import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { safeLocalStorage } from "../../helpers/safeLocalStorage";
import {
  getAuthJwt,
  getStagingAuth,
  getWalletAddress,
  migrateCookiesToLocalStorage,
  removeAuthJwt,
  setAuthJwt,
} from "../../services/auth/auth.utils";

jest.mock("js-cookie", () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("jwt-decode", () => ({ jwtDecode: jest.fn() }));
jest.mock("../../helpers/safeLocalStorage", () => ({
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

  it("migrateCookiesToLocalStorage moves and removes cookies", () => {
    (Cookies.get as jest.Mock)
      .mockReturnValueOnce("addr")
      .mockReturnValueOnce("refresh")
      .mockReturnValueOnce("role");
    migrateCookiesToLocalStorage();
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "6529-wallet-address",
      "addr"
    );
    expect(Cookies.remove).toHaveBeenCalledWith("wallet-address");
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "6529-wallet-refresh-token",
      "refresh"
    );
    expect(Cookies.remove).toHaveBeenCalledWith("wallet-refresh-token");
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "6529-wallet-role",
      "role"
    );
    expect(Cookies.remove).toHaveBeenCalledWith("wallet-role");
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
  });
});
