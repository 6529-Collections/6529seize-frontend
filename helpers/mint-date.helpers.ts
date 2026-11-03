import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

// A mint date names the calendar day of an on-chain mint. The Memes mint
// schedule is defined on UTC days, so every surface formats the day in UTC.
// That keeps server HTML, the hydrated client and every viewer on the same day.
const MINT_DATE_FORMAT = {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
} satisfies Intl.DateTimeFormatOptions;

export function formatMintDate(
  locale: SupportedLocale,
  value: Date | string | number | null | undefined
): string {
  return formatDate(locale, value, MINT_DATE_FORMAT);
}
