import {
  getAiReleaseFeedSnapshot,
  getNewestAiRelease,
  type AiRelease,
} from "./releaseFeed";
import {
  getAiReleaseObjectKey,
  presignAiReleaseObject,
} from "./releasesBucket";

/** A presigned URL works this long after the redirect. */
const DOWNLOAD_URL_TTL_SECONDS = 300;

type AiReleaseDownloadResult =
  | { readonly state: "found"; readonly url: string }
  | { readonly state: "not-found" }
  | { readonly state: "unavailable" };

// Text files open in the browser; everything else downloads under its name.
const INLINE_TYPES: Readonly<Record<string, string>> = {
  SHA256SUMS: "text/plain; charset=utf-8",
  "manifest.json": "application/json; charset=utf-8",
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

function listedFile(
  release: AiRelease,
  fileName: string | null
): string | null {
  return fileName !== null &&
    release.files.some((file) => file.name === fileName)
    ? fileName
    : null;
}

/**
 * The file a download path names: `<file>`, or `<version>/<file>` with the
 * newest release's version. Only the newest release's files are handed
 * out, and only the ones its feed entry lists.
 */
function findFile(
  release: AiRelease,
  segments: readonly string[]
): string | null {
  if (segments.length === 1) {
    return listedFile(release, decodeSegment(segments[0]));
  }
  if (segments.length === 2 && decodeSegment(segments[0]) === release.version) {
    return listedFile(release, decodeSegment(segments[1]));
  }
  return null;
}

/**
 * Finds a file of the newest release in the signed feed and presigns it.
 * A file the feed does not list is never fetched, so the path cannot reach
 * any other object in the bucket.
 */
export async function resolveAiReleaseDownload(
  segments: readonly string[]
): Promise<AiReleaseDownloadResult> {
  const snapshot = await getAiReleaseFeedSnapshot();
  if (snapshot.state === "error") {
    return { state: "unavailable" };
  }
  const release = getNewestAiRelease(snapshot.releases);
  const fileName = release ? findFile(release, segments) : null;
  if (!release || !fileName) {
    return { state: "not-found" };
  }
  const inlineType = INLINE_TYPES[fileName];
  const responseParams: Record<string, string> = inlineType
    ? {
        "response-content-type": inlineType,
        "response-content-disposition": "inline",
      }
    : {
        // The feed parser lets a name hold only letters, digits and ._+~-,
        // so it needs no quoting here; loosen FILE_NAME_PATTERN only with
        // RFC 6266 encoding of this header.
        "response-content-disposition": `attachment; filename="${fileName}"`,
      };
  try {
    const url = await presignAiReleaseObject(
      getAiReleaseObjectKey(release.version, fileName),
      { expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS, responseParams }
    );
    return { state: "found", url };
  } catch (error) {
    console.warn(
      "[ai-page] could not sign a download",
      error instanceof Error ? error.message : error
    );
    return { state: "unavailable" };
  }
}
