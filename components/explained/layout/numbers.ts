import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

/** A decimal to a fixed number of places, by locale: "0.144", "762.6". */
export function formatDecimal(
  locale: SupportedLocale,
  value: number,
  digits: number
): string {
  return formatNumber(locale, value, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
