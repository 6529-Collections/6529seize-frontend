import { getBrowserLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isIdentityEditingPaused } from "./schedule";

const READ_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Whether an API path (the segments after `/api/`) changes a profile, handle,
 * classification, picture, banner, statement, REP or NIC rating, or proxy.
 * From the freeze these move to the 6529 Network, and the API refuses them:
 * `profiles`, `profiles/{id}/pfp`, `profiles/{id}/cic/statements[/{id}]`,
 * `profiles/{id}/rep/rating`, `profiles/{id}/cic/rating`, `ratings`,
 * `bulk-rep` and everything under `proxies`.
 */
const isIdentityEditPath = (segments: readonly string[]): boolean => {
  const [root, , kind, leaf] = segments;
  if (root === "proxies") {
    return true;
  }
  if (root === "ratings" || root === "bulk-rep") {
    return segments.length === 1;
  }
  if (root !== "profiles") {
    return false;
  }
  if (segments.length === 1) {
    return true;
  }
  if (segments.length === 3) {
    return kind === "pfp";
  }
  if (kind === "cic" && leaf === "statements") {
    return segments.length <= 5;
  }
  return (
    segments.length === 4 &&
    (kind === "rep" || kind === "cic") &&
    leaf === "rating"
  );
};

const getApiPathSegments = (url: string): string[] | null => {
  let pathname: string;
  try {
    pathname = new URL(url, "http://localhost").pathname;
  } catch {
    return null;
  }
  const [prefix, ...segments] = pathname.split("/").filter(Boolean);
  return prefix === "api" && segments.length > 0 ? segments : null;
};

class IdentityEditingPausedError extends Error {
  constructor() {
    super(t(getBrowserLocale(), "identityMove.paused"));
    this.name = "IdentityEditingPausedError";
  }
}

/**
 * Throws `IdentityEditingPausedError`, without sending anything, for an edit
 * of identity data while 6529.io's own edits are closed for the move to the
 * 6529 Network. Reads and every other route are sent as before.
 */
export function assertIdentityEditAllowed(request: {
  readonly url: string;
  readonly method: string;
}): void {
  if (READ_METHODS.has(request.method.toUpperCase())) {
    return;
  }
  const segments = getApiPathSegments(request.url);
  if (segments === null || !isIdentityEditPath(segments)) {
    return;
  }
  if (isIdentityEditingPaused()) {
    throw new IdentityEditingPausedError();
  }
}
