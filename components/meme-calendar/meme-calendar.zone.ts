const EUROPE_TZ = "Europe/Athens"; // EET/EEST
const EUROPE_WINTER_OFFSET_HOURS = +2; // EET (UTC+2)
const EUROPE_SUMMER_OFFSET_HOURS = +3; // EEST (UTC+3)

type ZoneWallClock = {
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number;
  readonly hour: number; // 0-23
  readonly minute: number;
};

// Zone math must never depend on the viewer's locale: the default locale can
// render "17.40" (fi-FI, da-DK, id-ID) or non-Latin digits (ar, fa). Read
// numeric parts from a fixed en-US / latn / h23 formatter instead of comparing
// formatted strings.
let europeWallClockFormatter: Intl.DateTimeFormat | undefined;

function getEuropeWallClockFormatter(): Intl.DateTimeFormat {
  europeWallClockFormatter ??= new Intl.DateTimeFormat("en-US", {
    timeZone: EUROPE_TZ,
    calendar: "gregory",
    numberingSystem: "latn",
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
  return europeWallClockFormatter;
}

function getEuropeWallClock(instant: Date): ZoneWallClock | null {
  const parts = getEuropeWallClockFormatter().formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);

  const wallClock: ZoneWallClock = {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    // Some engines report midnight as 24 even with h23; normalise defensively.
    hour: read("hour") % 24,
    minute: read("minute"),
  };
  return Object.values(wallClock).every(Number.isFinite) ? wallClock : null;
}

// EU summer time (EEST, UTC+3 in Athens) runs from 01:00 UTC on the last Sunday
// of March to 01:00 UTC on the last Sunday of October.
const EU_DST_MARCH_MONTH_INDEX = 2;
const EU_DST_OCTOBER_MONTH_INDEX = 9;

function euDstTransitionMillis(year: number, monthIndex: number): number {
  const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0));
  // getUTCDay() is 0 on Sunday, so this steps back to the last Sunday.
  return Date.UTC(
    year,
    monthIndex,
    lastDayOfMonth.getUTCDate() - lastDayOfMonth.getUTCDay(),
    1
  );
}

function isEuSummerTime(instant: Date): boolean {
  const year = instant.getUTCFullYear();
  const millis = instant.getTime();
  return (
    millis >= euDstTransitionMillis(year, EU_DST_MARCH_MONTH_INDEX) &&
    millis < euDstTransitionMillis(year, EU_DST_OCTOBER_MONTH_INDEX)
  );
}

/**
 * Converts a wall-clock time on the UTC calendar date of `utcDay` in
 * Europe/Athens to the UTC instant at which a clock there shows it.
 *
 * Edge cases around the DST changes: a repeated wall time (the hour that
 * occurs twice when summer time ends) resolves to the earlier instant. A wall
 * time that does not exist (03:00-03:59 when summer time starts) is shifted
 * forward by the skipped hour, so 03:30 maps to the instant that shows 04:30
 * EEST. No caller uses such times: mint phases run 17:00-19:20.
 */
export function wallTimeToUtcInstantInZone(
  utcDay: Date,
  hour: number,
  minute: number
): Date {
  const mk = (offsetHours: number) => {
    const out = new Date(utcDay);
    out.setUTCHours(hour - offsetHours, minute, 0, 0);
    return out;
  };

  const winterCandidate = mk(EUROPE_WINTER_OFFSET_HOURS);
  const summerCandidate = mk(EUROPE_SUMMER_OFFSET_HOURS);

  const showsTargetWallTime = (d: Date) => {
    const wallClock = getEuropeWallClock(d);
    return (
      wallClock !== null &&
      wallClock.year === utcDay.getUTCFullYear() &&
      wallClock.month === utcDay.getUTCMonth() + 1 &&
      wallClock.day === utcDay.getUTCDate() &&
      wallClock.hour === hour &&
      wallClock.minute === minute
    );
  };

  if (showsTargetWallTime(summerCandidate)) return summerCandidate;
  if (showsTargetWallTime(winterCandidate)) return winterCandidate;

  // Neither candidate shows the target wall time (a wall time inside the
  // spring-forward gap, or wall-clock parts that could not be read). Decide by
  // the EU DST rule instead of assuming summer time: use the summer offset only
  // if that instant falls within the EU summer-time period.
  return isEuSummerTime(summerCandidate) ? summerCandidate : winterCandidate;
}
