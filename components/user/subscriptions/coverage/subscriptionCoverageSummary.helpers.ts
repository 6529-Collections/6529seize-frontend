import { MEMES_CONTRACT } from "@/constants/constants";
import type { NFTFinalSubscription } from "@/generated/models/NFTFinalSubscription";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { ApiSubscriptionCoverageDeadlineBasis } from "@/generated/models/ApiSubscriptionCoverageDeadlineBasis";
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

export function subscriptionCoverageTimestamp(
  value: Date | string | null | undefined
): number | undefined {
  if (!value) return undefined;
  const timestamp =
    typeof value === "string" ? Date.parse(value) : value.getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function isImmediateSubscriptionShortfall(
  coverage: ApiSubscriptionCoverage | undefined
): boolean {
  return (
    !!coverage?.next_unfunded &&
    coverage.fully_funded_drops === 0 &&
    FUNDED_COUNT_STATUSES.includes(coverage.status)
  );
}

export function isMintDayCoverageShortfall(
  coverage: ApiSubscriptionCoverage | undefined,
  now = Date.now()
): boolean {
  const mintAt = subscriptionCoverageTimestamp(
    coverage?.next_unfunded?.mint_at
  );
  return (
    isImmediateSubscriptionShortfall(coverage) &&
    mintAt !== undefined &&
    now > 0 &&
    Math.floor(mintAt / 86_400_000) === Math.floor(now / 86_400_000)
  );
}

export function hasPassedSubscriptionDeadline(
  coverage: ApiSubscriptionCoverage | undefined,
  now: number
): boolean {
  return (
    isImmediateSubscriptionShortfall(coverage) &&
    hasExpiredSubscriptionFundingDeadline(coverage, now)
  );
}

export function getAuthoritativeSubscriptionDeadline(
  coverage: ApiSubscriptionCoverage | undefined
): number | undefined {
  const deadline = subscriptionCoverageTimestamp(
    coverage?.next_unfunded?.top_up_deadline
  );
  return deadline !== undefined &&
    coverage?.forecast.deadline_basis ===
      ApiSubscriptionCoverageDeadlineBasis.Authoritative
    ? deadline
    : undefined;
}

export function hasExpiredSubscriptionFundingDeadline(
  coverage: ApiSubscriptionCoverage | undefined,
  now: number
): boolean {
  const deadline = getAuthoritativeSubscriptionDeadline(coverage);
  return deadline !== undefined && now > 0 && now >= deadline;
}

export function shouldCheckSubscriptionPayment(
  coverage: ApiSubscriptionCoverage | undefined,
  now: number
): boolean {
  if (!isImmediateSubscriptionShortfall(coverage) || now <= 0) return false;
  const mintAt = subscriptionCoverageTimestamp(
    coverage?.next_unfunded?.mint_at
  );
  return (
    hasPassedSubscriptionDeadline(coverage, now) ||
    (mintAt !== undefined &&
      Math.floor(mintAt / 86_400_000) <= Math.floor(now / 86_400_000))
  );
}

export function getPartiallyFundedSubscriptionDrop(
  coverage: ApiSubscriptionCoverage | undefined
) {
  const next = coverage?.next_unfunded;
  if (!isImmediateSubscriptionShortfall(coverage) || !next) return undefined;
  const {
    requested_mints: requested,
    funded_mints: funded,
    missing_mints: missing,
  } = next;
  return Number.isInteger(requested) &&
    Number.isInteger(funded) &&
    Number.isInteger(missing) &&
    requested > 1 &&
    funded > 0 &&
    missing > 0 &&
    funded + missing === requested
    ? next
    : undefined;
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
