import { formatCollectReviewWei } from "./collect-review-amounts";
import type { SupportedLocale } from "@/i18n/locales";

/** Presentation only. Round estimates upward; retain exact wei for all decisions. */
export function collectPlanAmount(
  locale: SupportedLocale,
  wei: string,
  decimals: 4 | 8 = 4
): { compact: string; exact: string } {
  const amount = BigInt(wei);
  const step = 10n ** BigInt(18 - decimals);
  const exact = `${formatCollectReviewWei(locale, wei)} ETH`;
  if (amount > 0n && amount < step)
    return {
      compact: `<${formatCollectReviewWei(locale, step.toString())} ETH`,
      exact,
    };
  const rounded = ((amount + step - 1n) / step) * step;
  return {
    compact: `${formatCollectReviewWei(locale, rounded.toString())} ETH`,
    exact,
  };
}
