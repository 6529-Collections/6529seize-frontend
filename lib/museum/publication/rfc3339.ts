// Strict RFC 3339 date-time parsing for publication contracts. `Date.parse`
// alone also accepts zone-less strings (read in the host time zone), date-only
// strings, "Jan 5 2026", bare years, and rolled-over days such as Feb 30, so
// the same record could mean different instants on different machines.
// The fractional seconds are an alternation with an empty branch rather than
// `(...)?`, which keeps the pattern provably linear-time.
const RFC_3339_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+)|)(Z|[+-](\d{2}):(\d{2}))$/u;
// "YYYY-MM-DDTHH:MM:SS" is a fixed-width prefix of every accepted value.
const SECONDS_END = 19;
const MILLISECOND_DIGITS = 3;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function isValidCalendarDate(
  year: number,
  month: number,
  day: number
): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const daysInMonth =
    month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1]!;
  return day <= daysInMonth;
}

function isValidTimeOfDay(
  hour: number,
  minute: number,
  second: number
): boolean {
  // Leap seconds (:60) are valid RFC 3339 but not representable as an
  // instant by `Date`, so they are rejected rather than silently shifted.
  return hour <= 23 && minute <= 59 && second <= 59;
}

// ECMAScript only specifies exactly three fractional digits for Date.parse, so
// a longer producer fraction (for example microseconds) is reduced to
// milliseconds first, truncating the way Date itself does. A value without a
// fraction is parsed unchanged.
function toEcmaScriptDateTime(
  value: string,
  fraction: string | undefined,
  zone: string
): string {
  if (fraction === undefined) return value;
  const milliseconds = fraction
    .slice(0, MILLISECOND_DIGITS)
    .padEnd(MILLISECOND_DIGITS, "0");
  return `${value.slice(0, SECONDS_END)}.${milliseconds}${zone}`;
}

/**
 * Parses an RFC 3339 date-time that carries an explicit `Z` or numeric UTC
 * offset and returns its instant in epoch milliseconds, or `null` when the
 * value is not a string, is not in that exact shape, or names a date or time
 * that does not exist. Fractional seconds beyond milliseconds are truncated.
 */
export function parseRfc3339DateTime(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = RFC_3339_DATE_TIME.exec(value);
  if (match === null) return null;
  const [year, month, day, hour, minute, second] = match
    .slice(1, 7)
    .map(Number) as [number, number, number, number, number, number];
  if (
    !isValidCalendarDate(year, month, day) ||
    !isValidTimeOfDay(hour, minute, second)
  ) {
    return null;
  }
  const fraction = match[7];
  const zone = match[8] ?? "Z";
  const offsetHour = match[9];
  const offsetMinute = match[10];
  if (
    offsetHour !== undefined &&
    offsetMinute !== undefined &&
    (Number(offsetHour) > 23 || Number(offsetMinute) > 59)
  ) {
    return null;
  }
  const instant = Date.parse(toEcmaScriptDateTime(value, fraction, zone));
  return Number.isFinite(instant) ? instant : null;
}

export function isRfc3339DateTime(value: unknown): value is string {
  return parseRfc3339DateTime(value) !== null;
}
