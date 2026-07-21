/** @jest-environment node */

import { getAddress } from "viem";

const mockGetNodeEnv = jest.fn();
const mockGetAgentLoginActiveAddress = jest.fn();
const mockPublicEnv = {
  USE_DEV_AUTH: "false",
  DEV_MODE_WALLET_ADDRESS: "",
};

jest.mock("@/config/env", () => ({
  getNodeEnv: mockGetNodeEnv,
  publicEnv: mockPublicEnv,
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAgentLoginActiveAddress: mockGetAgentLoginActiveAddress,
}));

const {
  getSeizeConnectImpersonation,
} = require("@/components/auth/seizeConnectImpersonation");

describe("getSeizeConnectImpersonation", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const devAddress = "0x1111111111111111111111111111111111111111";
  const agentAddress = "0x2222222222222222222222222222222222222222";

  const setHostname = (hostname: string) => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: { hostname } },
    });
  };

  beforeEach(() => {
    mockGetNodeEnv.mockReturnValue("development");
    mockGetAgentLoginActiveAddress.mockReturnValue(null);
    mockPublicEnv.USE_DEV_AUTH = "false";
    mockPublicEnv.DEV_MODE_WALLET_ADDRESS = "";
    setHostname("localhost");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  it("disables impersonation outside development-like environments", () => {
    mockGetNodeEnv.mockReturnValue("production");
    mockPublicEnv.USE_DEV_AUTH = "true";
    mockPublicEnv.DEV_MODE_WALLET_ADDRESS = devAddress;
    mockGetAgentLoginActiveAddress.mockReturnValue(agentAddress);

    expect(getSeizeConnectImpersonation()).toEqual({
      agentLoginImpersonatedAddress: undefined,
      impersonatedAddress: undefined,
    });
  });

  it("disables impersonation on non-local hosts", () => {
    setHostname("6529.io");
    mockPublicEnv.USE_DEV_AUTH = "true";
    mockPublicEnv.DEV_MODE_WALLET_ADDRESS = devAddress;

    expect(getSeizeConnectImpersonation().impersonatedAddress).toBeUndefined();
  });

  it("uses the configured dev-auth wallet on a local host", () => {
    mockPublicEnv.USE_DEV_AUTH = "true";
    mockPublicEnv.DEV_MODE_WALLET_ADDRESS = devAddress;

    expect(getSeizeConnectImpersonation()).toEqual({
      agentLoginImpersonatedAddress: undefined,
      impersonatedAddress: getAddress(devAddress),
    });
    expect(mockGetAgentLoginActiveAddress).not.toHaveBeenCalled();
  });

  it("uses the active agent-login wallet when dev auth is disabled", () => {
    mockGetAgentLoginActiveAddress.mockReturnValue(agentAddress);

    expect(getSeizeConnectImpersonation()).toEqual({
      agentLoginImpersonatedAddress: getAddress(agentAddress),
      impersonatedAddress: getAddress(agentAddress),
    });
  });
});
