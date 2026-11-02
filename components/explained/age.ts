import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "./i18n";

/**
 * How long ago, or how long until: "8 h 51 min", "14 h 20 min", "2 d 3 h".
 * Shared by the feed-time pill (client) and the day tiles (server).
 */
export function ageText(locale: SupportedLocale, minutes: number): string {
  if (minutes < 60) {
    return kt(locale, "explained.kit.age.minutes", { minutes });
  }
  if (minutes < 24 * 60) {
    return kt(locale, "explained.kit.age.hours", {
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
    });
  }
  return kt(locale, "explained.kit.age.days", {
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
  });
}

/**
 * The same, in whole hours for a phone's narrow tile: "in 3 h", not a line
 * that wraps onto three.
 */
export function ageTextShort(locale: SupportedLocale, minutes: number): string {
  if (minutes < 60) {
    return kt(locale, "explained.kit.age.minutes", { minutes });
  }
  return kt(locale, "explained.kit.age.hoursShort", {
    hours: Math.round(minutes / 60),
  });
}

/** Two hours past its cadence, a live source is late. */
const LATE_GRACE_MINUTES = 120;

export function isLate(minutes: number, cadenceMinutes: number): boolean {
  return minutes > cadenceMinutes + LATE_GRACE_MINUTES;
}
