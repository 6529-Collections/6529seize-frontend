/**
 * What the download routes of a release section (/ai/download,
 * /desktop/download) share: which listed file a path names, the headers S3
 * answers the file with, and the route's own answer.
 */

export type ReleaseDownloadResult =
  | { readonly state: "found"; readonly url: string }
  | { readonly state: "not-found" }
  | { readonly state: "unavailable" };

/** The bodies of the route's two failures. */
type ReleaseDownloadText = {
  readonly unavailable: string;
  readonly notFound: string;
};

type ListedRelease = {
  readonly version: string;
  readonly files: readonly { readonly name: string }[];
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
  release: ListedRelease,
  fileName: string | null
): string | null {
  return fileName !== null &&
    release.files.some((file) => file.name === fileName)
    ? fileName
    : null;
}

/**
 * The file a download path names: `<file>`, or `<version>/<file>` with the
 * release's own version. Only a file the release lists is named, so a path
 * can never reach another object.
 */
export function findListedFile(
  release: ListedRelease,
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
 * The response headers S3 sends the file with. A text file in
 * `inlineTypes` opens in the browser; everything else downloads under its
 * name. The feed parsers let a name hold only letters, digits and `._+~-`,
 * so it needs no quoting; loosen their file name rules only with RFC 6266
 * encoding of this header.
 */
export function downloadResponseParams(
  fileName: string,
  inlineTypes: Readonly<Record<string, string>>
): Record<string, string> {
  const inlineType = inlineTypes[fileName];
  return inlineType
    ? {
        "response-content-type": inlineType,
        "response-content-disposition": "inline",
      }
    : {
        "response-content-disposition": `attachment; filename="${fileName}"`,
      };
}

function plain(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/**
 * The route's answer: a 302 to the presigned URL, a 404 for a file the
 * newest release does not list, or a 503 while the list can't be read.
 */
export function releaseDownloadResponse(
  result: ReleaseDownloadResult,
  text: ReleaseDownloadText
): Response {
  if (result.state === "unavailable") {
    return plain(503, text.unavailable);
  }
  if (result.state === "not-found") {
    return plain(404, text.notFound);
  }
  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: result.url,
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
