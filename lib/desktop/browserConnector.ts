/**
 * The 6529 Desktop browser connector: the desktop app opens
 * `http://localhost:<port>/browser-connector?...` in the system browser, the
 * user signs a 6529 Desktop sign-in challenge with a browser wallet there,
 * and the page hands the signature back to the app through the app's own
 * link scheme (`<scheme>://connector?data=...`).
 *
 * Everything that crosses either hop is untrusted: the page validates its
 * query, and the app validates the returned payload and matches it to a
 * request it made itself. No secret travels: the signature only proves that
 * the wallet holder asked to sign in, and only the app can turn it into a
 * session, through the desktop shell.
 */

/** The link schemes 6529 Desktop builds register (local, staging, production). */
const DESKTOP_SCHEMES = [
  "localcore6529",
  "stagingcore6529",
  "core6529",
] as const;

type DesktopScheme = (typeof DESKTOP_SCHEMES)[number];

export const BROWSER_CONNECTOR_PATH = "/browser-connector";
/** How long the user has to finish in the browser. */
export const BROWSER_CONNECTOR_TIMEOUT_MS = 120_000;

const REQUEST_ID = /^[A-Za-z0-9_-]{22,64}$/;
const ADDRESS = /^0x[0-9a-f]{40}$/;
const HEX_SIGNATURE = /^0x[0-9a-fA-F]{2,4096}$/;
// The API's server signature is opaque; bound its size and characters only.
const SERVER_SIGNATURE = /^[A-Za-z0-9+/=_.:-]{1,4096}$/;
const MAX_DEEP_LINK_DATA_LENGTH = 16_000;

export function normalizeDesktopScheme(value: unknown): DesktopScheme | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return (DESKTOP_SCHEMES as readonly string[]).includes(normalized)
    ? (normalized as DesktopScheme)
    : null;
}

export const isBrowserConnectorPath = (pathname: string | null): boolean =>
  pathname === BROWSER_CONNECTOR_PATH;

/** A fresh, unguessable request id (URL-safe). */
export function createBrowserConnectorRequestId(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCodePoint(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

/** The page the desktop app opens in the system browser. */
export function buildBrowserConnectorUrl({
  origin,
  scheme,
  requestId,
  expiresAt,
}: {
  readonly origin: string;
  readonly scheme: string;
  readonly requestId: string;
  readonly expiresAt: number;
}): string {
  const url = new URL(BROWSER_CONNECTOR_PATH, origin);
  url.searchParams.set("scheme", scheme);
  url.searchParams.set("request", requestId);
  url.searchParams.set("expires", String(expiresAt));
  return url.href;
}

type BrowserConnectorRequestProblem =
  | "invalid-scheme"
  | "wrong-build"
  | "invalid-request"
  | "expired";

export type BrowserConnectorRequest =
  | {
      readonly ok: true;
      readonly scheme: DesktopScheme;
      readonly requestId: string;
      readonly expiresAt: number;
    }
  | { readonly ok: false; readonly problem: BrowserConnectorRequestProblem };

/**
 * Validate the page's query. `buildScheme` is the scheme this local server
 * was built for, when the build sets one; a link for another build is
 * refused, so a signature never goes to a different 6529 Desktop.
 */
export function parseBrowserConnectorRequest(
  params: { get(name: string): string | null },
  now: number,
  buildScheme: string | undefined
): BrowserConnectorRequest {
  const scheme = normalizeDesktopScheme(params.get("scheme"));
  if (!scheme) return { ok: false, problem: "invalid-scheme" };
  const expectedScheme = normalizeDesktopScheme(buildScheme);
  if (expectedScheme !== null && expectedScheme !== scheme) {
    return { ok: false, problem: "wrong-build" };
  }
  const requestId = params.get("request") ?? "";
  const expiresAt = Number(params.get("expires"));
  if (!REQUEST_ID.test(requestId) || !Number.isSafeInteger(expiresAt)) {
    return { ok: false, problem: "invalid-request" };
  }
  if (expiresAt <= now || expiresAt > now + BROWSER_CONNECTOR_TIMEOUT_MS * 2) {
    return { ok: false, problem: "expired" };
  }
  return { ok: true, scheme, requestId, expiresAt };
}

/** What the page sends back to the app. */
interface BrowserConnectorResult {
  readonly requestId: string;
  readonly address: string;
  readonly serverSignature: string;
  readonly clientSignature: string;
}

export function buildBrowserConnectorDeepLink(
  scheme: DesktopScheme,
  result: BrowserConnectorResult
): string {
  const data = JSON.stringify({
    requestId: result.requestId,
    data: {
      kind: "desktop-sign-in",
      address: result.address,
      server_signature: result.serverSignature,
      client_signature: result.clientSignature,
    },
  });
  return `${scheme}://connector?data=${encodeURIComponent(data)}`;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Validate what the shell delivers from a `<scheme>://connector` link (the
 * parsed `data` JSON). Returns null for anything that is not a well-formed
 * desktop sign-in result; the caller still has to match the request id to a
 * request it made.
 */
export function parseBrowserConnectorResult(
  value: unknown
): BrowserConnectorResult | null {
  if (!isRecord(value)) return null;
  try {
    if (JSON.stringify(value).length > MAX_DEEP_LINK_DATA_LENGTH) return null;
  } catch {
    return null;
  }
  const { requestId, data } = value;
  if (typeof requestId !== "string" || !REQUEST_ID.test(requestId)) {
    return null;
  }
  if (!isRecord(data) || data["kind"] !== "desktop-sign-in") return null;
  const address = data["address"];
  const serverSignature = data["server_signature"];
  const clientSignature = data["client_signature"];
  if (
    typeof address !== "string" ||
    !ADDRESS.test(address.toLowerCase()) ||
    typeof serverSignature !== "string" ||
    !SERVER_SIGNATURE.test(serverSignature) ||
    typeof clientSignature !== "string" ||
    !HEX_SIGNATURE.test(clientSignature)
  ) {
    return null;
  }
  return {
    requestId,
    address: address.toLowerCase(),
    serverSignature,
    clientSignature,
  };
}
