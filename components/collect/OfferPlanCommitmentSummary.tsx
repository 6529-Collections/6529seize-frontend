import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString, formatInteger, formatTime } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { formatEther } from "viem";
import type { offerPlanTotals } from "./collect-offer-plan.helpers";
import type {
  OfferPlanAnalysisView,
  PendingOfferCommitment,
} from "./collect-offer-plan.types";

export default function OfferPlanCommitmentSummary({
  totals,
  publishedAmount,
  pendingAmount,
  visiblePendingOffers,
  busy,
  onReviewPending,
  exceedsBudget,
  fundingConflict,
  analysis,
}: {
  readonly totals: ReturnType<typeof offerPlanTotals>;
  readonly publishedAmount: bigint | null;
  readonly pendingAmount: bigint | null;
  readonly visiblePendingOffers: readonly PendingOfferCommitment[];
  readonly busy: boolean;
  readonly onReviewPending:
    | ((offer: PendingOfferCommitment) => void)
    | undefined;
  readonly exceedsBudget: boolean;
  readonly fundingConflict: boolean;
  readonly analysis: OfferPlanAnalysisView | null;
}) {
  const locale = useBrowserLocale();
  const money = (amount: bigint | string) =>
    t(locale, "collect.offerPlan.weth", {
      amount: formatDecimalString(locale, formatEther(BigInt(amount))),
    });
  return (
    <>
      <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2">
        <span className="tw-text-sm tw-text-iron-300">
          {t(locale, "collect.offerPlan.proposed", {
            count: formatInteger(locale, totals.priced),
          })}
        </span>
        <strong className="tw-break-all tw-text-base tw-font-medium tw-tabular-nums tw-text-iron-100">
          {money(totals.amount)}
        </strong>
      </div>
      {totals.unresolved > 0 && (
        <p className="tw-m-0 tw-text-xs tw-text-iron-400">
          {t(locale, "collect.offerPlan.unpriced", {
            count: formatInteger(locale, totals.unresolved),
          })}
        </p>
      )}
      {publishedAmount !== null && publishedAmount > 0n && (
        <p className="tw-m-0 tw-text-xs tw-text-iron-400">
          {t(locale, "collect.offerPlan.committed", {
            amount: money(publishedAmount),
          })}
        </p>
      )}
      {pendingAmount !== null && pendingAmount > 0n && (
        <p className="tw-m-0 tw-text-xs tw-text-iron-400">
          {t(locale, "collect.offerPlan.pendingCommitment", {
            amount: money(pendingAmount),
          })}
        </p>
      )}
      {visiblePendingOffers.map((offer) => (
        <button
          key={offer.operationId}
          type="button"
          className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-bg-white/5 disabled:tw-opacity-40"
          disabled={busy || !onReviewPending}
          onClick={() => onReviewPending?.(offer)}
        >
          {t(locale, "collect.offerPlan.checkPending", {
            token: offer.assetKey.split(":")[2] ?? "—",
          })}
        </button>
      ))}
      {exceedsBudget && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
          {t(locale, "collect.offerPlan.overBudget")}
        </p>
      )}
      {fundingConflict && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
          {t(locale, "collect.offerPlan.overFunding")}
        </p>
      )}
      {analysis && (
        <p className="tw-m-0 tw-text-xs tw-leading-relaxed tw-text-iron-400">
          {t(locale, "collect.offerPlan.fundingSnapshot", {
            commitments: money(analysis.trackedLiabilityWei),
            available: money(analysis.availableWei),
            time: formatTime(locale, analysis.createdAt),
          })}
        </p>
      )}
    </>
  );
}
