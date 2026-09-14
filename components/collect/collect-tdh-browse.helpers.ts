import type { ApiCollectTdhListing } from "@/generated/models/ApiCollectTdhListing";
import type { SupportedLocale } from "@/i18n/locales";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { formatEther } from "viem";

/** Display-only approximation; ordering uses the server's exact wei ratio. */
export function collectTdhValueLabel(
  listing: ApiCollectTdhListing,
  locale: SupportedLocale
): string | null {
  if (
    !/^[1-9]\d{0,77}$/.test(listing.purchase_cost_wei) ||
    !/^[1-9]\d{0,77}$/.test(listing.base_tdh_per_day_hundredths)
  )
    return null;
  const cost = Number(formatEther(BigInt(listing.purchase_cost_wei)));
  const rate = Number(listing.base_tdh_per_day_hundredths) / 100;
  const value = rate / cost;
  if (!Number.isFinite(value) || value <= 0) return null;
  return t(locale, "collect.tdhBrowse.metricValue", {
    value: formatNumber(locale, value, { maximumSignificantDigits: 5 }),
  });
}
