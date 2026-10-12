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

  // Fallback: prefer the offset that matches the zone's DST on that date (summer first);
  return summerCandidate;
}
