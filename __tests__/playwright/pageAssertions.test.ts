import {
  assertNoConsoleErrors,
  type PageDiagnostics,
} from "../../tests/support/consoleDiagnostics";

describe("Playwright page assertions", () => {
  function diagnostics(consoleErrors: string[]): PageDiagnostics {
    return {
      consoleErrors,
      pageErrors: [],
    };
  }

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
});
