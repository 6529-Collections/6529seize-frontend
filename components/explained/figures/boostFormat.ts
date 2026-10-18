import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCents } from "@/lib/explained/format";

export { formatCents };

/**
 * A boost part as P26 §8.3 adds it: to the hundredth, or to the thousandth
 * for the extra-set bonus, which is not a whole number of hundredths.
 */
export function formatNumberParts(
  locale: SupportedLocale,
  value: number
): string {
  const hundredths = Math.round(value * 100);
  const exact = Math.abs(value * 100 - hundredths) < 1e-9;
  return formatNumber(locale, value, {
    minimumFractionDigits: exact ? 2 : 3,
    maximumFractionDigits: exact ? 2 : 3,
  });
}
