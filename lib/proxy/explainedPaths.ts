/**
 * 6529 Explained's addresses under /explained, for the proxy. An address
 * that names no page would call notFound() from the catch-all and render
 * the hub's not-found view only through the client payload, where the root
 * layout's startup scripts end up inside a client tree. The proxy answers
 * those addresses itself: a rewrite to the not-found view as a page, with a
 * real 404 status, as it does under /network/tdh (tdhChapterPaths.ts).
 */
const PREFIX = "/explained/";

/** Each page's address under /explained, as the app's routes define them. */
const PAGES: ReadonlySet<string> = new Set(["kit", "not-found-view"]);

/** Where an unknown address is rewritten. */
export const EXPLAINED_UNKNOWN_PAGE_PATH = "/explained/not-found-view";

/** True for an address under /explained that names no page. */
export function isUnknownExplainedPath(pathname: string): boolean {
  if (!pathname.startsWith(PREFIX)) {
    return false;
  }
  const rest = pathname.slice(PREFIX.length);
  return !(rest === "" || PAGES.has(rest));
}

/**
 * The rewrite target: the not-found view, which reads nothing from the
 * address. The query stays, so Next's `_rsc` check still matches on a
 * client navigation; the address bar keeps what was asked.
 */
export function explainedUnknownTarget(url: URL): URL {
  const target = new URL(url.toString());
  target.pathname = EXPLAINED_UNKNOWN_PAGE_PATH;
  return target;
}
