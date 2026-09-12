import type { SupportedLocale } from "@/i18n/locales";
import { formatCollectReviewWei } from "./collect-review-amounts";

/** Display only. Ceiling rounding never changes the validated wei amount. */
export function formatCollectReviewCap(
  locale: SupportedLocale,
  wei: string,
  decimalPlaces = 8
): string {
  if (
    !Number.isInteger(decimalPlaces) ||
    decimalPlaces < 0 ||
    decimalPlaces > 18
  )
    throw new Error("INVALID_DISPLAY_PRECISION");
  const amount = BigInt(wei);
  if (amount < 0n) throw new Error("INVALID_DISPLAY_AMOUNT");
  const unit = 10n ** BigInt(18 - decimalPlaces);
  return formatCollectReviewWei(
    locale,
    (((amount + unit - 1n) / unit) * unit).toString()
  );
}
