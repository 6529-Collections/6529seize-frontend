/**
 * The TDH verification feed's first published cycle day: October 14, 2026
 * (cycle day 20,740, the number of days from January 1, 1970 to the cycle's
 * date).
 */
export const FIRST_TDH_FEED_CYCLE_DAY = 20_740;

const DAY_PATH_PREFIX = "/network/tdh/verification/";
const MS_PER_DAY = 86_400_000;

/** A cycle day written as the feed writes it: digits, no leading zero. */
const CANONICAL_DAY = /^[1-9]\d{0,6}$/;

/**
 * True for a day permalink that cannot name a published day: a segment that
 * is not a cycle day number in canonical form, a day before the feed's first,
 * or a day after the latest closed cycle (cycle N closes at 00:00 UTC of its
 * date, so no later day can exist yet). The proxy rewrites these to the TDH
 * pages' own not-found view (`TDH_DAY_NOT_FOUND_PATH`) with a real 404
 * status: the day page itself streams under `app/network/loading.tsx`, so
 * its own not-found view can only be sent with status 200. A day inside the
 * range that the feed does not list still gets that view, marked noindex.
 */
export function isImpossibleTdhVerificationDay(
  pathname: string,
  nowMs: number
): boolean {
  if (!pathname.startsWith(DAY_PATH_PREFIX)) {
    return false;
  }
  const segment = pathname.slice(DAY_PATH_PREFIX.length);
  if (segment === "" || segment.includes("/")) {
    return false;
  }
  if (!CANONICAL_DAY.test(segment)) {
    return true;
  }
  const day = Number(segment);
  const latestClosed = Math.floor(nowMs / MS_PER_DAY);
  return day < FIRST_TDH_FEED_CYCLE_DAY || day > latestClosed;
}

/** The TDH pages' view for a day permalink that names no published day. */
export const TDH_DAY_NOT_FOUND_PATH = "/network/tdh/verification/day-not-found";

/**
 * Where the proxy sends an impossible day permalink: the not-found view, with
 * the segment that was asked for (cut to 32 characters) as `?day=`. The
 * address bar keeps the original path.
 */
export function tdhDayNotFoundTarget(url: URL, pathname: string): URL {
  const target = new URL(url.toString());
  target.pathname = TDH_DAY_NOT_FOUND_PATH;
  target.search = "";
  const segment = pathname.startsWith(DAY_PATH_PREFIX)
    ? pathname.slice(DAY_PATH_PREFIX.length)
    : "";
  target.searchParams.set("day", segment.slice(0, 32));
  return target;
}
