/**
 * Hostnames of Sentry's hosted ingest endpoints (default, US and EU regions),
 * as they appear in a public DSN such as `https://<key>@o123.ingest.us.sentry.io/456`.
 *
 * Shared by the CSP report builder in `config/securityHeaders.ts` and the
 * read-only E2E mutation guard in `tests/support/readonlyMutationGuard.ts`,
 * so the host a browser posts CSP reports to is always one the guard ignores.
 */
export const SENTRY_INGEST_HOSTNAME_PATTERN =
  /^o\d+\.ingest(?:\.(?:us|de))?\.sentry\.io$/;
