const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TWO_DIGITS_PATTERN = /^\d{2}$/;

const pad = (value: number, length: number): string =>
  String(value).padStart(length, "0");

/**
 * Formats the LOCAL calendar date of `date` as the `YYYY-MM-DD` value used by
 * `<input type="date">`. `toISOString()` would use the UTC date instead, which
 * differs from the user's calendar date for part of every day outside UTC.
 */
export function getLocalDateInputValue(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(
    date.getDate(),
    2
  )}`;
}

// Splits `HH:MM` or `HH:MM:SS` into [hours, minutes, seconds].
function parseTimeInput(time: string): [number, number, number] | null {
  const parts = time.split(":");
  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }
  if (!parts.every((part) => TWO_DIGITS_PATTERN.test(part))) {
    return null;
  }

  const [hours = 0, minutes = 0, seconds = 0] = parts.map(Number);
  return [hours, minutes, seconds];
}

/**
 * Combines `<input type="date">` (`YYYY-MM-DD`) and `<input type="time" step="1">`
 * (`HH:MM` or `HH:MM:SS`) values into a Date in the user's LOCAL time zone.
 *
 * `new Date("YYYY-MM-DD")` is parsed as UTC midnight, so applying local hours to
 * it selects the previous calendar day for every user west of UTC. Building the
 * date from its numeric parts always yields the local calendar day.
 *
 * Returns `null` when either value is missing, malformed, or out of range.
 */
export function parseLocalDateTime(date: string, time: string): Date | null {
  const dateMatch = DATE_INPUT_PATTERN.exec(date);
  const timeParts = parseTimeInput(time);
  if (!dateMatch || !timeParts) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const [hours, minutes, seconds] = timeParts;

  if (hours > 23 || minutes > 59 || seconds > 59) {
    return null;
  }

  const result = new Date(year, month - 1, day, hours, minutes, seconds);

  // Reject calendar values that Date silently rolls over (month 13, Feb 31) and
  // two-digit years that Date maps into the 1900s. Hours are deliberately not
  // compared: a wall-clock time skipped by a DST change is shifted forward.
  const isSameCalendarDay =
    result.getFullYear() === year &&
    result.getMonth() === month - 1 &&
    result.getDate() === day;

  return isSameCalendarDay ? result : null;
}
