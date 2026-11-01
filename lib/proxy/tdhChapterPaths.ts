/**
 * The TDH chapter's addresses, for the proxy. Every page under /network/tdh
 * streams under `app/network/loading.tsx`, so an address that names no page
 * can only render the chapter's not-found view (`app/network/tdh/not-found.tsx`)
 * with status 200. The proxy answers those addresses itself: a rewrite to
 * the chapter's catch-all, which calls notFound(), with a real 404 status.
 */
const CHAPTER_PREFIX = "/network/tdh/";

/** Each page's address under /network/tdh, as the app's routes define them. */
const PAGES: ReadonlySet<string> = new Set([
  "how-it-works",
  "consolidation",
  "consolidation/design",
  "verification",
  "verification/day-not-found",
  "formal",
  "proofs",
  "specification",
  "implementations",
  "historic-boosts",
  "glossary",
  "public-vectors.json",
  "verification.rss",
]);

/** A day's receipt: the proxy's day check answers for those. */
const DAY_PAGE = /^verification\/[^/]+$/;

/** Where an unknown address is rewritten: the chapter's catch-all. */
export const TDH_UNKNOWN_PAGE_PATH = "/network/tdh/not-found";

/** True for an address under /network/tdh that names no page of the chapter. */
export function isUnknownTdhChapterPath(pathname: string): boolean {
  if (!pathname.startsWith(CHAPTER_PREFIX)) {
    return false;
  }
  const rest = pathname.slice(CHAPTER_PREFIX.length);
  return !(rest === "" || PAGES.has(rest) || DAY_PAGE.test(rest));
}

/**
 * The rewrite target for an unknown address: the catch-all, whose view reads
 * nothing from the address. The query stays, so Next's `_rsc` check still
 * matches on a client navigation; the address bar keeps what was asked.
 */
export function tdhUnknownTarget(url: URL): URL {
  const target = new URL(url.toString());
  target.pathname = TDH_UNKNOWN_PAGE_PATH;
  return target;
}
