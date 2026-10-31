import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

/** "15 October 2026"-style date for a "YYYY-MM-DD" UTC calendar day. */
export function formatCycleDate(locale: SupportedLocale, date: string): string {
  return formatDate(locale, date, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
