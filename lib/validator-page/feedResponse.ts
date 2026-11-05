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

/**
 * Serves the signed feed or its signature byte for byte, as stored, so the
 * signature verifies against what validators download. Public, with no
 * redirect and a five-minute cache.
 */
export async function serveFeedObject(
  request: Request,
  which: "feed" | "signature"
): Promise<Response> {
  const snapshot = await getReleaseFeedSnapshot();
  if (snapshot.state === "error") {
    return plain(503, "The release feed is unavailable.\n", "no-store");
  }
  const object = which === "feed" ? snapshot.feed : snapshot.signature;
  if (!object) {
    return plain(404, "No release feed yet.\n", MISSING_CACHE_CONTROL);
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
