import {
  downloadResponseParams,
  findListedFile,
  type ReleaseDownloadResult,
} from "@/lib/release-section/download";

import { getAiReleaseFeedSnapshot, getNewestAiRelease } from "./releaseFeed";
import {
  getAiReleaseObjectKey,
  presignAiReleaseObject,
} from "./releasesBucket";

/** A presigned URL works this long after the redirect. */
const DOWNLOAD_URL_TTL_SECONDS = 300;

// Text files open in the browser; everything else downloads under its name.
const INLINE_TYPES: Readonly<Record<string, string>> = {
  SHA256SUMS: "text/plain; charset=utf-8",
  "manifest.json": "application/json; charset=utf-8",
};

/**
 * Finds a file of the newest release in the signed feed and presigns it.
 * A path names `<file>`, or `<version>/<file>` with the newest release's
 * version. A file the feed does not list is never fetched, so the path
 * cannot reach any other object in the bucket.
 */
export async function resolveAiReleaseDownload(
  segments: readonly string[]
): Promise<ReleaseDownloadResult> {
  const snapshot = await getAiReleaseFeedSnapshot();
  if (snapshot.state === "error") {
    return { state: "unavailable" };
  }
  const release = getNewestAiRelease(snapshot.releases);
  const fileName = release ? findListedFile(release, segments) : null;
  if (!release || !fileName) {
    return { state: "not-found" };
  }
  try {
    const url = await presignAiReleaseObject(
      getAiReleaseObjectKey(release.version, fileName),
      {
        expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
        responseParams: downloadResponseParams(fileName, INLINE_TYPES),
      }
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
