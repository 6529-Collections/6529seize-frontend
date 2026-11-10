/**
 * The zone that wave, message, decision and notification times render in.
 *
 * A screenshot shows these times, and post times are public, so a local clock
 * time reveals the viewer's UTC offset. Viewers can choose UTC or another zone
 * instead. Any time that is not in the device's own zone carries its zone
 * name, so a reader of a screenshot is never misled.
 */

/** Stored preference: the device zone, UTC, or an IANA zone name. */
// `string & {}` keeps editor hints for the two named values.
export type DisplayTimeZonePreference = "local" | "UTC" | (string & {});

export const LOCAL_TIME_ZONE_PREFERENCE = "local";
export const UTC_TIME_ZONE_PREFERENCE = "UTC";

export interface DisplayTimeZone {
  /** IANA zone to format in. `undefined` formats in the device zone. */
  readonly timeZone: string | undefined;
  /**
   * True when the result equals the device's own zone. Such times carry no
   * zone label, exactly as before this setting existed.
   */
  readonly isLocal: boolean;
}

export const LOCAL_DISPLAY_TIME_ZONE: DisplayTimeZone = Object.freeze({
  timeZone: undefined,
  isLocal: true,
});

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) {
    return false;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Unknown, corrupt or unsupported values fall back to the device zone. */
export function normalizeDisplayTimeZonePreference(
  value: unknown
): DisplayTimeZonePreference {
  if (value === LOCAL_TIME_ZONE_PREFERENCE) {
    return LOCAL_TIME_ZONE_PREFERENCE;
  }
  if (value === UTC_TIME_ZONE_PREFERENCE) {
    return UTC_TIME_ZONE_PREFERENCE;
  }
  return isValidTimeZone(value) ? value : LOCAL_TIME_ZONE_PREFERENCE;
}

export function getDeviceTimeZone(): string | undefined {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

function getCanonicalTimeZone(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone }).resolvedOptions()
      .timeZone;
  } catch {
    return timeZone;
  }
}

/** Whether two zone names render every instant identically. */
function isSameTimeZone(a: string, b: string): boolean {
  return getCanonicalTimeZone(a) === getCanonicalTimeZone(b);
}

export function resolveDisplayTimeZone(
  preference: DisplayTimeZonePreference,
  deviceTimeZone: string | undefined
): DisplayTimeZone {
  if (preference === LOCAL_TIME_ZONE_PREFERENCE) {
    return LOCAL_DISPLAY_TIME_ZONE;
  }
  if (
    deviceTimeZone !== undefined &&
    isSameTimeZone(preference, deviceTimeZone)
  ) {
    return LOCAL_DISPLAY_TIME_ZONE;
  }
  return { timeZone: preference, isLocal: false };
}

/**
 * Options for a clock time (or a date with a time). Outside the device zone,
 * the output names its zone, such as "05:06 PM UTC".
 */
export function withDisplayTimeZone(
  zone: DisplayTimeZone,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions {
  if (zone.isLocal) {
    return zone.timeZone === undefined
      ? options
      : { ...options, timeZone: zone.timeZone };
  }
  const { timeStyle } = options;
  if (timeStyle === "long" || timeStyle === "full") {
    // These styles already print the zone name.
    return { ...options, timeZone: zone.timeZone };
  }
  return {
    ...expandStyles(options),
    timeZone: zone.timeZone,
    timeZoneName: options.timeZoneName ?? "short",
  };
}

const DATE_STYLE_FIELDS: Record<
  NonNullable<Intl.DateTimeFormatOptions["dateStyle"]>,
  Intl.DateTimeFormatOptions
> = {
  short: { year: "2-digit", month: "numeric", day: "numeric" },
  medium: { year: "numeric", month: "short", day: "numeric" },
  long: { year: "numeric", month: "long", day: "numeric" },
  full: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
};

/**
 * `Intl` rejects `timeZoneName` next to `dateStyle` or `timeStyle`, so a
 * zone label needs the equivalent explicit fields.
 */
function expandStyles(
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions {
  const { dateStyle, timeStyle, ...rest } = options;
  if (dateStyle === undefined && timeStyle === undefined) {
    return options;
  }
  return {
    ...rest,
    ...(dateStyle === undefined ? {} : DATE_STYLE_FIELDS[dateStyle]),
    ...(timeStyle === undefined
      ? {}
      : {
          hour: "numeric",
          minute: "2-digit",
          ...(timeStyle === "medium" ? { second: "2-digit" } : {}),
        }),
  };
}

/**
 * Options for a calendar date with no clock time. The day follows the display
 * zone, so "Nov 9" and "Yesterday" flip at that zone's midnight; no zone label
 * is added to a bare date.
 */
export function withDisplayTimeZoneDate(
  zone: DisplayTimeZone,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions {
  return zone.timeZone === undefined
    ? options
    : { ...options, timeZone: zone.timeZone };
}

/** The short zone name, such as "UTC" or "GMT+1", for labels and announcements. */
export function getTimeZoneShortName(
  locale: Intl.LocalesArgument,
  timeZone: string | undefined,
  at: Date = new Date()
): string {
  try {
    const part = new Intl.DateTimeFormat(locale, {
      timeZone,
      timeZoneName: "short",
    })
      .formatToParts(at)
      .find((item) => item.type === "timeZoneName");
    return part?.value ?? timeZone ?? "";
  } catch {
    return timeZone ?? "";
  }
}

/** A readable place name for an IANA zone: "America/New_York" -> "New York". */
export function getTimeZoneCityName(timeZone: string): string {
  const city = timeZone.split("/").at(-1) ?? timeZone;
  return city.replaceAll("_", " ");
}
