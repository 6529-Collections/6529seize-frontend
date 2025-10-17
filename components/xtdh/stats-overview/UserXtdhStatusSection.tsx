import Link from "next/link";

import { CapacityProgressCard } from "./CapacityProgressCard";
import {
  OVERVIEW_CARD_CLASS,
  SECTION_HEADER_CLASS,
} from "./constants";
import { StatsMetricsGrid } from "./StatsMetricsGrid";
import type { UserSectionState } from "./types";
import {
  calculatePercentage,
  clampToRange,
  formatPercentLabel,
  formatPlainNumber,
  formatRateValue,
} from "./utils";
import { UserStatusSkeleton } from "./Skeletons";

interface UserXtdhStatusSectionProps {
  readonly state: UserSectionState;
  readonly onRetry?: () => void;
}

export function UserXtdhStatusSection({
  state,
  onRetry,
}: Readonly<UserXtdhStatusSectionProps>) {
  if (state.kind === "loading") {
    return <UserStatusSkeleton />;
  }

  const baseClass = OVERVIEW_CARD_CLASS;
  const title = (
    <h2 className="tw-m-0 tw-text-lg tw-font-semibold">Your xTDH Status</h2>
  );

  if (state.kind === "unauthenticated") {
    return (
      <section className={baseClass} role="region" aria-label="Your xTDH status">
        {title}
        <p className="tw-mt-2 tw-text-sm tw-text-iron-300">
          Connect wallet to see your xTDH status.
        </p>
        <div className="tw-mt-auto tw-flex tw-justify-end">
          <button
            type="button"
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-50 tw-transition hover:tw-bg-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
          >
            Connect Wallet
          </button>
        </div>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section className={baseClass} role="region" aria-label="Your xTDH status">
        {title}
        <p className="tw-mt-2 tw-text-sm tw-text-iron-300">
          {state.message ?? "Unable to load xTDH data"}
        </p>
        {onRetry ? (
          <div className="tw-mt-auto tw-flex tw-justify-end">
            <button
              type="button"
              onClick={onRetry}
              className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-50 tw-transition hover:tw-bg-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
            >
              Retry
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  if (state.kind !== "ready" && state.kind !== "no_base_tdh") {
    return <UserStatusSkeleton />;
  }

  const isEmptyState = state.kind === "no_base_tdh";
  const cardAriaLabel = isEmptyState
    ? "Your xTDH status - No Base TDH"
    : "Your xTDH status";
  const capacity = Math.max(state.dailyCapacity, 0);
  const allocated = clampToRange(state.allocatedDaily, 0, capacity);
  const autoAccruing = clampToRange(state.autoAccruingDaily, 0, capacity);
  const percentAllocated = calculatePercentage(allocated, capacity);
  const percentLabel = isEmptyState
    ? undefined
    : formatPercentLabel(percentAllocated, "Allocated");
  const footnote = isEmptyState ? "No capacity yet" : undefined;
  const baseTdhMetricValue = formatRateValue(state.baseTdhRate);
  const allocationsValue = formatPlainNumber(state.allocationsCount);
  const collectionsValue = formatPlainNumber(state.collectionsAllocatedCount);
  const tokensValue = formatPlainNumber(state.tokensAllocatedCount);
  const primaryMetrics = [
    {
      label: "Base TDH Rate",
      value: baseTdhMetricValue,
      valueSuffix: "/day",
      tooltip:
        "Your daily Base TDH generation rate (from Memes + Gradients). xTDH is calculated from this.",
      helperText: isEmptyState ? "Need Memes/Gradients" : undefined,
      tone: isEmptyState ? "muted" : undefined,
    },
    {
      label: "Your Allocations",
      value: allocationsValue,
      tooltip: "Number of allocations you have actively granted.",
      helperText: isEmptyState ? "Start allocating" : undefined,
      tone: isEmptyState ? "muted" : undefined,
    },
    {
      label: "Collections",
      value: collectionsValue,
      tooltip: "Collections you have allocated xTDH to.",
      helperText: isEmptyState ? "No allocations yet" : undefined,
      tone: isEmptyState ? "muted" : undefined,
    },
    {
      label: "Tokens",
      value: tokensValue,
      tooltip: "Individual tokens you have allocated xTDH to.",
      helperText: isEmptyState ? "No allocations yet" : undefined,
      tone: isEmptyState ? "muted" : undefined,
    },
  ] as const;
  const secondaryMetrics = [
    {
      label: "Your xTDH Accrued",
      value: formatPlainNumber(state.totalXtdhReceived),
      tooltip:
        "Total xTDH you've earned through auto-accrual and from collections allocating to your NFTs.",
      helperText: isEmptyState ? "No xTDH yet" : undefined,
      tone: isEmptyState ? "muted" : undefined,
    },
    {
      label: "Your xTDH Granted",
      value: formatPlainNumber(state.totalXtdhGranted),
      tooltip: "Total xTDH you've given out through your allocations.",
      helperText: isEmptyState ? "No xTDH yet" : undefined,
      tone: isEmptyState ? "muted" : undefined,
    },
  ] as const;
  const subtitle = isEmptyState
    ? "You need Base TDH (from Memes/Gradients) to generate xTDH."
    : "Daily xTDH budget from your Base TDH and multiplier.";

  return (
    <section className={baseClass} role="region" aria-label={cardAriaLabel}>
      <div className="tw-flex tw-h-full tw-flex-col">
        <div className="tw-flex-1 tw-space-y-6">
          <div className={SECTION_HEADER_CLASS}>
            {title}
            <p className="tw-mt-1 tw-text-sm tw-text-iron-300">
              {subtitle}
            </p>
            {isEmptyState ? (
              <Link
                href="/network/metrics#tdh"
                className="tw-inline-flex tw-text-sm tw-font-semibold tw-text-primary-300 hover:tw-text-primary-200"
              >
                Learn about earning TDH
              </Link>
            ) : null}
          </div>
          <CapacityProgressCard
            title="YOUR DAILY XTDH CAPACITY"
            total={capacity}
            allocated={allocated}
            reserved={autoAccruing}
            allocatedLabel="Allocated"
            reservedLabel="Auto-accruing"
            percentLabel={percentLabel}
            footnote={footnote}
            variant="user"
            isEmpty={isEmptyState}
          />
          <StatsMetricsGrid metrics={primaryMetrics} />
          <StatsMetricsGrid metrics={secondaryMetrics} className="tw-mt-2" />
        </div>
      </div>
    </section>
  );
}
