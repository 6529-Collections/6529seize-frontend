import {
  decideReadonlyRequest,
  inferPlaywrightEnvironment,
  sanitizeReadonlyRequestUrl,
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

  it("blocks registered staging and production API mutations", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://staging.6529.io",
        method: "POST",
        readonly: true,
        url: "https://api.staging.6529.io/api/waves",
      })
    ).toMatchObject({
      action: "block",
      reason: "registered-mutation-endpoint",
      ruleId: "staging-backend-api-mutations",
    });

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

  it("allows safe methods", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "GET",
        readonly: true,
        url: "https://api.6529.io/waves",
      })
    ).toMatchObject({ action: "allow" });
  });

  it("aborts recognized external SDK POSTs without failing read-only mode", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://cca-lite.coinbase.com/metrics",
      })
    ).toMatchObject({
      action: "abort",
      reason: "ignored-external-sdk-endpoint",
    });

    expect(
      decideReadonlyRequest({
        baseURL: "https://staging.6529.io",
        method: "POST",
        readonly: true,
        url: "https://www.google.com/g/collect?v=2",
      })
    ).toMatchObject({
      action: "abort",
      reason: "ignored-external-sdk-endpoint",
    });

    expect(
      decideReadonlyRequest({
        baseURL: "https://staging.6529.io",
        method: "POST",
        readonly: true,
        url: "https://pulse.walletconnect.org/batch?projectId=test",
      })
    ).toMatchObject({
      action: "abort",
      reason: "ignored-external-sdk-endpoint",
    });
  });

  it("aborts same-origin telemetry POSTs without allowing external lookalikes", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://6529.io/monitoring?o=123&p=456",
      })
    ).toMatchObject({
      action: "abort",
      reason: "ignored-first-party-telemetry",
    });

    expect(
      decideReadonlyRequest({
        baseURL: "https://staging.6529.io",
        method: "POST",
        readonly: true,
        url: "https://staging.6529.io/monitoring/tunnel",
      })
    ).toMatchObject({
      action: "abort",
      reason: "ignored-first-party-telemetry",
    });

    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://example.com/monitoring",
      })
    ).toMatchObject({
      action: "block",
      reason: "non-allowlisted-mutation",
    });
  });

  it("blocks non-allowlisted external POSTs", () => {
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

    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://www.google.com/unknown-write",
      })
    ).toMatchObject({
      action: "block",
      reason: "non-allowlisted-mutation",
    });
  });

  it("allows only read-only WalletConnect RPC POSTs", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://staging.6529.io",
        method: "POST",
        postData: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "eth_chainId",
        }),
        readonly: true,
        url: "https://rpc.walletconnect.org/v1/?chainId=eip155%3A1",
      })
    ).toMatchObject({
      action: "allow",
      reason: "read-only-walletconnect-rpc",
    });

    expect(
      decideReadonlyRequest({
        baseURL: "https://staging.6529.io",
        method: "POST",
        postData: JSON.stringify([
          { id: 1, jsonrpc: "2.0", method: "eth_chainId" },
          { id: 2, jsonrpc: "2.0", method: "eth_call" },
        ]),
        readonly: true,
        url: "https://rpc.walletconnect.org/v1/?chainId=eip155%3A1",
      })
    ).toMatchObject({
      action: "allow",
      reason: "read-only-walletconnect-rpc",
    });

    expect(
      decideReadonlyRequest({
        baseURL: "https://staging.6529.io",
        method: "POST",
        postData: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "eth_sendRawTransaction",
        }),
        readonly: true,
        url: "https://rpc.walletconnect.org/v1/?chainId=eip155%3A1",
      })
    ).toMatchObject({
      action: "block",
      reason: "unsafe-walletconnect-rpc",
    });

    for (const postData of [undefined, "not-json", JSON.stringify([])]) {
      expect(
        decideReadonlyRequest({
          baseURL: "https://staging.6529.io",
          method: "POST",
          postData,
          readonly: true,
          url: "https://rpc.walletconnect.org/v1/?chainId=eip155%3A1",
        })
      ).toMatchObject({
        action: "block",
        reason: "unsafe-walletconnect-rpc",
      });
    }
  });

  it("redacts URL query strings in guard summaries", () => {
    expect(
      sanitizeReadonlyRequestUrl(
        "https://rpc.walletconnect.org/v1/?chainId=eip155%3A1&projectId=secret"
      )
    ).toBe("https://rpc.walletconnect.org/v1/?[redacted]");
  });

  it("does not attribute third-party API paths to first-party registry rules", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://cdn.example.com/api/track",
      })
    ).toMatchObject({
      action: "block",
      reason: "non-allowlisted-mutation",
    });
  });
});
