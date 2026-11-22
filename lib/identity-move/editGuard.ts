import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { getBrowserLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isIdentityEditingPaused } from "./schedule";

const READ_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);

const RATING_PROXY_ACTIONS: ReadonlySet<string> = new Set([
  ApiProfileProxyActionType.AllocateRep,
  ApiProfileProxyActionType.AllocateCic,
]);

/**
 * Proxy actions that give REP or NIC for the grantor. Ratings move to the
 * 6529 Network, so from the freeze these can't be added; other proxy actions
 * keep working.
 */
export const isRatingProxyAction = (actionType: unknown): boolean =>
  typeof actionType === "string" && RATING_PROXY_ACTIONS.has(actionType);

const readActionType = (body: unknown): unknown => {
  if (typeof body !== "string") {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(body);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as { action_type?: unknown }).action_type
      : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Whether a request changes a profile, handle, classification, picture,
 * banner, statement, profile wave, REP or NIC rating, or adds a REP or NIC
 * proxy action. These move to the 6529 Network, and from the freeze the API
 * refuses them (423 IDENTITY_FROZEN): every write under `profiles`, and
 * `ratings`, `bulk-rep`, and `proxies/{id}/actions` with ALLOCATE_REP or
 * ALLOCATE_CIC. `segments` are the path segments after `/api/`.
 */
const isIdentityEdit = (
  segments: readonly string[],
  body: unknown
): boolean => {
  const [root, , leaf] = segments;
  if (root === "profiles") {
    return true;
  }
  if (root === "ratings" || root === "bulk-rep") {
    return segments.length === 1;
  }
  return (
    root === "proxies" &&
    segments.length === 3 &&
    leaf === "actions" &&
    isRatingProxyAction(readActionType(body))
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
  readonly body?: unknown;
}): void {
  if (READ_METHODS.has(request.method.toUpperCase())) {
    return;
  }
  const segments = getApiPathSegments(request.url);
  if (segments === null || !isIdentityEdit(segments, request.body)) {
    return;
  }
  if (isIdentityEditingPaused()) {
    throw new IdentityEditingPausedError();
  }
}
