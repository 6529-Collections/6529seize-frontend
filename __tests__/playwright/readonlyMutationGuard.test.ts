import {
  decideReadonlyRequest,
  inferPlaywrightEnvironment,
  shouldUseReadonlyGuard,
} from "../../tests/support/readonlyMutationGuard";

describe("Playwright read-only mutation guard", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("enables read-only mode by default for staging and production", () => {
    expect(inferPlaywrightEnvironment("https://staging.6529.io")).toBe(
      "staging"
    );
    expect(inferPlaywrightEnvironment("https://6529.io")).toBe("production");
    expect(shouldUseReadonlyGuard("https://staging.6529.io")).toBe(true);
    expect(shouldUseReadonlyGuard("https://6529.io")).toBe(true);
    expect(shouldUseReadonlyGuard("http://localhost:3001")).toBe(false);
  });

  it("blocks registered production API mutations", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://api.6529.io/waves",
      })
    ).toMatchObject({
      action: "block",
      reason: "registered-mutation-endpoint",
      ruleId: "production-backend-api-mutations",
    });
  });

  it("blocks same-origin API mutations", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "DELETE",
        readonly: true,
        url: "https://6529.io/api/open-graph",
      })
    ).toMatchObject({
      action: "block",
      ruleId: "first-party-api-mutations",
    });
  });

  it("allows safe methods and the staging access unlock path", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "GET",
        readonly: true,
        url: "https://api.6529.io/waves",
      })
    ).toMatchObject({ action: "allow" });

    expect(
      decideReadonlyRequest({
        baseURL: "https://staging.6529.io",
        method: "POST",
        readonly: true,
        url: "https://staging.6529.io/access",
      })
    ).toMatchObject({
      action: "allow",
      reason: "staging-access-unlock",
    });
  });

  it("allows explicitly recognized external telemetry but blocks other POSTs", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://www.google-analytics.com/g/collect",
      })
    ).toMatchObject({
      action: "allow",
      reason: "allowed-telemetry-endpoint",
    });

    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://example.com/write",
      })
    ).toMatchObject({
      action: "block",
      reason: "non-allowlisted-mutation",
    });
  });
});
