import { publicEnv } from "@/config/env";

/**
 * The one place that reads the configured 6529 API endpoint.
 *
 * Build API URLs with `apiUrl(path)`, or `getApiBase()` where a base is
 * needed (for example `new URL(path, getApiBase())`). Do not read
 * `publicEnv.API_ENDPOINT` anywhere else; a contract test enforces it
 * (`__tests__/contracts/api-endpoint-boundary.test.ts`).
 *
 * The endpoint list holds one entry today, built from `API_ENDPOINT` and
 * `WS_ENDPOINT`, so behavior matches the previous direct reads exactly. It
 * is the seam where a later step can add a gateway or a node, choose between
 * them, or fail over, and the WebSocket URL follows the same entry.
 *
 * Deliberately outside this list:
 * - `ALLOWLIST_API_ENDPOINT`: a separate service with its own API and auth.
 * - `IPFS_API_ENDPOINT` and `IPFS_GATEWAY_ENDPOINT`: content-addressed media.
 *   Any gateway can serve a CID and the client can verify it, so gateways
 *   need their own list and trust model.
 * - `BASE_ENDPOINT`: this app's own origin for same-origin route handlers.
 *
 * Server-side request signing (`lib/fetch/ssrFetch.ts`) applies only to the
 * primary endpoint's origin. A future entry run by anyone else must not
 * receive those signatures.
 */

type ApiEndpoint = {
  /** Base URL without the `/api` path, for example `https://api.6529.io`. */
  readonly baseUrl: string;
  /** WebSocket URL for the same backend. */
  readonly webSocketUrl: string;
};

/**
 * The public production API. A few callers pin it on purpose: link previews
 * and share cards that fall back to public data when the configured API
 * cannot serve them, and the unauthenticated Manifold mint distribution
 * lookup, which has always read production.
 */
export const PUBLIC_PRODUCTION_API_BASE = "https://api.6529.io";

// Partial env mocks in tests can omit API_ENDPOINT. Keep the historical
// fallback so deriving the WebSocket URL at module load never throws.
const deriveWebSocketUrl = (baseUrl: string | undefined): string =>
  publicEnv.WS_ENDPOINT ??
  baseUrl?.replace("https://api", "wss://ws") ??
  "wss://default-fallback-url";

// Read the env on every call: tests and runtime config changes replace
// `publicEnv` values after this module loads.
const getApiEndpoints = (): readonly [ApiEndpoint] => {
  const baseUrl = publicEnv.API_ENDPOINT;
  return [{ baseUrl, webSocketUrl: deriveWebSocketUrl(baseUrl) }];
};

/** Base URL of the primary 6529 API, exactly as configured. */
export const getApiBase = (): string => getApiEndpoints()[0].baseUrl;

/** Absolute URL for a path on the primary 6529 API, such as `/api/nfts`. */
export const apiUrl = (path: `/${string}`): string => `${getApiBase()}${path}`;

/** WebSocket URL of the primary 6529 API. */
export const getWebSocketUrl = (): string => getApiEndpoints()[0].webSocketUrl;
