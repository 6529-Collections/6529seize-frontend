// Mint wall-clock times (17:40 start, 17:00 window end, phase boundaries) are
// defined in this IANA time zone.
export const MINT_TIME_ZONE = 'Europe/Athens';

const MILLIS_PER_SECOND = 1000;
const MILLIS_PER_DAY = 24 * 60 * 60 * MILLIS_PER_SECOND;

// Zone offsets come from the IANA time zone database that the runtime ships
// through Intl. There are deliberately no hard-coded UTC offsets or DST rules
// here: those go stale when governments change them.
//
// The formatter is fixed to en-US with Latin digits, the Gregorian calendar and
// a 23-hour clock, and we read numeric parts from it. The viewer's locale must
// never influence this math: the default locale can render "17.40" (fi-FI,
// da-DK, id-ID) or non-Latin digits (ar, fa), which broke string comparisons.
const wallClockFormatters = new Map<string, Intl.DateTimeFormat>();

function getWallClockFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = wallClockFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      calendar: 'gregory',
      numberingSystem: 'latn',
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
    wallClockFormatters.set(timeZone, formatter);
  }
  return formatter;
}

/**
 * The wall clock of `timeZone` at the given instant, encoded as the UTC
 * timestamp with the same date and time (whole seconds). Returns NaN when Intl
 * does not return readable date parts; callers must not guess a value.
 */
function wallClockAsUtcMillis(instantMillis: number, timeZone: string): number {
  const parts = getWallClockFormatter(timeZone).formatToParts(
    new Date(instantMillis)
  );
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);

  return Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    // Some engines report midnight as 24 even with a 23-hour clock.
    read('hour') % 24,
    read('minute'),
    read('second')
  );
}

/**
 * Offset of `timeZone` from UTC, in milliseconds, at the given instant
 * (positive east of UTC). Derived as the difference between the zone's wall
 * clock and UTC.
 *
 * Throws if Intl does not return readable date parts: guessing an offset
 * would silently show wrong times.
 */
function zoneOffsetMillis(instantMillis: number, timeZone: string): number {
  const wallClockAsUtc = wallClockAsUtcMillis(instantMillis, timeZone);
  if (!Number.isFinite(wallClockAsUtc)) {
    throw new TypeError(
      `Unable to derive the UTC offset of time zone "${timeZone}": Intl returned unreadable date parts`
    );
  }
  return (
    wallClockAsUtc -
    Math.floor(instantMillis / MILLIS_PER_SECOND) * MILLIS_PER_SECOND
  );
}

/**
 * Converts a wall-clock time on the UTC calendar date of `utcDay`, as shown by
 * a clock in `timeZone` (default: the mint zone, Europe/Athens), to the UTC
 * instant at which that clock shows it.
 *
 * Candidate offsets are the zone's offsets one day before and one day after the
 * wall time; a candidate is accepted when the zone really is at that offset at
 * the resulting instant. This also handles the daylight-saving changes:
 * - A repeated wall time (the hour that occurs twice when summer time ends)
 *   resolves to the first, earlier occurrence (the summer-time instant).
 * - A skipped wall time (the hour that does not exist when summer time starts,
 *   e.g. 03:30 in Athens) is shifted forward by the skipped time, so it maps to
 *   the instant at which the clock first shows 04:30.
 * No mint phase falls in either window (phases run 17:00-19:20 Athens time).
 *
 * Throws if the runtime's Intl cannot report the zone's offset (see
 * `zoneOffsetMillis`).
 */
export function wallTimeToUtcInstantInZone(
  utcDay: Date,
  hour: number,
  minute: number,
  timeZone: string = MINT_TIME_ZONE
): Date {
  const wallClockAsUtc = Date.UTC(
    utcDay.getUTCFullYear(),
    utcDay.getUTCMonth(),
    utcDay.getUTCDate(),
    hour,
    minute
  );
  const offsetBefore = zoneOffsetMillis(
    wallClockAsUtc - MILLIS_PER_DAY,
    timeZone
  );
  const offsetAfter = zoneOffsetMillis(
    wallClockAsUtc + MILLIS_PER_DAY,
    timeZone
  );

  let earliestMatch: number | undefined;
  for (const offset of Array.from(new Set([offsetBefore, offsetAfter]))) {
    const instant = wallClockAsUtc - offset;
    const isValid = zoneOffsetMillis(instant, timeZone) === offset;
    if (isValid && (earliestMatch === undefined || instant < earliestMatch)) {
      earliestMatch = instant;
    }
  }

  // No candidate matched: the wall time is inside a spring-forward gap.
  return new Date(earliestMatch ?? wallClockAsUtc - offsetBefore);
}

/**
 * The viewer's IANA time zone, as the runtime reports it ("UTC" when it reports
 * none). Read it only on the client after hydration: on the server it is the
 * server's zone, not the viewer's.
 */
export function getViewerTimeZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/**
 * The calendar date that `instant` falls on in `timeZone` (an IANA name such as
 * "Pacific/Auckland"), returned as 00:00 UTC of that date. Like the calendar
 * grid's cell dates, the result names a day: read it with UTC getters, never
 * as an instant.
 *
 * Throws if Intl does not return readable date parts.
 */
export function calendarDayInZone(instant: Date, timeZone: string): Date {
  const wallClockAsUtc = wallClockAsUtcMillis(instant.getTime(), timeZone);
  if (!Number.isFinite(wallClockAsUtc)) {
    throw new TypeError(
      `Unable to read the calendar date in time zone "${timeZone}": Intl returned unreadable date parts`
    );
  }
  return new Date(Math.floor(wallClockAsUtc / MILLIS_PER_DAY) * MILLIS_PER_DAY);
}
