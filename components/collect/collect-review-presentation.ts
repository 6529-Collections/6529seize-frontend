import type { SupportedLocale } from "@/i18n/locales";
import { formatCollectReviewWei } from "./collect-review-amounts";

/** Round only display values; never use this result to construct transaction terms. */
export function compactCollectReviewAmount(
  locale: SupportedLocale,
  wei: string
) {
  const amount = BigInt(wei);
  if (amount < 0n) throw new Error("INVALID_DISPLAY_AMOUNT");
  const unit = amount > 0n && amount < 10n ** 13n ? 10n ** 10n : 10n ** 13n;
  const rounded = ((amount + unit / 2n) / unit) * unit;
  // Very small positive amounts retain exact precision rather than appearing as zero.
  const displayed = rounded === 0n ? amount : rounded;
  return {
    text: formatCollectReviewWei(locale, displayed.toString()),
    approximate: displayed !== amount,
  };
}

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
