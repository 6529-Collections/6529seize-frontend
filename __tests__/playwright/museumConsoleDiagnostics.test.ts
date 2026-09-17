import {
  assertNoConsoleErrors,
  assertNoFailedResponses,
  assertNoPageErrors,
  getActionableConsoleErrors,
} from "../../tests/support/consoleDiagnostics";
import { MUSEUM_SETTINGS_FETCH_ERROR_PATTERN } from "../../tests/support/museumConsoleDiagnostics";

const options = {
  allowedConsoleErrorPatterns: [MUSEUM_SETTINGS_FETCH_ERROR_PATTERN],
};
const prefix = "Failed to fetch seize settings TypeError: Failed to fetch";

describe("Museum settings console allowance", () => {
  it.each([
    prefix,
    `${prefix}\n    at fetch`,
    `${prefix} (api.6529.io)`,
    `${prefix} (api.6529.io)\n    at fetch`,
  ])("accepts the existing shell diagnostic: %s", (message) => {
    expect(() =>
      assertNoConsoleErrors(
        { consoleErrors: [message], pageErrors: [] },
        options
      )
    ).not.toThrow();
  });

  it.each([
    `${prefix} (museum.example)`,
    `${prefix} (api.6529.io.evil.example)`,
    `${prefix} (apiX6529Xio)`,
    `${prefix} (api.staging.6529.io)`,
    `${prefix} (https://api.6529.io/api/settings)`,
    `${prefix} (api.6529.io) unexpected error`,
    `${prefix} unexpectedly`,
    `Unexpected: ${prefix} (api.6529.io)`,
    "Failed to fetch seize settings Error: HTTP error! status: 502",
    "Failed to fetch seize settings SyntaxError: Unexpected token",
    "Failed to fetch Museum publication TypeError: Failed to fetch (api.6529.io)",
    "Failed to load resource: the server responded with a status of 502 ()",
    "Uncaught TypeError: boom",
  ])("keeps unexpected errors actionable: %s", (message) => {
    expect(
      getActionableConsoleErrors(
        { consoleErrors: [`${prefix} (api.6529.io)`, message], pageErrors: [] },
        options
      )
    ).toEqual([message]);
  });

  it("does not add a global console allowance", () => {
    expect(() =>
      assertNoConsoleErrors({
        consoleErrors: [`${prefix} (api.6529.io)`],
        pageErrors: [],
      })
    ).toThrow("Unexpected browser console error");
  });

  it("preserves independent 5xx and page-error failures", () => {
    const diagnostics = {
      consoleErrors: [`${prefix} (api.6529.io)`],
      failedResponses: ["502 GET https://api.6529.io/api/settings"],
      pageErrors: ["Uncaught TypeError: boom"],
    };
    expect(() => assertNoConsoleErrors(diagnostics, options)).not.toThrow();
    expect(() => assertNoFailedResponses(diagnostics)).toThrow("502 GET");
    expect(() => assertNoPageErrors(diagnostics)).toThrow("Uncaught TypeError");
  });
});
