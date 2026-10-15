// Current offsets, local times and zone names come from the browser's IANA
// time-zone database through Intl. Nothing here hard-codes offsets or DST
// rules; every value is derived from Intl.DateTimeFormat output.

export type DstStatus = "daylight" | "standard" | "none";

type FormatterKind =
  | "offset"
  | "generic"
  | "time"
  | "timeWithSeconds"
  | "date"
  | "fullDate";

const OFFSET_PREFIXES = ["GMT", "UTC"] as const;
const MINUS_SIGN = "−";
const HOURS_PATTERN = /^\d{1,2}$/;
const TWO_DIGITS_PATTERN = /^\d{2}$/;
// Offsets are parsed from a fixed locale so localized digits or labels never
// reach the parser.
const OFFSET_PARSE_LOCALE = "en-US";
const MINUTES_PER_HOUR = 60;
const MONTHS_PER_YEAR = 12;

const FORMATTER_OPTIONS: Record<FormatterKind, Intl.DateTimeFormatOptions> = {
  offset: { timeZoneName: "longOffset" },
  generic: { timeZoneName: "longGeneric" },
  time: { timeStyle: "short" },
  timeWithSeconds: { timeStyle: "medium" },
  date: { weekday: "short", day: "numeric", month: "short" },
  fullDate: { dateStyle: "full" },
};

const formatterCache = new Map<string, Intl.DateTimeFormat | null>();
const offsetRangeCache = new Map<string, OffsetRange | null>();

type OffsetRange = {
  readonly min: number;
  readonly max: number;
};

type SignedClock = {
  readonly sign: 1 | -1;
  readonly hours: number;
  readonly minutes: number | null;
  readonly seconds: number | null;
};

function parseSign(character: string): 1 | -1 | null {
  if (character === "+") {
    return 1;
  }
  return character === "-" || character === MINUS_SIGN ? -1 : null;
}

function parseOptionalTwoDigits(part: string | undefined): number | null {
  return part === undefined ? null : Number(part);
}

// Parses "+5", "-03:00" or "+05:30:00" (sign, then h[:mm[:ss]]).
export function parseSignedClock(text: string): SignedClock | null {
  const sign = parseSign(text.charAt(0));
  const [hours, minutes, seconds, ...extra] = text.slice(1).split(":");
  if (
    sign === null ||
    extra.length > 0 ||
    hours === undefined ||
    !HOURS_PATTERN.test(hours) ||
    [minutes, seconds].some(
      (part) => part !== undefined && !TWO_DIGITS_PATTERN.test(part)
    )
  ) {
    return null;
  }
  return {
    sign,
    hours: Number(hours),
    minutes: parseOptionalTwoDigits(minutes),
    seconds: parseOptionalTwoDigits(seconds),
  };
}

// Parses Intl "longOffset" names: "GMT", "GMT+05:30", "GMT-03:00".
export function parseOffsetMinutes(label: string): number | null {
  const trimmed = label.trim();
  const prefix = OFFSET_PREFIXES.find((candidate) =>
    trimmed.startsWith(candidate)
  );
  if (prefix === undefined) {
    return null;
  }
  const rest = trimmed.slice(prefix.length);
  if (rest === "") {
    return 0;
  }
  const clock = parseSignedClock(rest);
  if (clock === null) {
    return null;
  }
  const total =
    clock.hours * MINUTES_PER_HOUR +
    (clock.minutes ?? 0) +
    (clock.seconds ?? 0) / MINUTES_PER_HOUR;
  return total === 0 ? 0 : clock.sign * total;
}

function getFormatter(
  locale: string,
  timeZone: string,
  kind: FormatterKind
): Intl.DateTimeFormat | null {
  const key = `${locale}|${timeZone}|${kind}`;
  const cached = formatterCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  let formatter: Intl.DateTimeFormat | null;
  try {
    formatter = new Intl.DateTimeFormat(locale, {
      ...FORMATTER_OPTIONS[kind],
      timeZone,
    });
  } catch {
    // Unknown zone in this browser's tz database (RangeError) or an
    // unsupported option: callers mark the zone as unavailable.
    formatter = null;
  }
  formatterCache.set(key, formatter);
  return formatter;
}

function getTimeZoneNamePart(
  formatter: Intl.DateTimeFormat | null,
  date: Date
): string | null {
  return (
    formatter?.formatToParts(date).find((part) => part.type === "timeZoneName")
      ?.value ?? null
  );
}

export function isSupportedTimeZone(timeZone: string): boolean {
  return getFormatter(OFFSET_PARSE_LOCALE, timeZone, "offset") !== null;
}

// The browser's canonical form of a zone ID. V8 maps current IANA names to
// CLDR's legacy IDs ("Asia/Kolkata" -> "Asia/Calcutta"); other engines keep
// the ID as given. Comparing canonical forms matches either way.
export function getCanonicalTimeZone(timeZone: string): string | null {
  return (
    getFormatter(OFFSET_PARSE_LOCALE, timeZone, "offset")?.resolvedOptions()
      .timeZone ?? null
  );
}

export function isSameTimeZone(left: string, right: string): boolean {
  if (left === right) {
    return true;
  }
  const canonical = getCanonicalTimeZone(left);
  return canonical !== null && canonical === getCanonicalTimeZone(right);
}

export function getOffsetMinutes(timeZone: string, date: Date): number | null {
  const label = getTimeZoneNamePart(
    getFormatter(OFFSET_PARSE_LOCALE, timeZone, "offset"),
    date
  );
  return label === null ? null : parseOffsetMinutes(label);
}

export function formatZoneTime(
  locale: string,
  timeZone: string,
  date: Date
): string | null {
  return getFormatter(locale, timeZone, "time")?.format(date) ?? null;
}

export function formatZoneDate(
  locale: string,
  timeZone: string,
  date: Date
): string | null {
  return getFormatter(locale, timeZone, "date")?.format(date) ?? null;
}

export function formatZoneTimeWithSeconds(
  locale: string,
  timeZone: string,
  date: Date
): string | null {
  return (
    getFormatter(locale, timeZone, "timeWithSeconds")?.format(date) ?? null
  );
}

export function formatZoneFullDate(
  locale: string,
  timeZone: string,
  date: Date
): string | null {
  return getFormatter(locale, timeZone, "fullDate")?.format(date) ?? null;
}

export function getGenericZoneName(
  locale: string,
  timeZone: string,
  date: Date
): string | null {
  return getTimeZoneNamePart(getFormatter(locale, timeZone, "generic"), date);
}

function getOffsetRange(timeZone: string, year: number): OffsetRange | null {
  const key = `${timeZone}|${year}`;
  const cached = offsetRangeCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const offsets: number[] = [];
  for (let month = 0; month < MONTHS_PER_YEAR; month += 1) {
    const offset = getOffsetMinutes(
      timeZone,
      new Date(Date.UTC(year, month, 1, 12))
    );
    if (offset === null) {
      break;
    }
    offsets.push(offset);
  }
  const range =
    offsets.length === MONTHS_PER_YEAR
      ? { min: Math.min(...offsets), max: Math.max(...offsets) }
      : null;
  offsetRangeCache.set(key, range);
  return range;
}

// Derived, not looked up: a zone observes seasonal time when its offset
// changes across the current UTC year, and is on daylight time while its
// offset is above that year's lowest offset.
export function getDstStatus(timeZone: string, date: Date): DstStatus | null {
  const range = getOffsetRange(timeZone, date.getUTCFullYear());
  const current = getOffsetMinutes(timeZone, date);
  if (range === null || current === null) {
    return null;
  }
  if (range.min === range.max) {
    return "none";
  }
  return current > range.min ? "daylight" : "standard";
}

function padTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

// "+05:30", "-03:00" or "" for UTC itself. Messages wrap it as "UTC{offset}".
export function formatOffsetSuffix(offsetMinutes: number): string {
  if (offsetMinutes === 0) {
    return "";
  }
  const absolute = Math.abs(Math.round(offsetMinutes));
  const sign = offsetMinutes > 0 ? "+" : "-";
  return `${sign}${padTwoDigits(Math.floor(absolute / MINUTES_PER_HOUR))}:${padTwoDigits(absolute % MINUTES_PER_HOUR)}`;
}

export function getViewerTimeZone(): string | null {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

// Whether two zones keep the same clock on the first and fifteenth of every
// month of the given UTC year. Used to match a browser-reported alias (such as
// a legacy name) to the boundary zone that shares its clock.
export function haveSameYearClock(
  left: string,
  right: string,
  year: number
): boolean {
  for (let month = 0; month < MONTHS_PER_YEAR; month += 1) {
    for (const day of [1, 15]) {
      const sample = new Date(Date.UTC(year, month, day, 12));
      const leftOffset = getOffsetMinutes(left, sample);
      if (
        leftOffset === null ||
        leftOffset !== getOffsetMinutes(right, sample)
      ) {
        return false;
      }
    }
  }
  return true;
}
