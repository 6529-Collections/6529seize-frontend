import { getReleaseFeedSnapshot, type ValidatorRelease } from "./releaseFeed";
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

function findRelease(
  releases: readonly ValidatorRelease[],
  segments: readonly string[]
): { release: ValidatorRelease; fileName: string } | null {
  if (segments.length === 1) {
    const fileName = decodeSegment(segments[0]);
    const release = releases.find((candidate) =>
      candidate.files.some((file) => file.name === fileName)
    );
    return release && fileName ? { release, fileName } : null;
  }
  if (segments.length === 2) {
    const version = decodeSegment(segments[0]);
    const fileName = decodeSegment(segments[1]);
    const release = releases.find((candidate) => candidate.version === version);
    return release && fileName && release.files.some((f) => f.name === fileName)
      ? { release, fileName }
      : null;
  }
  return null;
}

/**
 * Finds a file in the release feed and presigns it. A file the feed does not
 * list is never fetched, so the path cannot reach other objects.
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
