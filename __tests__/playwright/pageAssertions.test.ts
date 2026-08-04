import {
  assertNoConsoleErrors,
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
