import {
  downloadResponseParams,
  findListedFile,
  type ReleaseDownloadResult,
} from "@/lib/release-section/download";
import {
  getReleaseObjectKey,
  presignBucketObject,
} from "@/lib/validator-page/releasesBucket";

import { getDesktopReleasesLocation } from "./releaseList";
import { getDesktopReleases, getNewestDesktopRelease } from "./releases";

/** A presigned URL works this long after the redirect. */
const DOWNLOAD_URL_TTL_SECONDS = 300;

// Text files open in the browser; the installers download under their name.
const INLINE_TYPES: Readonly<Record<string, string>> = {
  SHA256SUMS: "text/plain; charset=utf-8",
  "release.json": "application/json; charset=utf-8",
};

/**
 * Finds a file of the newest release in 6529 Desktop's verified list and
 * presigns it from the Desktop releases bucket, at
 * `releases/<version>/<file>`. A path names `<file>`, or `<version>/<file>`
 * with the newest release's version. A file the list does not name is
 * never fetched, so the path cannot reach any other object in the bucket.
 */
export async function resolveDesktopDownload(
  segments: readonly string[]
): Promise<ReleaseDownloadResult> {
  const { state, releases } = await getDesktopReleases();
  if (state === "error") {
    return { state: "unavailable" };
  }
  const release = getNewestDesktopRelease(releases);
  const fileName = release ? findListedFile(release, segments) : null;
  if (!release || !fileName) {
    return { state: "not-found" };
  }
  try {
    const url = await presignBucketObject(
      getDesktopReleasesLocation(),
      getReleaseObjectKey(release.version, fileName),
      {
        expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
        responseParams: downloadResponseParams(fileName, INLINE_TYPES),
      }
    );
    return { state: "found", url };
  } catch (error) {
    console.warn(
      "[desktop-releases] could not sign a download",
      error instanceof Error ? error.message : error
    );
    return { state: "unavailable" };
  }
}
