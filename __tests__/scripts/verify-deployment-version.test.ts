const {
  STAGING_ACCESS_COOKIE_NAME,
  normalizeBaseUrl,
  resolveVersionEndpoint,
  verifyDeploymentVersion,
} = require("../../ops/scripts/verify-deployment-version.cjs");

const EXPECTED_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function response({
  status = 200,
  cacheControl = "no-store, must-revalidate",
  body = { version: EXPECTED_SHA },
} = {}) {
  return {
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "cache-control" ? cacheControl : null,
    },
    json: jest.fn().mockResolvedValue(body),
  };
}

function deterministicClock() {
  let tick = 0;
  return {
    now: () => `2026-06-22T00:00:0${tick++}.000Z`,
    monotonicNow: () => tick * 100,
  };
}

describe("verify-deployment-version", () => {
  it("normalizes deployment base URLs to an origin", () => {
    expect(normalizeBaseUrl("https://6529.io/some/path?token=secret")).toBe(
      "https://6529.io"
    );
    expect(resolveVersionEndpoint("https://6529.io")).toBe(
      "https://6529.io/api/version"
    );
  });

  it("rejects credential-bearing base URLs", () => {
    expect(() => normalizeBaseUrl("https://user:pass@6529.io")).toThrow(
      "--base-url must not include credentials"
    );
  });

  it("passes when /api/version returns the expected version with no-store", async () => {
    const clock = deterministicClock();
    const fetchImpl = jest.fn().mockResolvedValue(response());

    const result = await verifyDeploymentVersion({
      baseUrl: "https://6529.io",
      expectedVersion: EXPECTED_SHA,
      attempts: 1,
      delayMs: 1,
      timeoutMs: 100,
      fetchImpl,
      sleep: jest.fn(),
      ...clock,
    });

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://6529.io/api/version",
      expect.objectContaining({
        method: "GET",
        redirect: "manual",
      })
    );
    expect(result.evidence).toMatchObject({
      base_url: "https://6529.io",
      endpoint_path: "/api/version",
      expected_version: EXPECTED_SHA,
      actual_version: EXPECTED_SHA,
      matched: true,
      no_store: true,
      status: 200,
    });
  });

  it("retries until the live HTTP version matches the expected version", async () => {
    const clock = deterministicClock();
    const sleep = jest.fn().mockResolvedValue(undefined);
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        response({
          body: { version: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
        })
      )
      .mockResolvedValueOnce(response());

    const result = await verifyDeploymentVersion({
      baseUrl: "https://6529.io",
      expectedVersion: EXPECTED_SHA,
      attempts: 2,
      delayMs: 1,
      timeoutMs: 100,
      fetchImpl,
      sleep,
      ...clock,
    });

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(1);
    expect(result.evidence.attempt).toBe(2);
  });

  it("fails when the version never matches", async () => {
    const clock = deterministicClock();
    const fetchImpl = jest.fn().mockResolvedValue(
      response({
        body: { version: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
      })
    );

    const result = await verifyDeploymentVersion({
      baseUrl: "https://6529.io",
      expectedVersion: EXPECTED_SHA,
      attempts: 1,
      delayMs: 1,
      timeoutMs: 100,
      fetchImpl,
      sleep: jest.fn(),
      ...clock,
    });

    expect(result.ok).toBe(false);
    expect(result.evidence).toMatchObject({
      actual_version: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      matched: false,
      error: null,
    });
  });

  it("requires no-store cache control", async () => {
    const clock = deterministicClock();
    const fetchImpl = jest.fn().mockResolvedValue(
      response({
        cacheControl: "public, max-age=300",
      })
    );

    const result = await verifyDeploymentVersion({
      baseUrl: "https://6529.io",
      expectedVersion: EXPECTED_SHA,
      attempts: 1,
      delayMs: 1,
      timeoutMs: 100,
      fetchImpl,
      sleep: jest.fn(),
      ...clock,
    });

    expect(result.ok).toBe(false);
    expect(result.evidence).toMatchObject({
      no_store: false,
      cache_control: "public, max-age=300",
    });
  });

  it("sends staging access only to the staging host and omits it from evidence", async () => {
    const clock = deterministicClock();
    const fetchImpl = jest.fn().mockResolvedValue(response());

    const result = await verifyDeploymentVersion({
      baseUrl: "https://staging.6529.io",
      expectedVersion: EXPECTED_SHA,
      attempts: 1,
      delayMs: 1,
      timeoutMs: 100,
      env: { ["STAGING_" + "AUTH"]: "stage-test-code" },
      fetchImpl,
      sleep: jest.fn(),
      ...clock,
    });

    const headers = fetchImpl.mock.calls[0][1].headers;
    expect(headers.Cookie).toBe(
      `${STAGING_ACCESS_COOKIE_NAME}=stage-test-code`
    );
    expect(JSON.stringify(result.evidence)).not.toContain("stage-test-code");
  });
});
