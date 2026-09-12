import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString, formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { formatEther } from "viem";
import { MARKET_BATCH_LIMITS } from "./market-batch-validation";

export default function OfferPlanBuySummary({
  costWei,
  listings,
  disabled,
  onReview,
}: {
  readonly costWei: string | null;
  readonly listings: number;
  readonly disabled: boolean;
  readonly onReview: (reviewedAt: number) => void;
}) {
  const locale = useBrowserLocale();
  const overLimit = listings > MARKET_BATCH_LIMITS.orders;
  return (
    <div className="tw-space-y-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-pb-3">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <div className="tw-space-y-1">
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "collect.blend.purchaseEstimate", {
              amount:
                costWei === null
                  ? "—"
                  : formatDecimalString(locale, formatEther(BigInt(costWei))),
            })}
          </p>
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "collect.blend.separateBudgets")}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || listings === 0 || overLimit || costWei === null}
          onClick={() => onReview(Date.now())}
          className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-4 tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-bg-white/5 disabled:tw-opacity-40"
        >
          {t(locale, "collect.blend.reviewBuys", {
            count: formatInteger(locale, listings),
          })}
        </button>
      </div>
      {overLimit && (
        <p role="status" className="tw-m-0 tw-text-xs tw-text-error">
          {t(locale, "collect.selection.limit", {
            count: formatInteger(locale, MARKET_BATCH_LIMITS.orders),
          })}
        </p>
      )}
    </div>
  );
}
