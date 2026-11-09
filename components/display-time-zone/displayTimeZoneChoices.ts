import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getTimeZoneCityName,
  LOCAL_TIME_ZONE_PREFERENCE,
  resolveDisplayTimeZone,
  UTC_TIME_ZONE_PREFERENCE,
  type DisplayTimeZonePreference,
} from "@/lib/display-time-zone/displayTimeZone";
import { formatZonedClockTime } from "@/lib/display-time-zone/waveDropTimeFormat";

export interface DisplayTimeZoneChoice {
  readonly preference: DisplayTimeZonePreference;
  /** Option title: "Local time", "UTC" or a city such as "Berlin". */
  readonly label: string;
  /** Name inside sentences: "local time", "UTC" or "Berlin". */
  readonly name: string;
  /** The time now in this choice, as post headers would show it. */
  readonly timeNow: string;
}

export function describeDisplayTimeZone(
  preference: DisplayTimeZonePreference,
  {
    locale,
    deviceTimeZone,
    now = Date.now(),
  }: {
    readonly locale: SupportedLocale;
    readonly deviceTimeZone: string | undefined;
    readonly now?: number | undefined;
  }
): DisplayTimeZoneChoice {
  const timeNow = formatZonedClockTime(new Date(now), {
    zone: resolveDisplayTimeZone(preference, deviceTimeZone),
  });
  if (preference === LOCAL_TIME_ZONE_PREFERENCE) {
    return {
      preference,
      label: t(locale, "displayTimeZone.option.local"),
      name: t(locale, "displayTimeZone.name.local"),
      timeNow,
    };
  }
  if (preference === UTC_TIME_ZONE_PREFERENCE) {
    const utc = t(locale, "displayTimeZone.option.utc");
    return { preference, label: utc, name: utc, timeNow };
  }
  const city = getTimeZoneCityName(preference);
  return { preference, label: city, name: city, timeNow };
}

/**
 * The choice the wave switch offers next to the saved setting: UTC, or local
 * time when the setting already is UTC.
 */
export function getAlternativeDisplayTimeZone(
  preference: DisplayTimeZonePreference
): DisplayTimeZonePreference {
  return preference === UTC_TIME_ZONE_PREFERENCE
    ? LOCAL_TIME_ZONE_PREFERENCE
    : UTC_TIME_ZONE_PREFERENCE;
}
