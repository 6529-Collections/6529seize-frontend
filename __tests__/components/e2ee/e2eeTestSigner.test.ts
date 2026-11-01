/** @jest-environment node */

/**
 * The browser-test signature seam (D109) answers the enrollment prompt only
 * under dev auth, in a development-like build, on localhost; otherwise the
 * real wallet always signs.
 */

const mockGetNodeEnv = jest.fn();
const mockPublicEnv: Record<string, string | undefined> = {
  USE_DEV_AUTH: "true",
};

jest.mock("@/config/env", () => ({
  getNodeEnv: mockGetNodeEnv,
  publicEnv: mockPublicEnv,
}));
jest.mock("wagmi", () => ({
  usePublicClient: jest.fn(),
  useSignTypedData: jest.fn(),
}));
jest.mock("@/services/websocket/useWebSocket", () => ({
  useWebSocket: jest.fn(),
}));

const {
  E2EE_TEST_SIGNER_GLOBAL,
  getE2eeTestSigner,
} = require("@/components/e2ee/e2eeTestSigner");
const { signE2eeTypedData } = require("@/components/e2ee/useE2eeEngineDeps");

const typedData = {
  domain: { name: "6529 Encrypted Messages" },
  types: {},
  primaryType: "MlsDeviceGrant",
  message: { issuedAt: 1n },
};
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

function setHostname(hostname: string) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { hostname } },
  });
}

describe("E2EE test signer seam", () => {
  let testSigner: jest.Mock;

  beforeEach(() => {
    mockGetNodeEnv.mockReturnValue("development");
    mockPublicEnv["USE_DEV_AUTH"] = "true";
    setHostname("localhost");
    testSigner = jest.fn().mockResolvedValue("0xtestsig");
    Reflect.set(globalThis, E2EE_TEST_SIGNER_GLOBAL, testSigner);
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, E2EE_TEST_SIGNER_GLOBAL);
  });

  afterAll(() => {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  it("signs through the installed test signer on localhost dev auth", async () => {
    const wallet = jest.fn();
    await expect(signE2eeTypedData(wallet, typedData)).resolves.toBe(
      "0xtestsig"
    );
    expect(testSigner).toHaveBeenCalledWith(typedData);
    expect(wallet).not.toHaveBeenCalled();
  });

  it("rejects a test signer that returns no signature", async () => {
    testSigner.mockResolvedValue(undefined);
    await expect(signE2eeTypedData(jest.fn(), typedData)).rejects.toThrow(
      "E2EE test signer returned no signature"
    );
  });

  it.each([
    ["dev auth off", () => (mockPublicEnv["USE_DEV_AUTH"] = undefined)],
    ["dev auth false", () => (mockPublicEnv["USE_DEV_AUTH"] = "false")],
    ["production build", () => mockGetNodeEnv.mockReturnValue("production")],
    ["deployed host", () => setHostname("6529.io")],
    ["staging host", () => setHostname("staging.6529.io")],
    ["LAN host", () => setHostname("192.168.1.20")],
    ["no window", () => Reflect.deleteProperty(globalThis, "window")],
  ])("is inert with %s: the wallet signs", async (_label, arrange) => {
    arrange();
    expect(getE2eeTestSigner()).toBeNull();
    const wallet = jest.fn().mockResolvedValue("0xwallet");
    await expect(signE2eeTypedData(wallet, typedData)).resolves.toBe(
      "0xwallet"
    );
    expect(wallet).toHaveBeenCalledWith(typedData);
    expect(testSigner).not.toHaveBeenCalled();
  });

  it("is inert when the global is not a function", async () => {
    Reflect.set(globalThis, E2EE_TEST_SIGNER_GLOBAL, "0xnot-a-signer");
    expect(getE2eeTestSigner()).toBeNull();
    const wallet = jest.fn().mockResolvedValue("0xwallet");
    await expect(signE2eeTypedData(wallet, typedData)).resolves.toBe(
      "0xwallet"
    );
  });
});
