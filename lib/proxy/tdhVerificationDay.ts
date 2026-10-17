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

/** The day permalink's segment, or null for any other path. */
function daySegment(pathname: string): string | null {
  if (!pathname.startsWith(DAY_PATH_PREFIX)) {
    return null;
  }
  const segment = pathname.slice(DAY_PATH_PREFIX.length);
  return segment === "" || segment.includes("/") ? null : segment;
}

/**
 * True for a day permalink that cannot name a published day: a segment that
 * is not a cycle day number in canonical form, a day before the feed's first,
 * or a day after the latest closed cycle (cycle N closes at 00:00 UTC of its
 * date, so no later day can exist yet). The proxy rewrites these to the TDH
 * pages' own not-found view (`TDH_DAY_NOT_FOUND_PATH`) with a real 404
 * status: the day page itself streams under `app/network/loading.tsx`, so
 * its own not-found view can only be sent with status 200. A day inside the
 * range is checked against the feed's index (`createTdhListedDays`).
 */
export function isImpossibleTdhVerificationDay(
  pathname: string,
  nowMs: number
): boolean {
  const segment = daySegment(pathname);
  if (segment === null) {
    return false;
  }
  return possibleTdhVerificationDay(pathname, nowMs) === null;
}

/**
 * The cycle day a permalink names when it could be a published day: a
 * canonical number from the feed's first day to the latest closed cycle.
 * Null for every other path.
 */
export function possibleTdhVerificationDay(
  pathname: string,
  nowMs: number
): number | null {
  const segment = daySegment(pathname);
  if (segment === null || !CANONICAL_DAY.test(segment)) {
    return null;
  }
  const day = Number(segment);
  const latestClosed = Math.floor(nowMs / MS_PER_DAY);
  return day < FIRST_TDH_FEED_CYCLE_DAY || day > latestClosed ? null : day;
}

/** The TDH pages' view for a day permalink that names no published day. */
export const TDH_DAY_NOT_FOUND_PATH = "/network/tdh/verification/day-not-found";

/**
 * Where the proxy sends a day permalink that names no published day: the
 * not-found view, with the day asked for as `?day=` only when it is a cycle
 * day number in canonical form. Any other text of the address is dropped,
 * so the view can never repeat it. The address bar keeps the original path.
 */
export function tdhDayNotFoundTarget(url: URL, pathname: string): URL {
  const target = new URL(url.toString());
  target.pathname = TDH_DAY_NOT_FOUND_PATH;
  target.search = "";
  const segment = daySegment(pathname);
  if (segment !== null && CANONICAL_DAY.test(segment)) {
    target.searchParams.set("day", segment);
  }
  return target;
}

/** How long a read of the index answers for a day it does not list. */
const INDEX_REREAD_MS = 60_000;
/** A permalink waits at most this long for the index. */
const INDEX_TIMEOUT_MS = 2_500;

interface ListedDays {
  readonly days: ReadonlySet<number>;
  readonly readAt: number;
}

/** The cycle days an `index.json` lists, or null when it is not one. */
function listedDaysOf(json: unknown): ReadonlySet<number> | null {
  if (typeof json !== "object" || json === null || !("days" in json)) {
    return null;
  }
  const { days } = json as { readonly days: unknown };
  if (!Array.isArray(days)) {
    return null;
  }
  const listed = new Set<number>();
  for (const day of days as readonly unknown[]) {
    const cycleDay =
      typeof day === "object" && day !== null && "cycleDay" in day
        ? (day as { readonly cycleDay: unknown }).cycleDay
        : null;
    if (typeof cycleDay !== "number" || !Number.isSafeInteger(cycleDay)) {
      return null;
    }
    listed.add(cycleDay);
  }
  return listed;
}

/**
 * Whether the feed's index lists a cycle day, for the proxy: a day inside
 * the permalinks' range that the index does not list gets the not-found view
 * with a real 404, like a day outside it. A listed day answers from the
 * last read at once; a day the last read did not list is checked against a
 * fresh read at most once a minute. When the index cannot be read the day is
 * left to the page (`unlisted` is false), which reads the feed itself.
 */
export function createTdhListedDays({
  indexUrl,
  fetchImpl = globalThis.fetch,
}: {
  readonly indexUrl: string | null;
  readonly fetchImpl?: typeof fetch;
}) {
  let last: ListedDays | null = null;
  /** When the index was last asked for, read or not. */
  let askedAt = Number.NEGATIVE_INFINITY;
  let reading: Promise<ListedDays | null> | null = null;

  async function read(nowMs: number): Promise<ListedDays | null> {
    if (indexUrl === null) {
      return null;
    }
    try {
      const response = await fetchImpl(indexUrl, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(INDEX_TIMEOUT_MS),
        cache: "no-store",
      });
      if (!response.ok) {
        return null;
      }
      const days = listedDaysOf((await response.json()) as unknown);
      return days === null ? null : { days, readAt: nowMs };
    } catch {
      return null;
    }
  }

  async function unlisted(day: number, nowMs: number): Promise<boolean> {
    if (last?.days.has(day)) {
      return false;
    }
    if (last === null || nowMs - last.readAt >= INDEX_REREAD_MS) {
      // A failed read is not retried within the minute either, so a feed
      // that is down never slows every permalink.
      if (reading === null && nowMs - askedAt < INDEX_REREAD_MS) {
        return false;
      }
      if (reading === null) {
        askedAt = nowMs;
        reading = read(nowMs).finally(() => {
          reading = null;
        });
      }
      const fresh = await reading;
      if (fresh === null) {
        return false;
      }
      last = fresh;
    }
    return !last.days.has(day);
  }

  return { unlisted };
}
