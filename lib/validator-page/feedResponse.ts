import { getReleaseFeedSnapshot } from "./releaseFeed";
import type { BucketObject } from "./releasesBucket";

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

type StoredObject = Extract<BucketObject, { state: "found" }>;

/** A signed list and its signature, read together so they always match. */
export type SignedListSnapshot = {
  readonly state: "ok" | "missing" | "error";
  readonly feed: StoredObject | null;
  readonly signature: StoredObject | null;
};

/** The plain-text answers when there is nothing to serve. */
export type SignedListMessages = {
  readonly missing: string;
  readonly unavailable: string;
};

const VALIDATOR_FEED_MESSAGES: SignedListMessages = {
  missing: "No release feed yet.\n",
  unavailable: "The release feed is unavailable.\n",
};

/**
 * Serves a signed list or its signature byte for byte, as stored, so the
 * signature verifies against what clients download. Public, with no
 * redirect and a five-minute cache; 404 before the first list, 503 when the
 * bucket fails.
 */
export function serveSignedListObject(
  request: Request,
  snapshot: SignedListSnapshot,
  which: "feed" | "signature",
  messages: SignedListMessages
): Response {
  if (snapshot.state === "error") {
    return plain(503, messages.unavailable, "no-store");
  }
  const object = which === "feed" ? snapshot.feed : snapshot.signature;
  if (!object) {
    return plain(404, messages.missing, MISSING_CACHE_CONTROL);
  }
  const headers = new Headers({
    "Cache-Control": FEED_CACHE_CONTROL,
    "Content-Type":
      which === "feed"
        ? "application/json; charset=utf-8"
        : "application/octet-stream",
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
 * Serves the validator's signed feed or its signature, so the signature
 * verifies against what validators download.
 */
export async function serveFeedObject(
  request: Request,
  which: "feed" | "signature"
): Promise<Response> {
  return serveSignedListObject(
    request,
    await getReleaseFeedSnapshot(),
    which,
    VALIDATOR_FEED_MESSAGES
  );
}
