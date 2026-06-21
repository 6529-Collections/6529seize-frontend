export type PageDiagnostics = {
  consoleErrors: string[];
  pageErrors: string[];
};

type ConsoleErrorOptions = {
  allowedConsoleErrorPatterns?: RegExp[];
};

const BENIGN_CONSOLE_ERROR_PATTERNS = [
  /Failed to load resource: the server responded with a status of (403|404)/i,
  /net::ERR_ABORTED/i,
  /^Failed to load resource: net::ERR_BLOCKED_BY_CLIENT(?:\.[a-z]+)?$/i,
];

function isBenignConsoleError(message: string) {
  return BENIGN_CONSOLE_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

function isAllowedConsoleError(
  message: string,
  options: ConsoleErrorOptions
) {
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

export function assertNoPageErrors(diagnostics: PageDiagnostics) {
  if (diagnostics.pageErrors.length === 0) {
    return;
  }

  throw new Error(
    `Unexpected browser page error(s):\n${diagnostics.pageErrors.join("\n")}`
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

  throw new Error(
    `Unexpected browser console error(s):\n${actionable.join("\n")}`
  );
}
