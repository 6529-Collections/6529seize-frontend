import type { ApiTelemetryCountry } from "@/generated/models/ApiTelemetryCountry";

/**
 * The viewer's country from the 6529.io edge (backend #2331): CloudFront's
 * viewer-country header, read same-origin. It replaces
 * `policies/country-check`, which sent each visitor's IP address to
 * findip.net. The backend answers `{country: null, is_eu: true}` when it
 * cannot tell; that unknown answer keeps the cookie banner on and, through
 * `shouldHideSubscriptions`, keeps iOS purchasing restricted.
 */
export const VIEWER_COUNTRY_PATH = "/e/country";

export type ViewerCountry = {
  /** As the edge reported it; "" when unknown. Consumers normalize it. */
  readonly country: string;
  readonly is_eu: boolean;
};

/**
 * Resolves null when this host has no `/e/country` route (a 404, or an app
 * page instead of JSON): a local or test build without the CloudFront edge.
 * Callers treat that like a failed lookup (unknown country) without reporting
 * an error.
 */
export async function fetchViewerCountry(
  signal: AbortSignal
): Promise<ViewerCountry | null> {
  const response = await fetch(VIEWER_COUNTRY_PATH, {
    signal,
    credentials: "omit",
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  const isJson = (response.headers.get("content-type") ?? "").includes(
    "application/json"
  );
  // An app page (HTML 200 or 404) answering instead of the edge route: not
  // available on this host. A JSON error from the edge still throws below.
  if (!isJson && (response.ok || response.status === 404)) return null;
  if (!response.ok) {
    throw new Error(`Country lookup failed with status ${response.status}`);
  }
  let body: Partial<ApiTelemetryCountry> | null;
  try {
    body = (await response.json()) as Partial<ApiTelemetryCountry> | null;
  } catch {
    // A malformed body counts as no answer, like a missing route.
    return null;
  }
  const country = typeof body?.country === "string" ? body.country : "";
  // Anything but an explicit false counts as EU, like an unknown country.
  return { country, is_eu: body?.is_eu !== false };
}
