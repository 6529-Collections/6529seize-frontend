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

  it("still fails on actionable console errors", () => {
    expect(() =>
      assertNoConsoleErrors(diagnostics(["Uncaught TypeError: boom"]))
    ).toThrow("Unexpected browser console error");
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
