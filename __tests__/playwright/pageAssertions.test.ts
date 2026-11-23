import {
  assertNoConsoleErrors,
  assertNoPageErrors,
  assertNoFailedResponses,
  type PageDiagnostics,
} from "../../tests/support/consoleDiagnostics";

function diagnostics(consoleErrors: string[]): PageDiagnostics {
  return {
    consoleErrors,
    pageErrors: [],
  };
}

describe("Playwright page assertions", () => {
  it("ignores browser-client blocked resource diagnostics", () => {
    expect(() =>
      assertNoConsoleErrors(
        diagnostics([
          "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector",
        ])
      )
    ).not.toThrow();
  });

  it("ignores blocked Coinbase analytics transport diagnostics", () => {
    expect(() =>
      assertNoConsoleErrors(
        diagnostics([
          "Analytics SDK: TypeError: Failed to fetch (cca-lite.coinbase.com)\n    at fetch",
        ])
      )
    ).not.toThrow();
  });

  it("does not suppress analytics failures without the known host", () => {
    expect(() =>
      assertNoConsoleErrors(
        diagnostics([
          "Analytics SDK: TypeError: Failed to fetch (museum.example)\n    at fetch",
        ])
      )
    ).toThrow("museum.example");
  });

  it("still fails on actionable console errors", () => {
    expect(() =>
      assertNoConsoleErrors(diagnostics(["Uncaught TypeError: boom"]))
    ).toThrow("Unexpected browser console error");
  });

  it("includes failed-response evidence with an actionable console error", () => {
    const result: PageDiagnostics = {
      consoleErrors: [
        "Failed to load resource: the server responded with a status of 502 ()",
      ],
      failedResponses: ["502 GET https://telemetry.example/metrics"],
      pageErrors: [],
    };

    expect(() => assertNoConsoleErrors(result)).toThrow(
      "502 GET https://telemetry.example/metrics"
    );
  });

  it("fails on a silent 5xx response", () => {
    const result: PageDiagnostics = {
      consoleErrors: [],
      failedResponses: ["502 GET https://6529.io/museum/network/collection"],
      pageErrors: [],
    };

    expect(() => assertNoFailedResponses(result)).toThrow(
      "502 GET https://6529.io/museum/network/collection"
    );
  });

  it("keeps explicit allowances scoped to matching messages", () => {
    expect(() =>
      assertNoConsoleErrors(
        diagnostics([
          "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
          "Uncaught TypeError: boom",
        ]),
        {
          allowedConsoleErrorPatterns: [
            /^Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)$/,
          ],
        }
      )
    ).toThrow("Uncaught TypeError: boom");
  });
});

describe("WebKit navigation-cancelled fetches", () => {
  const cancelledFetch =
    "Fetch API cannot load http://127.0.0.1:4001/api/dm-drops/unread/snapshot due to access control checks.\n    at sessionAwareFetch (http://localhost:3001/_next/static/chunks/services.js:1:1)";
  const navigationCancelled =
    "2026-11-23T01:04:27.781Z Load request cancelled GET fetch http://127.0.0.1:4001/api/v2/waves/pinned";
  const corsRejected =
    "2026-11-23T01:04:27.781Z Origin http://localhost:3001 is not allowed by Access-Control-Allow-Origin. Status code: 200 POST fetch http://127.0.0.1:4001/api/rpc";

  function pageDiagnostics(
    pageErrors: string[],
    networkFailures: string[],
    consoleErrors: string[] = []
  ): PageDiagnostics {
    return { consoleErrors, networkFailures, pageErrors };
  }

  it("does not fail on the access-control message when a navigation cancelled loads", () => {
    expect(() =>
      assertNoPageErrors(
        pageDiagnostics([cancelledFetch], [navigationCancelled])
      )
    ).not.toThrow();
  });

  it("fails on the same message without navigation-cancelled loads", () => {
    expect(() =>
      assertNoPageErrors(pageDiagnostics([cancelledFetch], []))
    ).toThrow("due to access control checks");
  });

  it("fails when a real CORS rejection appears in network failures", () => {
    expect(() =>
      assertNoPageErrors(
        pageDiagnostics([cancelledFetch], [navigationCancelled, corsRejected])
      )
    ).toThrow("due to access control checks");
  });

  it("fails when a real CORS rejection appears in the console", () => {
    expect(() =>
      assertNoPageErrors(
        pageDiagnostics(
          [cancelledFetch],
          [navigationCancelled],
          [
            "Origin http://localhost:3001 is not allowed by Access-Control-Allow-Origin. Status code: 200",
          ]
        )
      )
    ).toThrow("due to access control checks");
  });

  it("still fails on other page errors alongside a cancelled fetch", () => {
    let thrown: unknown;
    try {
      assertNoPageErrors(
        pageDiagnostics(
          [cancelledFetch, "TypeError: boom\n    at render"],
          [navigationCancelled]
        )
      );
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Error);
    const message = (thrown as Error).message;
    expect(message).toContain("TypeError: boom");
    expect(message).not.toContain("access control checks");
  });
});
