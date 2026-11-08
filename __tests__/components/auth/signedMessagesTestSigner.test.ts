/** @jest-environment node */

/**
 * The browser-test seam for the signed-messages grant (one personal_sign)
 * answers only under dev auth, in a development-like build, on localhost;
 * everywhere else, production builds included, it is inert and the real
 * wallet signs. Production builds also refuse USE_DEV_AUTH altogether
 * (config/devAuthBuildGuard.ts).
 */

const mockGetNodeEnv = jest.fn();
const mockPublicEnv: Record<string, string | undefined> = {
  USE_DEV_AUTH: "true",
};

jest.mock("@/config/env", () => ({
  getNodeEnv: mockGetNodeEnv,
  publicEnv: mockPublicEnv,
}));

const {
  SIGNED_MESSAGES_TEST_SIGNER_GLOBAL,
  getSignedMessagesTestSigner,
} = require("@/components/auth/signedMessagesTestSigner");
const {
  E2EE_TEST_SIGNER_GLOBAL,
  getE2eeTestSigner,
} = require("@/components/e2ee/e2eeTestSigner");

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

function setHostname(hostname: string) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { hostname } },
  });
}

describe("signed-messages test signer seam", () => {
  let testSigner: jest.Mock;

  beforeEach(() => {
    mockGetNodeEnv.mockReturnValue("development");
    mockPublicEnv["USE_DEV_AUTH"] = "true";
    setHostname("localhost");
    testSigner = jest.fn().mockResolvedValue("0xtestsig");
    Reflect.set(globalThis, SIGNED_MESSAGES_TEST_SIGNER_GLOBAL, testSigner);
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, SIGNED_MESSAGES_TEST_SIGNER_GLOBAL);
    Reflect.deleteProperty(globalThis, E2EE_TEST_SIGNER_GLOBAL);
  });

  afterAll(() => {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  it("signs the sign-in message through the installed signer on localhost dev auth", async () => {
    const signer = getSignedMessagesTestSigner();
    expect(signer).not.toBeNull();
    await expect(signer("Sign in to 6529")).resolves.toBe("0xtestsig");
    expect(testSigner).toHaveBeenCalledWith("Sign in to 6529");
  });

  it("rejects a test signer that returns no signature", async () => {
    testSigner.mockResolvedValue(undefined);
    await expect(getSignedMessagesTestSigner()("message")).rejects.toThrow(
      "Signed messages test signer returned no signature"
    );
  });

  it("is compiled out of production bundles, whatever the runtime env says", () => {
    const original = process.env.NODE_ENV;
    try {
      Object.assign(process.env, { NODE_ENV: "production" });
      Reflect.set(globalThis, E2EE_TEST_SIGNER_GLOBAL, testSigner);
      expect(getSignedMessagesTestSigner()).toBeNull();
      expect(getE2eeTestSigner()).toBeNull();
    } finally {
      Object.assign(process.env, { NODE_ENV: original });
    }
    expect(getSignedMessagesTestSigner()).not.toBeNull();
  });

  it("is a separate seam from the E2EE typed-data signer", () => {
    expect(SIGNED_MESSAGES_TEST_SIGNER_GLOBAL).not.toBe(
      E2EE_TEST_SIGNER_GLOBAL
    );
    expect(getE2eeTestSigner()).toBeNull();
  });

  it.each([
    ["dev auth off", () => (mockPublicEnv["USE_DEV_AUTH"] = undefined)],
    ["dev auth false", () => (mockPublicEnv["USE_DEV_AUTH"] = "false")],
    ["production build", () => mockGetNodeEnv.mockReturnValue("production")],
    ["no NODE_ENV", () => mockGetNodeEnv.mockReturnValue(undefined)],
    ["deployed host", () => setHostname("6529.io")],
    ["staging host", () => setHostname("staging.6529.io")],
    ["LAN host", () => setHostname("192.168.1.20")],
    // Exact hosts only: a suffix, prefix or range match must not pass.
    ["a localhost subdomain", () => setHostname("foo.localhost")],
    ["a host that starts with localhost", () => setHostname("localhost.6529.io")],
    ["another loopback address", () => setHostname("127.0.0.2")],
    ["no window", () => Reflect.deleteProperty(globalThis, "window")],
    [
      "a global that is not a function",
      () =>
        Reflect.set(globalThis, SIGNED_MESSAGES_TEST_SIGNER_GLOBAL, "0xsig"),
    ],
  ])("is inert with %s", (_label, arrange) => {
    arrange();
    expect(getSignedMessagesTestSigner()).toBeNull();
    expect(testSigner).not.toHaveBeenCalled();
  });
});
