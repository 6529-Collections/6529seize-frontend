/**
 * @jest-environment node
 */
import { isAllowedE2eeGrantDomain } from "@/lib/e2ee/grant";

let mockNodeEnv: string | undefined = "test";
jest.mock("@/config/env", () => ({
  ...jest.requireActual("@/config/env"),
  getNodeEnv: () => mockNodeEnv,
}));

afterEach(() => {
  mockNodeEnv = "test";
});

describe("E2EE sign-in grant domains", () => {
  it.each(["6529.io", "staging.6529.io", "STAGING.6529.io"])(
    "accepts the app host %s",
    (domain) => {
      expect(isAllowedE2eeGrantDomain(domain)).toBe(true);
    }
  );

  it.each([
    "ipfs.6529.io",
    "IPFS.6529.io",
    "media.6529.io",
    "arweave.6529.io",
    "evil.staging.6529.io",
    "6529.io:443",
    "6529.io.evil.example",
    "evil.example/x.6529.io",
    "https://6529.io",
    "user@6529.io",
    "",
  ])("rejects %s", (domain) => {
    expect(isAllowedE2eeGrantDomain(domain)).toBe(false);
  });

  it("accepts local hosts only in development and test builds", () => {
    expect(isAllowedE2eeGrantDomain("localhost:3001")).toBe(true);
    expect(isAllowedE2eeGrantDomain("app.localhost")).toBe(true);
    for (const env of ["production", undefined]) {
      mockNodeEnv = env;
      expect(isAllowedE2eeGrantDomain("localhost:3001")).toBe(false);
      expect(isAllowedE2eeGrantDomain("127.0.0.1")).toBe(false);
      expect(isAllowedE2eeGrantDomain("6529.io")).toBe(true);
    }
  });
});
