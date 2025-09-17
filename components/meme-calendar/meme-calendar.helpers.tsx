import { HISTORICAL_MINTS } from "./meme-calendar.szn1";

// Constants for division sizes
export const SEASONS_PER_YEAR = 4;
export const SEASONS_PER_EPOCH = SEASONS_PER_YEAR * 4; // 16 seasons per epoch (4 years)
export const SEASONS_PER_PERIOD = SEASONS_PER_EPOCH * 5; // 80 seasons per period (20 years)
export const SEASONS_PER_ERA = SEASONS_PER_PERIOD * 5; // 400 seasons per era (100 years)
export const SEASONS_PER_EON = SEASONS_PER_ERA * 10; // 4000 seasons per eon (1000 years)

// Historical SZN1 details
export const SZN1_RANGE = {
  start: new Date(Date.UTC(2022, 5, 1)), // Jun 1, 2022
  end: new Date(Date.UTC(2022, 11, 31)), // Dec 31, 2022
} as const;
export const SZN1_SEASON_INDEX = -13;

// ---- Eastern Time mint schedule ----
const EASTERN_STANDARD_OFFSET_HOURS = -5; // UTC-5 during winter (EST)
const EASTERN_DAYLIGHT_OFFSET_HOURS = -4; // UTC-4 during summer (EDT)
const MINT_EASTERN_HOUR = 10;
const MINT_EASTERN_MINUTE = 40;
const MINT_END_EASTERN_HOUR = 10;
const MINT_END_EASTERN_MINUTE = 0;

// Atypical days where a mint did NOT happen even though it was a M/W/F
// (store as UTC “day” timestamps)
const SKIPPED_MINT_UTC_DAYS = new Set<number>([
  Date.UTC(2023, 4, 8), // 2023-05-08
  Date.UTC(2024, 1, 7), // 2024-02-07
]);

// Days that DID mint even though they are not the usual Mon/Wed/Fri (UTC).
const EXTRA_MINT_UTC_DAYS = new Set<number>([
  Date.UTC(2023, 9, 26), // 2023-10-26 → Meme #157 (off-schedule Thursday)
  Date.UTC(2023, 10, 28), // 2023-11-28 → Meme #182 (off-schedule Tuesday)
]);

export const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

// UTC helpers
function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}
function utcDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d));
}

// INTERNAL anchor for “season math” only: SZN14 == Jan 2026
const SEASON_ANCHOR_2026 = new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0));

// Real minting becomes continuous from **2026-01-02 UTC**
const CONTINUOUS_MINT_START_UTC_DAY = new Date(Date.UTC(2026, 0, 2));

// Historic: the very first “new-era” mint is #48 on/after 2023-01-01 (SZN2 start).
const HISTORIC_BASE_COUNT = 47; // #1..#47 were Year 0 (we'll add them later)

// Based on your screenshot: ONLY SZN blocks mint; the named breaks don’t.
// Each entry is [inclusiveStartUTC, inclusiveEndUTC].
const HISTORIC_MINT_PHASES: Array<{ startUtcDay: Date; endUtcDay: Date }> = [
  // 2023 — Year 1
  { startUtcDay: utcDate(2023, 0, 1), endUtcDay: utcDate(2023, 2, 31) }, // Winter SZN2
  { startUtcDay: utcDate(2023, 3, 17), endUtcDay: utcDate(2023, 5, 30) }, // Spring SZN3
  { startUtcDay: utcDate(2023, 6, 17), endUtcDay: utcDate(2023, 8, 29) }, // Summer SZN4
  { startUtcDay: utcDate(2023, 9, 16), endUtcDay: utcDate(2023, 11, 15) }, // Fall SZN5

  // 2024 — Year 2
  { startUtcDay: utcDate(2024, 0, 1), endUtcDay: utcDate(2024, 2, 15) }, // Winter SZN6
  { startUtcDay: utcDate(2024, 3, 1), endUtcDay: utcDate(2024, 5, 14) }, // Spring SZN7
  { startUtcDay: utcDate(2024, 6, 1), endUtcDay: utcDate(2024, 8, 13) }, // Summer SZN8
  { startUtcDay: utcDate(2024, 9, 2), endUtcDay: utcDate(2024, 11, 13) }, // Fall SZN9

  // 2025 — Year 3
  { startUtcDay: utcDate(2025, 0, 1), endUtcDay: utcDate(2025, 2, 14) }, // Winter SZN10
  { startUtcDay: utcDate(2025, 3, 2), endUtcDay: utcDate(2025, 5, 13) }, // Spring SZN11
  { startUtcDay: utcDate(2025, 6, 2), endUtcDay: utcDate(2025, 8, 12) }, // Summer SZN12
  { startUtcDay: utcDate(2025, 9, 1), endUtcDay: utcDate(2025, 11, 12) }, // Fall SZN13
];

// Helper: does this UTC day fall in a mintable phase?
export function isInHistoricPhase(utcDay: Date): boolean {
  const t = +startOfUtcDay(utcDay);
  for (const p of HISTORIC_MINT_PHASES) {
    if (t >= +p.startUtcDay && t <= +p.endUtcDay) return true;
  }
  return false;
}

// Mintable day = (Mon/Wed/Fri) AND (within a historic phase OR >= 2026-01-02)
export function isMintEligibleUtcDay(utcDay: Date): boolean {
  const d = startOfUtcDay(utcDay);

  // explicit exceptions first
  if (SKIPPED_MINT_UTC_DAYS.has(+d)) return false;
  if (EXTRA_MINT_UTC_DAYS.has(+d)) return true; // off-schedule but minted

  if (!isMintDayDate(d)) return false; // regular rule: Mon/Wed/Fri only
  return isInHistoricPhase(d) || +d >= +CONTINUOUS_MINT_START_UTC_DAY;
}

// First actual mint *day* in our modeled world (SZN2 onward)
export const FIRST_MINT_DATE: Date = (() => {
  // find first Mon/Wed/Fri on/after 2023-01-01 that is inside the first phase
  const phase = HISTORIC_MINT_PHASES[0];
  let d = startOfUtcDay(phase.startUtcDay);
  while (+d <= +phase.endUtcDay) {
    if (isMintEligibleUtcDay(d)) return d;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  // safety fallback (should never hit)
  return nextMintDateOnOrAfter(phase.startUtcDay);
})();

// ---- US Eastern Time DST helpers ----
function getNthWeekdayOfMonthUtc(
  year: number,
  monthIndex: number,
  weekday: number,
  occurrence: number
): number {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const firstDow = firstOfMonth.getUTCDay();
  const offset = (weekday - firstDow + 7) % 7;
  return 1 + offset + (occurrence - 1) * 7;
}

function isEasternDaylightTime(utcDay: Date): boolean {
  const year = utcDay.getUTCFullYear();
  const month = utcDay.getUTCMonth();
  const day = utcDay.getUTCDate();

  if (month < 2 || month > 10) {
    return false;
  }
  if (month > 2 && month < 10) {
    return true;
  }

  if (month === 2) {
    const dstStartDay = getNthWeekdayOfMonthUtc(year, 2, 0, 2); // second Sunday in March
    return day >= dstStartDay;
  }

  const dstEndDay = getNthWeekdayOfMonthUtc(year, 10, 0, 1); // first Sunday in November
  return day < dstEndDay;
}

function getEasternOffsetHours(utcDay: Date): number {
  return isEasternDaylightTime(utcDay)
    ? EASTERN_DAYLIGHT_OFFSET_HOURS
    : EASTERN_STANDARD_OFFSET_HOURS;
}

function easternWallTimeToUtcInstant(
  utcDay: Date,
  hour: number,
  minute: number
): Date {
  const offsetHours = getEasternOffsetHours(utcDay);
  const out = new Date(utcDay);
  out.setUTCHours(hour - offsetHours, minute, 0, 0);
  return out;
}

// ---- Mint schedule helpers (Mon/Wed/Fri only, by UTC weekday) ----
export function isMintDow(dow: number): boolean {
  return dow === 1 || dow === 3 || dow === 5; // Mon/Wed/Fri
}
export function isMintDayDate(d: Date): boolean {
  // IMPORTANT: use UTC weekday
  return isMintDow(d.getUTCDay());
}

export function nextMintDateOnOrAfter(d: Date): Date {
  let x = startOfUtcDay(d);
  // clamp before 2023 to the first mintable historic day
  if (+x < +FIRST_MINT_DATE) x = new Date(FIRST_MINT_DATE);
  for (let i = 0; i < 4000; i++) {
    if (isMintEligibleUtcDay(x)) return x;
    x.setUTCDate(x.getUTCDate() + 1);
  }
  return x;
}

export function prevMintDateOnOrBefore(d: Date): Date {
  let x = startOfUtcDay(d);
  // if we go before the first historic mint, just return the first historic mint day
  if (+x < +FIRST_MINT_DATE) return new Date(FIRST_MINT_DATE);
  for (let i = 0; i < 4000; i++) {
    if (isMintEligibleUtcDay(x)) return x;
    x.setUTCDate(x.getUTCDate() - 1);
  }
  return x;
}

export function mintStartInstantUtcForMintDay(utcDay: Date): Date {
  return easternWallTimeToUtcInstant(
    utcDay,
    MINT_EASTERN_HOUR,
    MINT_EASTERN_MINUTE
  );
}

export function mintEndInstantUtcForMintDay(utcDay: Date): Date {
  const nextDay = new Date(
    Date.UTC(
      utcDay.getUTCFullYear(),
      utcDay.getUTCMonth(),
      utcDay.getUTCDate() + 1
    )
  );
  return easternWallTimeToUtcInstant(
    nextDay,
    MINT_END_EASTERN_HOUR,
    MINT_END_EASTERN_MINUTE
  );
}

function getMintWindowForMintDay(utcDay: Date): { start: Date; end: Date } {
  return {
    start: mintStartInstantUtcForMintDay(utcDay),
    end: mintEndInstantUtcForMintDay(utcDay),
  };
}

function getActiveMintWindow(
  now: Date
): { mintDayUtc: Date; start: Date; end: Date } | null {
  const todayUtc = startOfUtcDay(now);
  const candidates: Date[] = [];

  const latestMint = prevMintDateOnOrBefore(todayUtc);
  if (latestMint) {
    candidates.push(latestMint);
  }

  const dayBefore = new Date(
    Date.UTC(
      todayUtc.getUTCFullYear(),
      todayUtc.getUTCMonth(),
      todayUtc.getUTCDate() - 1
    )
  );
  if (+dayBefore >= +FIRST_MINT_DATE) {
    const previousMint = prevMintDateOnOrBefore(dayBefore);
    if (
      previousMint &&
      (!latestMint || previousMint.getTime() !== latestMint.getTime())
    ) {
      candidates.push(previousMint);
    }
  }

  for (const mintDay of candidates) {
    const window = getMintWindowForMintDay(mintDay);
    if (
      now.getTime() >= window.start.getTime() &&
      now.getTime() < window.end.getTime()
    ) {
      return { mintDayUtc: mintDay, ...window };
    }
  }

  return null;
}

export function immediatelyNextMintInstantUTC(now: Date): Date {
  const firstMintInstant = mintStartInstantUtcForMintDay(FIRST_MINT_DATE);
  if (now < firstMintInstant) return firstMintInstant;

  const todayUtc = startOfUtcDay(now);
  const todayIsMint = isMintEligibleUtcDay(todayUtc);
  if (todayIsMint) {
    const todayInstant = mintStartInstantUtcForMintDay(todayUtc);
    if (now < todayInstant) return todayInstant;
  }
  const tomorrowUtc = new Date(
    Date.UTC(
      todayUtc.getUTCFullYear(),
      todayUtc.getUTCMonth(),
      todayUtc.getUTCDate() + 1
    )
  );
  const nextMintDay = nextMintDateOnOrAfter(tomorrowUtc);
  return mintStartInstantUtcForMintDay(nextMintDay);
}

// Backwards-compat alias (old code expected a Date). Returns the mint *instant* in UTC.
export function immediatelyNextMintDate(now: Date): Date {
  return immediatelyNextMintInstantUTC(now);
}

/**
 * Count only Mon/Wed/Fri since FIRST_MINT_DATE. Input may be any Date; we use its UTC day.
 */
function countMintDaysWithin(startUtcDay: Date, endUtcDay: Date): number {
  // inclusive range; count only *eligible* mint days
  let c = 0;
  const d = new Date(startOfUtcDay(startUtcDay));
  const end = startOfUtcDay(endUtcDay);
  while (+d <= +end) {
    if (isMintEligibleUtcDay(d)) c++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return c;
}

/**
 * Count ordinal (Mon/Wed/Fri only) across:
 *  - Historic SZN phases in 2023-2025 (with breaks removed)
 *  - Continuous tail from 2026-01-02 onward
 * Returns #48 for the very first 2023 mint; clamps below that.
 */
export function getMintNumberForMintDate(date: Date): number {
  const day = startOfUtcDay(date);

  // clamp: anything before the first mintable day → first visible number
  if (+day <= +FIRST_MINT_DATE) return HISTORIC_BASE_COUNT + 1;

  let total = HISTORIC_BASE_COUNT;

  // 1) add historic phases fully before the target day
  for (const p of HISTORIC_MINT_PHASES) {
    if (+day < +p.startUtcDay) break;
    const upTo = new Date(Math.min(+day, +p.endUtcDay));
    if (+upTo >= +p.startUtcDay) {
      total += countMintDaysWithin(p.startUtcDay, upTo);
    }
    if (+day <= +p.endUtcDay) {
      // target lies inside this phase; done
      return total;
    }
  }

  // 2) add full historic phases (all of them) if the date is later
  // (the loop above already summed them progressively)

  // 3) continuous tail from 2026-01-02 (inclusive)
  const tailStart = CONTINUOUS_MINT_START_UTC_DAY;
  if (+day >= +tailStart) {
    // add complete weeks between tailStart and 'day' with the M/W/F math (same as your fast path)
    const diffDays = Math.round((+day - +tailStart) / MILLIS_PER_DAY);
    const fullWeeks = Math.floor(diffDays / 7);
    const remainder = diffDays % 7;
    // base DOW from tailStart
    const baseDow = tailStart.getUTCDay();
    let partial = 0;
    for (let i = 0; i <= remainder; i++) {
      if (isMintDow((baseDow + i) % 7)) partial++;
    }
    total += fullWeeks * 3 + partial;
  }

  return total;
}

// Helper: get the number of whole months between two dates (UTC-based compare)
export function monthsBetween(a: Date, b: Date): number {
  const ay = a.getUTCFullYear();
  const am = a.getUTCMonth();
  const by = b.getUTCFullYear();
  const bm = b.getUTCMonth();
  return (by - ay) * 12 + (bm - am);
}

export function getSeasonIndexForDate(d: Date): number {
  const months = monthsBetween(SEASON_ANCHOR_2026, d);
  return Math.floor(months / 3); // 0 == SZN14 (Jan-Mar 2026)
}

// start-of-season for an index that may be negative
export function getSeasonStartDate(seasonIndex: number): Date {
  const date = new Date(SEASON_ANCHOR_2026);
  date.setUTCMonth(SEASON_ANCHOR_2026.getUTCMonth() + seasonIndex * 3, 1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// ---- Display numbering helpers (Year 1 == 2023, SZN2..5; Year 4 == 2026, SZN14..17) ----

function divFloor(a: number, b: number): number {
  // floor division that works for negatives
  return Math.floor(a / b);
}

export function displayedYearNumberFromIndex(seasonIndex: number): number {
  // 2026(Q1) => idx 0 => Year 4
  return 4 + divFloor(seasonIndex, SEASONS_PER_YEAR);
}

export function isSznOneIndex(i: number): boolean {
  // -13 corresponds to Oct-Dec 2022; anything <= -13 is “the SZN1 era”
  return i <= -13;
}

/**
 * Map internal seasonIndex -> displayed SZN number.
 * SZN1 is special (Jun-Dec 2022) and everything before 2023 displays as SZN1.
 * From 2023-01 onward, SZN numbering starts at SZN2 and is regular.
 */
export function displayedSeasonNumberFromIndex(i: number): number {
  if (isSznOneIndex(i)) return 1; // all pre-2023 buckets display as SZN 1

  // For 2023+ keep regular 3-month seasons; 2023 Q1 should be SZN2.
  const yearNumber = displayedYearNumberFromIndex(i); // 0 for 2022, 1 for 2023, ...
  const withinYear =
    ((i % SEASONS_PER_YEAR) + SEASONS_PER_YEAR) % SEASONS_PER_YEAR; // 0..3

  // When yearNumber === 1 (2023), start at SZN2 and keep incrementing each quarter.
  // i.e. SZN = (yearNumber - 1) * 4 + withinYear + 2
  return (yearNumber - 1) * SEASONS_PER_YEAR + withinYear + 2;
}

export function displayedEpochNumberFromIndex(seasonIndex: number): number {
  const year = displayedYearNumberFromIndex(seasonIndex);
  return Math.floor((year - 1) / 4) + 1; // 1..∞
}
export function displayedPeriodNumberFromIndex(seasonIndex: number): number {
  const epoch = displayedEpochNumberFromIndex(seasonIndex);
  return Math.floor((epoch - 1) / 5) + 1;
}
export function displayedEraNumberFromIndex(seasonIndex: number): number {
  const period = displayedPeriodNumberFromIndex(seasonIndex);
  return Math.floor((period - 1) / 5) + 1;
}
export function displayedEonNumberFromIndex(seasonIndex: number): number {
  const era = displayedEraNumberFromIndex(seasonIndex);
  return Math.floor((era - 1) / 10) + 1;
}

// Type definitions for zoom levels
export type ZoomLevel = "season" | "year" | "epoch" | "period" | "era" | "eon";

// Helper: add N months to a date and return the last day of the resulting month (UTC)
export function addMonths(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  // last day of (m + months)
  return new Date(Date.UTC(y, m + months + 1, 0));
}

export function getRangeDatesByZoom(
  zoom: ZoomLevel,
  seasonIndex: number
): { start: Date; end: Date } {
  switch (zoom) {
    case "season": {
      if (isSznOneIndex(seasonIndex)) {
        return {
          start: new Date(SZN1_RANGE.start),
          end: new Date(SZN1_RANGE.end),
        };
      }
      const start = getSeasonStartDate(seasonIndex);
      const end = addMonths(start, 2);
      return { start, end };
    }
    case "year": {
      if (isSznOneIndex(seasonIndex)) {
        return {
          start: new Date(SZN1_RANGE.start),
          end: new Date(SZN1_RANGE.end),
        };
      }
      const start = getSeasonStartDate(
        Math.floor(seasonIndex / SEASONS_PER_YEAR) * SEASONS_PER_YEAR
      );
      const end = addMonths(start, 11);
      return { start, end };
    }
    case "epoch": {
      const epochNumber = displayedEpochNumberFromIndex(seasonIndex);
      if (epochNumber === 0) {
        return {
          start: new Date(SZN1_RANGE.start),
          end: new Date(SZN1_RANGE.end),
        };
      }
      const startYear = 2023 + 4 * (epochNumber - 1);
      const start = new Date(Date.UTC(startYear, 0, 1));
      const end = new Date(Date.UTC(startYear + 4, 0, 0));
      return { start, end };
    }
    case "period": {
      const periodNumber = displayedPeriodNumberFromIndex(seasonIndex);
      if (periodNumber === 0) {
        return {
          start: new Date(SZN1_RANGE.start),
          end: new Date(SZN1_RANGE.end),
        };
      }
      const startYear = 2023 + 20 * (periodNumber - 1);
      const start = new Date(Date.UTC(startYear, 0, 1));
      const end = new Date(Date.UTC(startYear + 20, 0, 0));
      return { start, end };
    }
    case "era": {
      const eraNumber = displayedEraNumberFromIndex(seasonIndex);
      if (eraNumber === 0) {
        return {
          start: new Date(SZN1_RANGE.start),
          end: new Date(SZN1_RANGE.end),
        };
      }
      const startYear = 2023 + 100 * (eraNumber - 1);
      const start = new Date(Date.UTC(startYear, 0, 1));
      const end = new Date(Date.UTC(startYear + 100, 0, 0));
      return { start, end };
    }
    case "eon": {
      const eonNumber = displayedEonNumberFromIndex(seasonIndex);
      if (eonNumber === 0) {
        return {
          start: new Date(SZN1_RANGE.start),
          end: new Date(SZN1_RANGE.end),
        };
      }
      const startYear = 2023 + 1000 * (eonNumber - 1);
      const start = new Date(Date.UTC(startYear, 0, 1));
      const end = new Date(Date.UTC(startYear + 1000, 0, 0));
      return { start, end };
    }
  }
}

export function getCardsRemainingUntilEndOf(
  zoom: ZoomLevel,
  now: Date = new Date()
): number {
  const todayUtc = startOfUtcDay(now);
  const searchStart = new Date(
    Date.UTC(
      todayUtc.getUTCFullYear(),
      todayUtc.getUTCMonth(),
      todayUtc.getUTCDate() + 1
    )
  );
  const nextMintDay = nextMintDateOnOrAfter(searchStart);
  const seasonIndex = getSeasonIndexForDate(nextMintDay);
  const { end } = getRangeDatesByZoom(zoom, seasonIndex);
  const lastMintDay = prevMintDateOnOrBefore(end);
  const startNumber = getMintNumberForMintDate(nextMintDay);
  const endNumber = getMintNumberForMintDate(lastMintDay);
  return Math.max(0, endNumber - startNumber + 1);
}

/**
 * Compute the ordinal mint number. If a non‑mint day is passed, snap forward to next mint day.
 */
export function getMintNumber(date: Date): number {
  const d = startOfUtcDay(date);
  const mintDay = isMintDayDate(d) ? d : nextMintDateOnOrAfter(d);
  return getMintNumberForMintDate(mintDay);
}

export function getNextMintStart(now: Date = new Date()): Date {
  return immediatelyNextMintInstantUTC(now);
}

export function getNextMintNumber(now: Date = new Date()): number {
  const active = getActiveMintWindow(now);
  if (active) {
    return getMintNumberForMintDate(active.mintDayUtc);
  }
  const nextMintInstant = getNextMintStart(now);
  const nextMintDay = startOfUtcDay(nextMintInstant);
  return getMintNumberForMintDate(nextMintDay);
}

export function isMintingActive(now: Date = new Date()): boolean {
  return getActiveMintWindow(now) !== null;
}

// Inverse: mint number -> mint *instant* (UTC)
// ---- helpers used by inverse mapping ----
export function firstEligibleInRange(
  startUtcDay: Date,
  endUtcDay: Date
): Date | null {
  let d = startOfUtcDay(startUtcDay);
  const end = startOfUtcDay(endUtcDay);
  while (+d <= +end) {
    if (isMintEligibleUtcDay(d)) return d;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return null;
}

export function nthEligibleInRange(
  startEligibleUtcDay: Date,
  nZeroBased: number,
  endUtcDay?: Date
): Date {
  // step forward nZeroBased eligible (Mon/Wed/Fri & eligible) days
  let d = new Date(startEligibleUtcDay);
  let left = nZeroBased;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (endUtcDay && +d > +endUtcDay) break; // guard
    if (isMintEligibleUtcDay(d)) left--;
  }
  return d;
}

// Inverse: mint number -> mint *instant* (UTC)
export function dateFromMintNumber(n: number): Date {
  // Map #1..#47 to the exact historical instants in SZN1
  if (n >= 1 && n <= HISTORICAL_MINTS.length) {
    return new Date(HISTORICAL_MINTS[n - 1].instantUtc);
  }

  // #48 is FIRST_MINT_DATE (the first modeled 2023 mint day)
  if (n === HISTORICAL_MINTS.length + 1) {
    return mintStartInstantUtcForMintDay(FIRST_MINT_DATE);
  }

  // For #49 and upward, walk eligible mint days starting the day AFTER #48
  let currentUtcDay = new Date(FIRST_MINT_DATE); // #48
  let ordinal = HISTORICAL_MINTS.length + 1; // 48

  while (ordinal < n) {
    // search from the next day forward
    const nextSearchStart = new Date(
      Date.UTC(
        currentUtcDay.getUTCFullYear(),
        currentUtcDay.getUTCMonth(),
        currentUtcDay.getUTCDate() + 1
      )
    );
    currentUtcDay = nextMintDateOnOrAfter(nextSearchStart);
    ordinal++;
  }

  return mintStartInstantUtcForMintDay(currentUtcDay);
}

export type DateRange = { start: Date; end: Date };

export interface MintTimelineDetails {
  readonly mintNumber: number;
  readonly instantUtc: Date;
  readonly mintDayUtc: Date;
  readonly mintEndUtc: Date;
  readonly seasonIndex: number;
  readonly seasonNumber: number;
  readonly yearNumber: number;
  readonly epochNumber: number;
  readonly periodNumber: number;
  readonly eraNumber: number;
  readonly eonNumber: number;
  readonly ranges: Record<ZoomLevel, DateRange>;
}

const ZOOM_LEVELS: readonly ZoomLevel[] = [
  "season",
  "year",
  "epoch",
  "period",
  "era",
  "eon",
];

export function getMintTimelineDetails(
  mintNumber: number
): MintTimelineDetails {
  const instantUtc = dateFromMintNumber(mintNumber);
  const mintDayUtc = new Date(
    Date.UTC(
      instantUtc.getUTCFullYear(),
      instantUtc.getUTCMonth(),
      instantUtc.getUTCDate()
    )
  );
  const mintEndUtc = mintEndInstantUtcForMintDay(mintDayUtc);
  const seasonIndex = getSeasonIndexForDate(instantUtc);

  const ranges = Object.fromEntries(
    ZOOM_LEVELS.map((zoom) => [zoom, getRangeDatesByZoom(zoom, seasonIndex)])
  ) as Record<ZoomLevel, DateRange>;

  return {
    mintNumber,
    instantUtc,
    mintDayUtc,
    mintEndUtc,
    seasonIndex,
    seasonNumber: displayedSeasonNumberFromIndex(seasonIndex),
    yearNumber: displayedYearNumberFromIndex(seasonIndex),
    epochNumber: displayedEpochNumberFromIndex(seasonIndex),
    periodNumber: displayedPeriodNumberFromIndex(seasonIndex),
    eraNumber: displayedEraNumberFromIndex(seasonIndex),
    eonNumber: displayedEonNumberFromIndex(seasonIndex),
    ranges,
  };
}

// Build a matrix of weeks for a given month (numbers or nulls). Align by UTC weekday.
export function getMonthWeeks(
  year: number,
  month: number
): (number | null)[][] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];

  // ⭐ Monday-first: convert Sunday(0) to 7, then pad (dow-1) nulls
  const dow = firstDay.getUTCDay();
  const monFirstIndex = dow === 0 ? 7 : dow; // 1..7 (Mon..Sun)
  for (let i = 1; i < monFirstIndex; i++) week.push(null);

  for (let day = 1; day <= totalDays; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

// Format helpers
export function toISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${da}`;
}

// Display timezone toggle type
export type DisplayTz = "local" | "utc";

export function formatMint(n: number): string {
  return `#${n.toLocaleString()}`;
}
export function formatFullDate(d: Date, mode: DisplayTz = "local"): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(mode === "utc" ? { timeZone: "UTC" } : {}),
  });
}
export const formatFullDateTime = (
  d: Date,
  mode: DisplayTz = "local"
): string => {
  const s = d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(mode === "utc" ? { timeZone: "UTC" } : {}),
  });
  return mode === "utc" ? `${s} UTC` : s;
};

// ---- Calendar links: create timed events with UTC Z timestamps ----
function ymdHmsUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${da}T${hh}${mm}${ss}Z`;
}
export function createGoogleCalendarUrl(
  startInstantUtc: Date,
  endInstantUtc: Date,
  title: string,
  details: string
): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${title} Minting`,
    dates: `${ymdHmsUtc(startInstantUtc)}/${ymdHmsUtc(endInstantUtc)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
export function createIcsDataUrl(
  startInstantUtc: Date,
  endInstantUtc: Date,
  title: string,
  description: string
): string {
  const dtStart = ymdHmsUtc(startInstantUtc);
  const dtEnd = ymdHmsUtc(endInstantUtc);
  const uid = `meme-${dtStart}@6529.io`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//6529.io//Meme Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${ymdHmsUtc(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title} Minting`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

// Accept either a UTC day (mint day) or an instant; always emit timed links at the correct mint instant
export function printCalendarInvites(
  dateOrInstant: Date,
  mintNumber: number,
  fontColor: string = "#fff",
  size: number = 22
): string {
  // Normalize to mint instant in UTC
  const utcDay = startOfUtcDay(dateOrInstant);
  const isEligibleMintDay = isMintEligibleUtcDay(utcDay);
  const mintStartUtc = isEligibleMintDay
    ? mintStartInstantUtcForMintDay(utcDay)
    : new Date(dateOrInstant);
  const mintEndUtc = mintEndInstantUtcForMintDay(utcDay);

  const title = `Meme ${formatMint(mintNumber)}`;
  const fullLocal = formatFullDateTime(mintStartUtc, "local");
  const fullUtc = formatFullDateTime(mintStartUtc, "utc");
  const desc = `${title} — ${fullLocal} / ${fullUtc}\n\nhttps://6529.io/the-memes/mint`;

  const gUrl = createGoogleCalendarUrl(mintStartUtc, mintEndUtc, title, desc);
  const icsUrl = createIcsDataUrl(mintStartUtc, mintEndUtc, title, desc);

  return `
    <div style="display:flex; gap:15px; align-items:center;">
      <a href="${icsUrl}" download="meme-${mintNumber}-minting.ics" title="Add to Calendar" style="display:flex; align-items:center; gap:5px; text-decoration:none; color:${fontColor};">
        <img src="/calendar-ics.png" style="width:${size}px;height:${size}px" />
      </a>
      <a href="${gUrl}" target="_blank" rel="noopener noreferrer" title="Add to Google Calendar" style="display:flex; align-items:center; gap:5px; text-decoration:none; color:${fontColor};">
        <img src="/calendar-google.png" style="width:${size}px;height:${size}px" />
      </a>
    </div>`;
}

// Helper: get label for a date range using mint numbers (locale formatted)
export function getRangeLabel(start: Date, end: Date): string {
  const startMintDate = nextMintDateOnOrAfter(start);
  const endMintDate = prevMintDateOnOrBefore(end);
  if (startMintDate.getTime() > endMintDate.getTime()) return "—";
  const startMint = getMintNumberForMintDate(startMintDate).toLocaleString();
  const endMint = getMintNumberForMintDate(endMintDate).toLocaleString();
  return `Memes #${startMint} - #${endMint}`;
}

export function formatToFullDivision(d: Date): React.ReactNode {
  const idx = getSeasonIndexForDate(d);
  const eon = displayedEonNumberFromIndex(idx);
  const era = displayedEraNumberFromIndex(idx);
  const period = displayedPeriodNumberFromIndex(idx);
  const epoch = displayedEpochNumberFromIndex(idx);
  const year = displayedYearNumberFromIndex(idx);
  const szn = displayedSeasonNumberFromIndex(idx);

  const fmt = (date: Date) =>
    date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  const range = (start: Date, end: Date) => `${fmt(start)} - ${fmt(end)}`;

  const seasonDates = getRangeDatesByZoom("season", idx);
  const yearDates = getRangeDatesByZoom("year", idx);
  const epochDates = getRangeDatesByZoom("epoch", idx);
  const periodDates = getRangeDatesByZoom("period", idx);
  const eraDates = getRangeDatesByZoom("era", idx);
  const eonDates = getRangeDatesByZoom("eon", idx);

  return (
    <table className="tw-inline-table tw-table-auto tw-w-auto tw-border-collapse">
      <tbody>
        {printDivision("SZN", szn, range(seasonDates.start, seasonDates.end))}
        {printDivision("Year", year, range(yearDates.start, yearDates.end))}
        {printDivision("Epoch", epoch, range(epochDates.start, epochDates.end))}
        {printDivision(
          "Period",
          period,
          range(periodDates.start, periodDates.end)
        )}
        {printDivision("Era", era, range(eraDates.start, eraDates.end))}
        {printDivision("Eon", eon, range(eonDates.start, eonDates.end))}
      </tbody>
    </table>
  );
}

function printDivision(label: string, number: number, range: string) {
  return (
    <tr>
      <td className="tw-py-1 tw-font-semibold tw-pr-4 tw-whitespace-nowrap">
        {label} {number.toLocaleString()}
      </td>
      <td className="tw-py-1 tw-whitespace-nowrap">
        <span className="tw-text-gray-400">{range}</span>
      </td>
    </tr>
  );
}
