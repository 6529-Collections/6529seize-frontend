import { MEMES_CONTRACT } from "@/constants/constants";
import type { NFTFinalSubscription } from "@/generated/models/NFTFinalSubscription";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";
import type { SupportedLocale } from "@/i18n/locales";
import { getSubscriptionCoveragePresentation } from "./subscriptionCoverage.helpers";

export const FUNDED_COUNT_STATUSES: readonly Status[] = [
  Status.Covered,
  Status.EarlyWarning,
  Status.RunningLow,
  Status.ActionRequired,
];

/** The card answers for the selected forecast; shared API status labels stay intact. */
export function getSubscriptionCoverageSummaryPresentation(
  locale: SupportedLocale,
  coverage: ApiSubscriptionCoverage | undefined,
  mintDayStatus?: MintDaySubscriptionStatus
) {
  if (mintDayStatus === "paid")
    return getSubscriptionCoveragePresentation(locale, Status.Covered);
  if (mintDayStatus === "checking" || mintDayStatus === "unavailable")
    return getSubscriptionCoveragePresentation(locale, Status.Unknown);
  let status = coverage?.status ?? Status.Unknown;
  if (coverage && FUNDED_COUNT_STATUSES.includes(status)) {
    if (!coverage.next_unfunded) {
      status =
        coverage.fully_funded_drops > 0 ? Status.Covered : Status.Unknown;
    } else if (
      status === Status.ActionRequired &&
      coverage.fully_funded_drops > 0
    ) {
      status = Status.RunningLow;
    }
  }
  const presentation = getSubscriptionCoveragePresentation(locale, status);
  return {
    ...presentation,
    tone:
      status === Status.EarlyWarning ? ("neutral" as const) : presentation.tone,
  };
}

export type MintDaySubscriptionStatus =
  | "checking"
  | "paid"
  | "unpaid"
  | "unavailable";

function utcDay(value: Date | string): string | undefined {
  const date = typeof value === "string" ? new Date(value) : value;
  return date instanceof Date && Number.isFinite(date.getTime())
    ? date.toISOString().slice(0, 10)
    : undefined;
}

export function isMintDayCoverageShortfall(
  coverage: ApiSubscriptionCoverage | undefined
): boolean {
  if (
    !coverage?.next_unfunded ||
    coverage.fully_funded_drops !== 0 ||
    !FUNDED_COUNT_STATUSES.includes(coverage.status)
  )
    return false;
  const mintDay = utcDay(coverage.next_unfunded.mint_at);
  return mintDay !== undefined && mintDay === utcDay(coverage.calculated_at);
}

export function isNextDropSubscriptionPaid(
  coverage: ApiSubscriptionCoverage,
  final: NFTFinalSubscription | null | undefined
): boolean {
  const next = coverage.next_unfunded;
  return (
    !!next &&
    !!final &&
    final.token_id === next.token_id &&
    typeof final.contract === "string" &&
    final.contract.toLowerCase() === MEMES_CONTRACT.toLowerCase() &&
    Number.isInteger(next.requested_mints) &&
    next.requested_mints > 0 &&
    Number.isInteger(final.subscribed_count) &&
    final.subscribed_count >= next.requested_mints &&
    Number.isInteger(final.redeemed_count) &&
    (final.redeemed_count ?? 0) >= next.requested_mints
  );
}
