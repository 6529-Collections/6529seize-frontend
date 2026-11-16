import { getReleaseFeedSnapshot } from "./releaseFeed";

const FEED_CACHE_CONTROL = "public, max-age=300";
const MISSING_CACHE_CONTROL = "public, max-age=60";

function plain(status: number, body: string, cacheControl: string): Response {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control": cacheControl,
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      ...(status === 503 ? { "Retry-After": "60" } : {}),
    },
  });
}

function etagMatches(header: string | null, etag: string | null): boolean {
  if (!header || !etag) {
    return false;
  }
  const bare = (value: string) => value.trim().replace(/^W\//, "");
  return (
    header.trim() === "*" ||
    header.split(",").some((candidate) => bare(candidate) === bare(etag))
  );
}

type StoredFeedObject = {
  readonly body: Uint8Array<ArrayBuffer>;
  readonly etag: string | null;
  readonly lastModified: string | null;
};

/** A signed feed and its signature as last read, or why there is none. */
type SignedFeedSnapshot = {
  readonly state: "ok" | "missing" | "error";
  readonly feed: StoredFeedObject | null;
  readonly signature: StoredFeedObject | null;
};

/** What a feed's endpoints answer besides the files themselves. */
type SignedFeedText = {
  /** The body of the 503 when the feed could not be read. */
  readonly unavailable: string;
  /** The body of the 404 before the first feed. */
  readonly missing: string;
  readonly signatureContentType: string;
};

const VALIDATOR_FEED_TEXT: SignedFeedText = {
  unavailable: "The release feed is unavailable.\n",
  missing: "No release feed yet.\n",
  signatureContentType: "application/octet-stream",
};

/**
 * Serves a signed feed or its signature byte for byte, as stored, so the
 * signature verifies against what anyone downloads. Public, with no
 * redirect and a five-minute cache. The 6529 AI pages serve their own
 * feed with it too.
 */
export function serveSignedFeedObject(
  request: Request,
  snapshot: SignedFeedSnapshot,
  which: "feed" | "signature",
  text: SignedFeedText
): Response {
  if (snapshot.state === "error") {
    return plain(503, text.unavailable, "no-store");
  }
  const object = which === "feed" ? snapshot.feed : snapshot.signature;
  if (!object) {
    return plain(404, text.missing, MISSING_CACHE_CONTROL);
  }
  const headers = new Headers({
    "Cache-Control": FEED_CACHE_CONTROL,
    "Content-Type":
      which === "feed"
        ? "application/json; charset=utf-8"
        : text.signatureContentType,
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
    "Access-Control-Allow-Origin": "*",
  });
  if (object.etag) {
    headers.set("ETag", object.etag);
  }
  if (object.lastModified) {
    headers.set("Last-Modified", object.lastModified);
  }
  if (etagMatches(request.headers.get("if-none-match"), object.etag)) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(object.body, { status: 200, headers });
}

/**
 * Serves the validator's signed feed or its signature, which validators
 * download to find updates.
 */
export async function serveFeedObject(
  request: Request,
  which: "feed" | "signature"
): Promise<Response> {
  return serveSignedFeedObject(
    request,
    await getReleaseFeedSnapshot(),
    which,
    VALIDATOR_FEED_TEXT
  );
}
