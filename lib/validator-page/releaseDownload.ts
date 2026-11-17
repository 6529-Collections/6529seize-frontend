import {
  getOfferedRelease,
  getReleaseFeedSnapshot,
  type ValidatorRelease,
} from "./releaseFeed";
import { getReleaseObjectKey, presignReleaseObject } from "./releasesBucket";

/** A presigned URL works this long after the redirect. */
const DOWNLOAD_URL_TTL_SECONDS = 300;

type ReleaseDownloadResult =
  | { readonly state: "found"; readonly url: string }
  | { readonly state: "not-found" }
  | { readonly state: "unavailable" };

// Text files open in the browser; everything else downloads under its name.
const INLINE_TYPES: Readonly<Record<string, string>> = {
  SHA256SUMS: "text/plain; charset=utf-8",
  "release.json": "application/json; charset=utf-8",
};

function decodeSegment(segment: string | undefined): string | null {
  if (segment === undefined) {
    return null;
  }
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

/**
 * Older releases whose files can be downloaded again, by their own version
 * only: the owner put rc.15 back for download (2026-11-14).
 */
const ALSO_OFFERED: ReadonlySet<string> = new Set(["0.1.0-rc.15"]);

/**
 * The release a /download/<version>/<file> path names: the newest, or a
 * release in ALSO_OFFERED that the feed lists and doesn't list as unsafe.
 */
function releaseForVersion(
  releases: readonly ValidatorRelease[],
  newest: ValidatorRelease,
  version: string | null
): ValidatorRelease | undefined {
  if (version === newest.version) {
    return newest;
  }
  if (version === null || !ALSO_OFFERED.has(version)) {
    return undefined;
  }
  return releases.find(
    (entry) => entry.version === version && entry.unsafeReason === null
  );
}

/**
 * Only the newest release can be downloaded (the owner, 2026-11-01 and
 * 2026-11-04): an older test release stays in the feed and on the history
 * page, with its SHA-256, but its files are not handed out. A newest
 * release the feed lists as unsafe hands out none. The one exception is a
 * release in ALSO_OFFERED, under /download/<version>/<file>, while the feed
 * lists it and doesn't list it as unsafe.
 */
function findRelease(
  releases: readonly ValidatorRelease[],
  segments: readonly string[]
): { release: ValidatorRelease; fileName: string } | null {
  const newest = getOfferedRelease(releases);
  if (!newest) {
    return null;
  }
  const listed = (
    release: ValidatorRelease,
    fileName: string | null
  ): fileName is string =>
    fileName !== null && release.files.some((file) => file.name === fileName);
  if (segments.length === 1) {
    const fileName = decodeSegment(segments[0]);
    return listed(newest, fileName) ? { release: newest, fileName } : null;
  }
  if (segments.length === 2) {
    const version = decodeSegment(segments[0]);
    const fileName = decodeSegment(segments[1]);
    const release = releaseForVersion(releases, newest, version);
    return release && listed(release, fileName) ? { release, fileName } : null;
  }
  return null;
}

/**
 * Finds a file of the newest release in the feed, or of a release in
 * ALSO_OFFERED, and presigns it. A file that release does not list is never
 * fetched, so the path cannot reach other objects or another older release.
 */
export async function resolveReleaseDownload(
  segments: readonly string[]
): Promise<ReleaseDownloadResult> {
  const snapshot = await getReleaseFeedSnapshot();
  if (snapshot.state === "error") {
    return { state: "unavailable" };
  }
  const match = findRelease(snapshot.releases, segments);
  if (!match) {
    return { state: "not-found" };
  }
  const inlineType = INLINE_TYPES[match.fileName];
  const responseParams: Record<string, string> = inlineType
    ? {
        "response-content-type": inlineType,
        "response-content-disposition": "inline",
      }
    : {
        "response-content-disposition": `attachment; filename="${match.fileName}"`,
      };
  try {
    const url = await presignReleaseObject(
      getReleaseObjectKey(match.release.version, match.fileName),
      { expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS, responseParams }
    );
    return { state: "found", url };
  } catch (error) {
    console.warn(
      "[validator-page] could not sign a download",
      error instanceof Error ? error.message : error
    );
    return { state: "unavailable" };
  }
}
