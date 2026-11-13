import { assertNoDevAuthInDeployableBuild } from "@/config/devAuthBuildGuard";

describe("assertNoDevAuthInDeployableBuild", () => {
  const devAuth = {
    USE_DEV_AUTH: "true",
    DEV_MODE_AUTH_JWT: "dev-jwt",
    DEV_MODE_WALLET_ADDRESS: "0x0000000000000000000000000000000000000529",
  };

  it.each([
    "https://6529.io",
    "https://staging.6529.io",
    "https://alicestaging.6529.io",
    "http://192.168.1.20:3001",
  ])("fails a %s build that carries dev auth", (baseEndpoint) => {
    expect(() =>
      assertNoDevAuthInDeployableBuild({
        BASE_ENDPOINT: baseEndpoint,
        ...devAuth,
      })
    ).toThrow(
      "Dev auth settings (USE_DEV_AUTH, DEV_MODE_AUTH_JWT, DEV_MODE_WALLET_ADDRESS) are only allowed in local builds."
    );
  });

  it.each([
    ["USE_DEV_AUTH", "true"],
    ["DEV_MODE_AUTH_JWT", "dev-jwt"],
    ["DEV_MODE_WALLET_ADDRESS", "0xdev"],
  ])("fails on %s alone", (key, value) => {
    expect(() =>
      assertNoDevAuthInDeployableBuild({
        BASE_ENDPOINT: "https://staging.6529.io",
        [key]: value,
      })
    ).toThrow(`Dev auth settings (${key})`);
  });

  it("allows deployable builds without dev auth", () => {
    expect(() =>
      assertNoDevAuthInDeployableBuild({
        BASE_ENDPOINT: "https://6529.io",
        USE_DEV_AUTH: "false",
        DEV_MODE_AUTH_JWT: "   ",
        DEV_MODE_WALLET_ADDRESS: undefined,
      })
    ).not.toThrow();
  });

  it.each(["http://localhost:3001", "http://127.0.0.1:3001"])(
    "allows dev auth in a local %s build",
    (baseEndpoint) => {
      expect(() =>
        assertNoDevAuthInDeployableBuild({
          BASE_ENDPOINT: baseEndpoint,
          ...devAuth,
        })
      ).not.toThrow();
    }
  );
});
