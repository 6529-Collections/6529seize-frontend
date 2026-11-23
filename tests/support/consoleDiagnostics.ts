export type PageDiagnostics = {
  consoleErrors: string[];
  failedResponses?: string[];
  networkFailures?: string[];
  pageErrors: string[];
};

type ConsoleErrorOptions = {
  allowedConsoleErrorPatterns?: RegExp[];
};

const BENIGN_CONSOLE_ERROR_PATTERNS = [
  /Failed to load resource: the server responded with a status of (403|404)/i,
  /net::ERR_ABORTED/i,
  /^Failed to load resource: net::ERR_BLOCKED_BY_CLIENT(?:\.[a-z]+)?$/i,
  /^Analytics SDK: TypeError: Failed to fetch \(cca-lite\.coinbase\.com\)(?:\n|$)/,
];

function isBenignConsoleError(message: string) {
  return BENIGN_CONSOLE_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

function isAllowedConsoleError(message: string, options: ConsoleErrorOptions) {
  return (options.allowedConsoleErrorPatterns ?? []).some((pattern) =>
    pattern.test(message)
  );
}

export function getActionableConsoleErrors(
  diagnostics: PageDiagnostics,
  options: ConsoleErrorOptions = {}
) {
  return diagnostics.consoleErrors.filter(
    (message) =>
      !isBenignConsoleError(message) && !isAllowedConsoleError(message, options)
  );
}

const WEBKIT_CANCELLED_FETCH_ERROR =
  /^Fetch API cannot load \S+ due to access control checks\.(?:\n|$)/;
const NAVIGATION_CANCELLED_LOAD = / Load request cancelled /;
const CORS_REJECTION = /Access-Control-Allow-Origin/;

// When a navigation tears down a page, Linux WebKit can report an in-flight
// cross-origin fetch as "Fetch API cannot load <url> due to access control
// checks" even though no CORS check failed. Treat that message as a
// cancellation only when the page shows navigation-cancelled loads and no
// real CORS rejection, which WebKit always reports with an
// Access-Control-Allow-Origin console error and request failure.
function isNavigationCancelledFetch(
  pageError: string,
  diagnostics: PageDiagnostics
) {
  if (!WEBKIT_CANCELLED_FETCH_ERROR.test(pageError)) {
    return false;
  }
  const networkFailures = diagnostics.networkFailures ?? [];
  return (
    networkFailures.some((failure) =>
      NAVIGATION_CANCELLED_LOAD.test(failure)
    ) &&
    !networkFailures.some((failure) => CORS_REJECTION.test(failure)) &&
    !diagnostics.consoleErrors.some((message) => CORS_REJECTION.test(message))
  );
}

function getActionablePageErrors(diagnostics: PageDiagnostics) {
  return diagnostics.pageErrors.filter(
    (pageError) => !isNavigationCancelledFetch(pageError, diagnostics)
  );
}

export function assertNoPageErrors(diagnostics: PageDiagnostics) {
  const actionable = getActionablePageErrors(diagnostics);
  if (actionable.length === 0) {
    return;
  }

  throw new Error(
    `Unexpected browser page error(s):\n${actionable.join("\n")}`
  );
}

export function assertNoFailedResponses(diagnostics: PageDiagnostics) {
  const failedResponses = diagnostics.failedResponses ?? [];
  if (failedResponses.length === 0) {
    return;
  }

  throw new Error(
    `Unexpected browser 5xx response(s):\n${failedResponses.join("\n")}`
  );
}

export function assertNoConsoleErrors(
  diagnostics: PageDiagnostics,
  options: ConsoleErrorOptions = {}
) {
  const actionable = getActionableConsoleErrors(diagnostics, options);

  if (actionable.length === 0) {
    return;
  }

  const failedResponses = diagnostics.failedResponses ?? [];
  const responseEvidence =
    failedResponses.length === 0
      ? ""
      : `\nFailed 5xx response(s):\n${failedResponses.join("\n")}`;

  throw new Error(
    `Unexpected browser console error(s):\n${actionable.join("\n")}${responseEvidence}`
  );
}
