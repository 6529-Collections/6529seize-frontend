import {
  addMonths,
  getMintNumberForMintDate,
  getNextMintStart,
  getSeasonIndexForDate,
  getSeasonStartDate,
  isMintEligibleUtcDay,
  mintStartInstantUtcForMintDay,
} from "./meme-calendar.helpers";

export interface SeasonMintRow {
  utcDay: Date;
  instantUtc: Date;
  meme: number;
  seasonIndex: number;
}

export interface SeasonMintScanResult {
  /** First UTC day considered for the season (1st of month at 00:00 UTC). */
  seasonStart: Date;
  /** Last UTC day considered for the season (last day of month at 00:00 UTC). */
  seasonEndInclusive: Date;
  /** Season index derived from the provided range's start. */
  seasonIndex: number;
  /** Upcoming mints strictly after `now`. */
  rows: SeasonMintRow[];
}

/**
 * Compute upcoming mints within a [start, end] range (inclusive by UTC day).
 * - Clamps the scan start to **today (UTC)** so only *future* mint instants are returned.
 * - Honors all scheduling rules via `isMintEligibleUtcDay` and `mintStartInstantUtcForMintDay`.
 */
function getUpcomingMintsBetween(
  start: Date,
  end: Date,
  now: Date = new Date()
): SeasonMintScanResult {
  // Normalize anchors to UTC day boundaries
  const todayUtcDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const seasonStart = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)
  );
  const seasonEndInclusive = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)
  );

  // Begin scanning from the later of today vs season start
  const scanStart = new Date(
    Math.max(todayUtcDay.getTime(), seasonStart.getTime())
  );

  const seasonIndex = getSeasonIndexForDate(seasonStart);
  const out: SeasonMintRow[] = [];
  const cursor = new Date(scanStart);
  while (+cursor <= +seasonEndInclusive) {
    if (isMintEligibleUtcDay(cursor)) {
      const mintInstant = mintStartInstantUtcForMintDay(cursor);
      out.push({
        utcDay: new Date(cursor),
        instantUtc: mintInstant,
        meme: getMintNumberForMintDate(cursor),
        seasonIndex,
      });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const rows = out.filter((x) => x.instantUtc.getTime() > now.getTime());

  return { seasonStart, seasonEndInclusive, seasonIndex, rows };
}

/**
 * Get upcoming mints for the season containing `now`. If none remain in that
 * season (strictly after `now`), automatically fall forward to the next season.
 */
export function getUpcomingMintsForCurrentOrNextSeason(
  now: Date = new Date()
): SeasonMintScanResult {
  const idx = getSeasonIndexForDate(now);
  const start = getSeasonStartDate(idx);
  const end = addMonths(start, 2);

  let current = getUpcomingMintsBetween(start, end, now);
  if (current.rows.length > 0) {
    return current;
  }

  const nextIdx = idx + 1;
  const nextStart = getSeasonStartDate(nextIdx);
  const nextEnd = addMonths(nextStart, 2);
  const next = getUpcomingMintsBetween(nextStart, nextEnd, now);

  // Ensure seasonIndex reflects the next season when we roll forward
  return {
    ...next,
    seasonIndex: nextIdx,
  };
}

export function getUpcomingMintsForSeasonIndex(
  seasonIndex: number,
  now: Date = new Date()
): SeasonMintScanResult {
  const start = getSeasonStartDate(seasonIndex);
  const end = addMonths(start, 2);
  return getUpcomingMintsBetween(start, end, now);
}

export function getUpcomingMintsAcrossSeasons(
  minCount: number,
  now: Date = new Date()
): SeasonMintRow[] {
  const result: SeasonMintRow[] = [];
  let idx = getSeasonIndexForDate(now);

  while (result.length < minCount) {
    const season = getUpcomingMintsForSeasonIndex(idx, now);
    result.push(...season.rows);
    idx++;
    if (idx > getSeasonIndexForDate(now) + 4) break;
  }

  return result.slice(0, minCount);
}

export function getCanonicalNextMintNumber(now: Date = new Date()): number {
  const upcomingInstant = getNextMintStart(now);
  const upcomingUtcDay = new Date(
    Date.UTC(
      upcomingInstant.getUTCFullYear(),
      upcomingInstant.getUTCMonth(),
      upcomingInstant.getUTCDate()
    )
  );
  return getMintNumberForMintDate(upcomingUtcDay);
}
