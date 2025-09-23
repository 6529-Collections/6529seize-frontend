import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import {
  migrateCookiesToLocalStorage,
  removeAuthJwt,
  setAuthJwt,
} from "@/services/auth/auth.utils";
import { withMockedEnv } from "@/tests/utils/mock-env";
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
  });

  it("getAuthJwt prefers dev mode", () => {
    withMockedEnv(
      {
        USE_DEV_AUTH: "true",
        DEV_MODE_AUTH_JWT: "dev",
      },
      () => {
        jest.isolateModules(() => {
          const { getAuthJwt } = require("@/services/auth/auth.utils");
          expect(getAuthJwt()).toBe("dev");
        });
      }
    );

    withMockedEnv(
      {
        USE_DEV_AUTH: "false",
      },
      () => {
        jest.isolateModules(() => {
          const CookiesMod = require("js-cookie");
          (CookiesMod.get as jest.Mock).mockReturnValue("cookie");
          const { getAuthJwt } = require("@/services/auth/auth.utils");
          expect(getAuthJwt()).toBe("cookie");
        });
      }
    );
  });

  it("getStagingAuth returns cookie or env", () => {
    // 1) Cookie takes precedence
    jest.isolateModules(() => {
      const CookiesMod = require("js-cookie");
      (CookiesMod.get as jest.Mock).mockReturnValueOnce("c");
      const { getStagingAuth } = require("@/services/auth/auth.utils");
      expect(getStagingAuth()).toBe("c");
    });

    // 2) When cookie is absent, falls back to env
    withMockedEnv({ STAGING_API_KEY: "e" }, () => {
      jest.isolateModules(() => {
        const CookiesMod = require("js-cookie");
        (CookiesMod.get as jest.Mock).mockReturnValueOnce(undefined);
        const { getStagingAuth } = require("@/services/auth/auth.utils");
        expect(getStagingAuth()).toBe("e");
      });
    });
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
    // 1) Dev mode uses DEV_MODE_WALLET_ADDRESS
    withMockedEnv(
      {
        USE_DEV_AUTH: "true",
        DEV_MODE_WALLET_ADDRESS: "devaddr",
      },
      () => {
        jest.isolateModules(() => {
          const { getWalletAddress } = require("@/services/auth/auth.utils");
          expect(getWalletAddress()).toBe("devaddr");
        });
      }
    );

    // 2) Non-dev mode reads from safeLocalStorage
    withMockedEnv({ USE_DEV_AUTH: "false" }, () => {
      jest.isolateModules(() => {
        const { safeLocalStorage: SLS } = require("@/helpers/safeLocalStorage");
        (SLS.getItem as jest.Mock).mockReturnValue("stored");
        const { getWalletAddress } = require("@/services/auth/auth.utils");
        expect(getWalletAddress()).toBe("stored");
      });
    });
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
