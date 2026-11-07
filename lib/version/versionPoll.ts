/**
 * Adoption telemetry carried by the version poll (`/api/version`, same
 * origin, so the headers cost no CORS preflight). It describes the tab, never
 * the user: no profile, address or IP.
 */
export const VERSION_POLL_HEADERS = {
  version: "x-6529-client-version",
  hidden: "x-6529-client-hidden",
  ageMinutes: "x-6529-client-age-min",
  releasesBehind: "x-6529-client-releases-behind",
} as const;

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
  hidden: boolean
): Record<string, string> {
  const pageAgeMinutes =
    typeof performance === "undefined"
      ? 0
      : Math.floor(performance.now() / 60_000);
  return {
    [VERSION_POLL_HEADERS.version]: currentVersion,
    [VERSION_POLL_HEADERS.hidden]: hidden ? "1" : "0",
    [VERSION_POLL_HEADERS.ageMinutes]: String(pageAgeMinutes),
    [VERSION_POLL_HEADERS.releasesBehind]: String(announcedSinceLoad.size),
  };
}
