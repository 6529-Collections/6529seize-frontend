import { formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

/** "Tuesday 24 November" in UTC, in the order the locale's copy sets. */
export const formatIdentityMoveDay = (
  locale: SupportedLocale,
  ms: number
): string =>
  t(locale, "identityMove.day", {
    weekday: formatUtcDate(locale, ms, { weekday: "long" }),
    day: formatUtcDate(locale, ms, { day: "numeric" }),
    month: formatUtcDate(locale, ms, { month: "long" }),
  });

/** "00:00" in UTC. */
export const formatIdentityMoveTime = (
  locale: SupportedLocale,
  ms: number
): string =>
  formatUtcDate(locale, ms, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
