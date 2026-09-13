import type { BrowserContext, Route } from "@playwright/test";

import {
  decideReadonlyRequest,
  inferPlaywrightEnvironment,
  installReadonlyMutationGuard,
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

  it("blocks notification mark-read mutations with a named registry rule", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "http://localhost:3001",
        method: "POST",
        readonly: true,
        url: "http://localhost:3000/api/notifications/read",
      })
    ).toMatchObject({
      action: "block",
      reason: "registered-mutation-endpoint",
      ruleId: "notification-read-all",
    });

    expect(
      decideReadonlyRequest({
        baseURL: "http://localhost:3101",
        method: "POST",
        readonly: true,
        url: "http://127.0.0.1:3000/api/notifications/read",
      })
    ).toMatchObject({
      action: "block",
      reason: "registered-mutation-endpoint",
      ruleId: "notification-read-all-loopback",
    });

    expect(
      decideReadonlyRequest({
        baseURL: "https://staging.6529.io",
        method: "POST",
        readonly: true,
        url: "https://api.staging.6529.io/api/notifications/read",
      })
    ).toMatchObject({
      action: "block",
      reason: "registered-mutation-endpoint",
      ruleId: "staging-notification-read-all",
    });

    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://api.6529.io/api/notifications/read",
      })
    ).toMatchObject({
      action: "block",
      reason: "registered-mutation-endpoint",
      ruleId: "production-notification-read-all",
    });
  });

  it("allows first-party read-only alchemy proxy POST lookups", () => {
    for (const url of [
      "https://api.6529.io/alchemy-proxy/contracts",
      "https://api.6529.io/alchemy-proxy/token-metadata",
      "https://api.staging.6529.io/alchemy-proxy/contracts",
      "https://api.staging.6529.io/alchemy-proxy/token-metadata",
    ]) {
      expect(
        decideReadonlyRequest({
          baseURL: "https://staging.6529.io",
          method: "POST",
          readonly: true,
          url,
        })
      ).toMatchObject({
        action: "allow",
        reason: "first-party-readonly-api-proxy",
      });
    }

    // Same read-proxy path on an unrelated host stays blocked.
    expect(
      decideReadonlyRequest({
        baseURL: "https://staging.6529.io",
        method: "POST",
        readonly: true,
        url: "https://example.com/alchemy-proxy/contracts",
      })
    ).toMatchObject({
      action: "block",
      reason: "non-allowlisted-mutation",
    });

    // Other POSTs on the first-party API host remain blocked.
    expect(
      decideReadonlyRequest({
        baseURL: "https://staging.6529.io",
        method: "POST",
        readonly: true,
        url: "https://api.staging.6529.io/drops",
      })
    ).toMatchObject({
      action: "block",
    });
  });

  it("allows same-origin read-only route handler POST lookups", () => {
    for (const url of [
      "https://6529.io/api/open-graph",
      "https://6529.io/api/twitter/preview",
      "https://6529.io/api/alchemy/contracts",
      "https://6529.io/api/alchemy/token-metadata",
      "https://6529.io/api/github-preview",
    ]) {
      expect(
        decideReadonlyRequest({
          baseURL: "https://6529.io",
          method: "POST",
          readonly: true,
          url,
        })
      ).toMatchObject({
        action: "allow",
        reason: "first-party-readonly-route-handler",
      });
    }

    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://example.com/api/open-graph",
      })
    ).toMatchObject({
      action: "block",
      reason: "non-allowlisted-mutation",
    });

    for (const url of [
      "https://csp.withgoogle.com/csp/script-inclusions/1a74b362328347702024274e29d77eb",
      "https://csp.withgoogle.com/csp/script-inclusions/1a74b362328347702024274e29d77eb55",
      "https://csp.withgoogle.com/csp/script-inclusions/1a74b362328347702024274e29d77eg5",
      "https://csp.withgoogle.com/csp/script-inclusions/1a74b362328347702024274e29d77eb5/",
    ]) {
      expect(
        decideReadonlyRequest({
          baseURL: "https://6529.io",
          method: "POST",
          readonly: true,
          url,
        })
      ).toMatchObject({
        action: "block",
        reason: "non-allowlisted-mutation",
      });
    }
  });

  it("aborts Next.js dev inspector stack-frame lookups without recording an app mutation", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "http://localhost:3001",
        method: "POST",
        readonly: true,
        url: "http://localhost:3001/__nextjs_original-stack-frames",
      })
    ).toMatchObject({
      action: "abort",
      reason: "ignored-next-dev-inspector",
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
        url: "https://region1.google-analytics.com/g/collect?v=2",
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
        url: "https://www.googletagmanager.com/td?cid=redacted",
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
        url: "https://www.youtube.com/api/stats/watchtime?ns=yt",
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
        url: "https://www.youtube.com/youtubei/v1/log_event?key=redacted",
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
        url: "https://youtube.com/api/stats/watchtime?ns=yt",
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
        url: "https://youtube.com/youtubei/v1/log_event?key=redacted",
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
        url: "https://youtube-nocookie.com/api/stats/watchtime?ns=yt",
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
        url: "https://youtube-nocookie.com/youtubei/v1/log_event?key=redacted",
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
        url: "https://www.youtube-nocookie.com/api/stats/watchtime?ns=yt",
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
        url: "https://jnn-pa.googleapis.com/$rpc/google.internal.waa.v1.Waa/GenerateIT",
      })
    ).toMatchObject({
      action: "abort",
      reason: "ignored-external-sdk-endpoint",
    });

    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://csp.withgoogle.com/csp/script-inclusions/1a74b362328347702024274e29d77eb5",
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

    for (const url of [
      "https://www.googletagmanager.com/td?id=G-123",
      "https://www.youtube.com/api/stats/watchtime",
      "https://youtube.com/api/stats/watchtime",
      "https://youtube.com/youtubei/v1/log_event?prettyPrint=false",
      "https://www.youtube-nocookie.com/api/stats/watchtime",
      "https://youtube-nocookie.com/youtubei/v1/log_event?prettyPrint=false",
      "https://jnn-pa.googleapis.com/$rpc/google.internal.waa.v1.Waa/GenerateIT",
      "https://csp.withgoogle.com/csp/script-inclusions/1A74B362328347702024274E29D77EB5",
    ]) {
      expect(
        decideReadonlyRequest({
          baseURL: "https://6529.io",
          method: "POST",
          readonly: true,
          url,
        })
      ).toMatchObject({
        action: "abort",
        reason: "ignored-external-sdk-endpoint",
      });
    }
  });

  it.each([
    "https://o123.ingest.sentry.io/api/456/envelope/",
    "https://o123.ingest.us.sentry.io/api/456/envelope/?sentry_key=test",
    "https://o123.ingest.de.sentry.io/api/456/envelope/",
    "https://o123.ingest.us.sentry.io:443/api/456/envelope/",
  ])("aborts a recognized Sentry envelope POST: %s", (url) => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url,
      })
    ).toEqual({
      action: "abort",
      reason: "ignored-external-sdk-endpoint",
    });
  });

  it.each([
    "http://o123.ingest.us.sentry.io/api/456/envelope/",
    "https://o123.ingest.us.sentry.io:8443/api/456/envelope/",
    "https://user@o123.ingest.us.sentry.io/api/456/envelope/",
    "https://:password@o123.ingest.us.sentry.io/api/456/envelope/",
    "https://o123.ingest.us.sentry.io.example.com/api/456/envelope/",
    "https://extra.o123.ingest.us.sentry.io/api/456/envelope/",
    "https://o123.ingest.eu.sentry.io/api/456/envelope/",
    "https://org.ingest.us.sentry.io/api/456/envelope/",
    "https://ingest.sentry.io/api/456/envelope/",
    "https://o123.ingest.sentry.io/api/456/store/",
    "https://o123.ingest.us.sentry.io/api/456/envelope",
    "https://o123.ingest.us.sentry.io/api/456/envelope/extra",
    "https://o123.ingest.us.sentry.io/api/project/envelope/",
    "https://o123.ingest.us.sentry.io/api/456/envelope-mutation/",
    "https://o123.ingest.us.sentry.io/api/0/projects/",
  ])("records Sentry endpoint near-matches as blocked mutations: %s", (url) => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url,
      })
    ).toEqual({ action: "block", reason: "non-allowlisted-mutation" });
  });

  it.each(["PUT", "PATCH", "DELETE"])(
    "does not suppress %s requests to the Sentry envelope endpoint",
    (method) => {
      expect(
        decideReadonlyRequest({
          baseURL: "https://6529.io",
          method,
          readonly: true,
          url: "https://o123.ingest.us.sentry.io/api/456/envelope/",
        })
      ).toEqual({ action: "block", reason: "non-allowlisted-mutation" });
    }
  );

  it("keeps registered mutations ahead of Sentry telemetry suppression", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://o123.ingest.us.sentry.io",
        method: "POST",
        readonly: true,
        url: "https://o123.ingest.us.sentry.io/api/456/envelope/",
      })
    ).toMatchObject({
      action: "block",
      reason: "registered-mutation-endpoint",
      ruleId: "first-party-api-mutations",
    });
  });

  it("drops Sentry telemetry without hiding or sending business mutations", async () => {
    const routeHandler = jest.fn();
    const context = { route: routeHandler } as unknown as BrowserContext;
    const guard = await installReadonlyMutationGuard(
      context,
      "https://6529.io"
    );
    const handleRoute = routeHandler.mock.calls[0][1] as (
      route: Route
    ) => Promise<void>;
    const abort = jest.fn().mockResolvedValue(undefined);
    const continueRequest = jest.fn().mockResolvedValue(undefined);
    const makeRoute = (url: string) =>
      ({
        request: () => ({
          method: () => "POST",
          postData: () => null,
          url: () => url,
        }),
        abort,
        continue: continueRequest,
      }) as unknown as Route;

    await handleRoute(
      makeRoute("https://o123.ingest.us.sentry.io/api/456/envelope/")
    );
    expect(abort).toHaveBeenCalledWith("blockedbyclient");
    expect(guard.blockedRequests).toEqual([]);
    expect(() => guard.assertNoBlockedRequests()).not.toThrow();

    await handleRoute(makeRoute("https://api.6529.io/drops"));
    expect(guard.blockedRequests).toEqual([
      expect.objectContaining({
        method: "POST",
        url: "https://api.6529.io/drops",
      }),
    ]);
    expect(() => guard.assertNoBlockedRequests()).toThrow(
      "Read-only Playwright run blocked 1 mutation request(s)"
    );
    expect(abort).toHaveBeenCalledTimes(2);
    expect(continueRequest).not.toHaveBeenCalled();
  });

  it("aborts exact Google CSP script-inclusion reports", () => {
    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://csp.withgoogle.com/csp/script-inclusions/1a74b362328347702024274e29d77eb5",
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
        url: "https://youtube.com/youtubei/v1/player?key=redacted",
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
        url: "https://youtube-nocookie.com/youtubei/v1/player?key=redacted",
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

    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        readonly: true,
        url: "https://csp.withgoogle.com/csp/script-inclusions/not-a-report-id",
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

  it("allows only read-only public Ethereum RPC POSTs", () => {
    for (const url of [
      "https://eth.llamarpc.com/",
      "https://cloudflare-eth.com/",
      "https://ethereum-rpc.publicnode.com/",
      "https://eth.drpc.org/",
      "https://rpc.flashbots.net/",
    ]) {
      expect(
        decideReadonlyRequest({
          baseURL: "https://6529.io",
          method: "POST",
          postData: JSON.stringify([
            { id: 1, jsonrpc: "2.0", method: "eth_chainId" },
            { id: 2, jsonrpc: "2.0", method: "eth_call" },
          ]),
          readonly: true,
          url,
        })
      ).toMatchObject({
        action: "allow",
        reason: "read-only-ethereum-rpc",
      });

      for (const method of ["eth_sendRawTransaction", "eth_sendTransaction"]) {
        expect(
          decideReadonlyRequest({
            baseURL: "https://6529.io",
            method: "POST",
            postData: JSON.stringify({
              id: 1,
              jsonrpc: "2.0",
              method,
            }),
            readonly: true,
            url,
          })
        ).toMatchObject({
          action: "block",
          reason: "unsafe-ethereum-rpc",
        });
      }
    }

    expect(
      decideReadonlyRequest({
        baseURL: "https://6529.io",
        method: "POST",
        postData: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "eth_chainId",
        }),
        readonly: true,
        url: "https://rpc.example.com/",
      })
    ).toMatchObject({
      action: "block",
      reason: "non-allowlisted-mutation",
    });
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
