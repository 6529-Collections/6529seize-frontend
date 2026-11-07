import {
  getDownloadableReleases,
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
 * Only the newest release of each channel can be downloaded (the owner,
 * 2026-11-01 and 2026-11-04; per channel from 2026-11-06): an older release
 * stays in the feed and on the history page, with its SHA-256, but its files
 * are not handed out. A channel whose newest release the feed lists as
 * unsafe hands out none. /validator/download/<file> names no version and
 * gets the release the pages offer.
 */
function findRelease(
  releases: readonly ValidatorRelease[],
  segments: readonly string[]
): { release: ValidatorRelease; fileName: string } | null {
  const lists = (
    release: ValidatorRelease,
    fileName: string | null
  ): fileName is string =>
    fileName !== null && release.files.some((file) => file.name === fileName);
  if (segments.length === 1) {
    const offered = getOfferedRelease(releases);
    const fileName = decodeSegment(segments[0]);
    return offered && lists(offered, fileName)
      ? { release: offered, fileName }
      : null;
  }
  if (segments.length === 2) {
    const version = decodeSegment(segments[0]);
    const fileName = decodeSegment(segments[1]);
    const release = getDownloadableReleases(releases).find(
      (entry) => entry.version === version
    );
    return release && lists(release, fileName) ? { release, fileName } : null;
  }
  return null;
}

/**
 * Finds a file of a release the site hands out and presigns it. A file that
 * release does not list is never fetched, so the path cannot reach other
 * objects or an older release.
 *
 * Keep the shape: GET /validator/download/<version>/<file> answers 302 with
 * an https presigned URL. From rc.10 the validator's in-app update builds
 * that path from the signed feed's version folder and file name and follows
 * the redirect, so releases already installed depend on it.
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
