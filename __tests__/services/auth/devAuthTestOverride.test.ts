/** @jest-environment node */

import { getAddress } from "viem";

/**
 * The multi-user dev-auth test seam must be inert unless dev auth is on, the
 * build is development-like and the page is on localhost (D109 browser tests).
 */

const mockGetNodeEnv = jest.fn();
const mockPublicEnv: Record<string, string | null | undefined> = {
  USE_DEV_AUTH: "true",
  DEV_MODE_WALLET_ADDRESS: "0x0000000000000000000000000000000000000529",
  DEV_MODE_AUTH_JWT: "configured-dev-jwt",
};

jest.mock("@/config/env", () => ({
  getNodeEnv: mockGetNodeEnv,
  publicEnv: mockPublicEnv,
}));
jest.mock("@/services/auth/native-refresh-token-storage", () => ({
  removeNativeRefreshToken: jest.fn(),
}));

const {
  DEV_AUTH_TEST_OVERRIDE_KEYS,
  getDevAuthTestOverride,
  isLocalDevAuthTestSeamEnabled,
} = require("@/services/auth/devAuthTestOverride");
const { getAuthJwt, getWalletAddress } = require("@/services/auth/auth.utils");
const {
  getSeizeConnectImpersonation,
} = require("@/components/auth/seizeConnectImpersonation");

const OVERRIDE_WALLET = "0x00000000000000000000000000000000000e2e01";
const OVERRIDE_JWT = "override-jwt";
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

function setBrowser(hostname: string, items: Record<string, string> = {}) {
  const store = new Map(Object.entries(items));
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: { hostname },
      localStorage: { getItem: (key: string) => store.get(key) ?? null },
    },
  });
}

const overrideItems = {
  [DEV_AUTH_TEST_OVERRIDE_KEYS.wallet]: OVERRIDE_WALLET,
  [DEV_AUTH_TEST_OVERRIDE_KEYS.jwt]: OVERRIDE_JWT,
};

describe("dev-auth test override", () => {
  beforeEach(() => {
    mockGetNodeEnv.mockReturnValue("development");
    mockPublicEnv["USE_DEV_AUTH"] = "true";
    mockPublicEnv["DEV_MODE_WALLET_ADDRESS"] =
      "0x0000000000000000000000000000000000000529";
    mockPublicEnv["DEV_MODE_AUTH_JWT"] = "configured-dev-jwt";
    setBrowser("localhost", overrideItems);
  });

  afterAll(() => {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  it.each(["localhost", "127.0.0.1"])(
    "applies on %s with dev auth in a development build",
    (hostname) => {
      setBrowser(hostname, overrideItems);
      expect(isLocalDevAuthTestSeamEnabled()).toBe(true);
      expect(getDevAuthTestOverride()).toEqual({
        wallet: OVERRIDE_WALLET,
        jwt: OVERRIDE_JWT,
      });
      expect(getAuthJwt()).toBe(OVERRIDE_JWT);
      expect(getWalletAddress()).toBe(OVERRIDE_WALLET);
      expect(getSeizeConnectImpersonation().impersonatedAddress).toBe(
        getAddress(OVERRIDE_WALLET)
      );
    }
  );

  it.each([undefined, "", "false", "TRUE"])(
    "is inert when USE_DEV_AUTH is %p",
    (value) => {
      mockPublicEnv["USE_DEV_AUTH"] = value;
      expect(isLocalDevAuthTestSeamEnabled()).toBe(false);
      expect(getDevAuthTestOverride()).toBeNull();
      expect(getAuthJwt()).not.toBe(OVERRIDE_JWT);
      expect(
        getSeizeConnectImpersonation().impersonatedAddress
      ).toBeUndefined();
    }
  );

  it.each(["production", undefined, "staging"])(
    "is inert when NODE_ENV is %p",
    (nodeEnv) => {
      mockGetNodeEnv.mockReturnValue(nodeEnv);
      expect(getDevAuthTestOverride()).toBeNull();
      // Outside dev-like runtimes dev auth is off entirely (#4337), so neither
      // the override nor the configured dev values are used.
      expect(getAuthJwt()).not.toBe("configured-dev-jwt");
      expect(getWalletAddress()).not.toBe(
        "0x0000000000000000000000000000000000000529"
      );
    }
  );

  it.each([
    "6529.io",
    "staging.6529.io",
    "localhost.example.com",
    "192.168.1.20",
    "devbox.local",
    "[::1]",
  ])("is inert on the non-test host %s", (hostname) => {
    setBrowser(hostname, overrideItems);
    expect(isLocalDevAuthTestSeamEnabled()).toBe(false);
    expect(getDevAuthTestOverride()).toBeNull();
    expect(getAuthJwt()).toBe("configured-dev-jwt");
    expect(getWalletAddress()).toBe(
      "0x0000000000000000000000000000000000000529"
    );
  });

  it("is inert without a browser window (server rendering)", () => {
    Reflect.deleteProperty(globalThis, "window");
    expect(isLocalDevAuthTestSeamEnabled()).toBe(false);
    expect(getDevAuthTestOverride()).toBeNull();
  });

  it("requires both a valid wallet and a JWT", () => {
    setBrowser("localhost", {
      [DEV_AUTH_TEST_OVERRIDE_KEYS.wallet]: OVERRIDE_WALLET,
    });
    expect(getDevAuthTestOverride()).toBeNull();
    setBrowser("localhost", {
      [DEV_AUTH_TEST_OVERRIDE_KEYS.wallet]: "not-a-wallet",
      [DEV_AUTH_TEST_OVERRIDE_KEYS.jwt]: OVERRIDE_JWT,
    });
    expect(getDevAuthTestOverride()).toBeNull();
    expect(getAuthJwt()).toBe("configured-dev-jwt");
  });

  it("treats unreadable storage as no override", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { hostname: "localhost" },
        get localStorage() {
          throw new Error("blocked");
        },
      },
    });
    expect(getDevAuthTestOverride()).toBeNull();
  });
});
