/**
 * Adoption telemetry carried by the version poll (`/api/version`, same
 * origin, so the headers cost no CORS preflight). It describes the tab, never
 * the user: no profile, address or IP.
 */
export const VERSION_POLL_HEADERS = {
  version: "x-6529-client-version",
  releaseOrder: "x-6529-client-release-order",
  hidden: "x-6529-client-hidden",
  ageMinutes: "x-6529-client-age-min",
  releasesBehind: "x-6529-client-releases-behind",
} as const;

export function parseReleaseOrder(value: unknown): number | null {
  const order =
    typeof value === "string" && /^[1-9]\d*$/.test(value)
      ? Number(value)
      : value;
  return typeof order === "number" && Number.isSafeInteger(order) && order > 0
    ? order
    : null;
}

/**
 * The page's build ID (its git SHA) when it is one, for reporting it beside
 * the poll: the app socket sends it as `client_version`.
 */
export function getClientBuildId(version: string | undefined): string | null {
  const normalized = version?.trim().toLowerCase() ?? "";
  return /^[0-9a-f]{7,40}$/.test(normalized) ? normalized : null;
}

// Distinct newer versions this page has been told about since it loaded: a
// lower bound on how many releases behind it is.
const announcedSinceLoad = new Set<string>();
const MAX_TRACKED_ANNOUNCEMENTS = 1_000;

/** Records the version the server announced in a poll response. */
export function noteAnnouncedVersion(
  currentVersion: string,
  announcedVersion: unknown
): void {
  if (
    typeof announcedVersion !== "string" ||
    announcedVersion.length === 0 ||
    announcedVersion === currentVersion ||
    announcedSinceLoad.size >= MAX_TRACKED_ANNOUNCEMENTS
  ) {
    return;
  }
  announcedSinceLoad.add(announcedVersion);
}

/** Headers for one version poll from this page. */
export function getVersionPollHeaders(
  currentVersion: string,
  hidden: boolean,
  releaseOrder: number | null = null
): Record<string, string> {
  const pageAgeMinutes =
    typeof performance === "undefined"
      ? 0
      : Math.floor(performance.now() / 60_000);
  return {
    [VERSION_POLL_HEADERS.version]: currentVersion,
    ...(releaseOrder === null
      ? {}
      : { [VERSION_POLL_HEADERS.releaseOrder]: String(releaseOrder) }),
    [VERSION_POLL_HEADERS.hidden]: hidden ? "1" : "0",
    [VERSION_POLL_HEADERS.ageMinutes]: String(pageAgeMinutes),
    [VERSION_POLL_HEADERS.releasesBehind]: String(announcedSinceLoad.size),
  };
}
