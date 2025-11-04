"use client";

import { useMemo } from "react";
import Link from "next/link";

import { useAuth } from "@/components/auth/Auth";
import { deriveProfileIdentifier } from "@/components/xtdh/profile-utils";
import { useIdentityTdhStats } from "@/hooks/useIdentityTdhStats";

import { CapacityProgressCard } from "./CapacityProgressCard";
import {
  OVERVIEW_CARD_CLASS,
  SECTION_HEADER_CLASS,
} from "./constants";
import { StatsMetricsGrid } from "./StatsMetricsGrid";
import {
  calculatePercentage,
  clampToRange,
  formatPercentLabel,
  formatPlainNumber,
  formatRateValue,
} from "./utils";
import { UserStatusSkeleton } from "./Skeletons";

const NOT_AVAILABLE_LABEL = "Not available yet";

export function UserXtdhStatusSection(): JSX.Element {
  const { connectedProfile } = useAuth();
  const identity = useMemo(
    () => deriveProfileIdentifier(connectedProfile),
    [connectedProfile]
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useIdentityTdhStats({
    identity,
    enabled: Boolean(identity),
  });

  const baseClass = OVERVIEW_CARD_CLASS;
  const title = (
    <h2 className="tw-m-0 tw-text-lg tw-font-semibold">Your xTDH Status</h2>
  );

  if (!connectedProfile || !identity) {
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

  if (isLoading && !data) {
    return <UserStatusSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className={baseClass} role="region" aria-label="Your xTDH status">
        {title}
        <p className="tw-mt-2 tw-text-sm tw-text-iron-300">
          {error?.message ?? "Unable to load xTDH data"}
        </p>
        <div className="tw-mt-auto tw-flex tw-justify-end">
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-50 tw-transition hover:tw-bg-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  const dailyCapacity = Math.max(data.xtdhRate, 0);
  const allocated = clampToRange(data.grantedXtdhPerDay, 0, dailyCapacity);
  const autoAccruing = clampToRange(
    dailyCapacity - allocated,
    0,
    dailyCapacity
  );
  const isEmptyState = dailyCapacity <= 0;
  const cardAriaLabel = isEmptyState
    ? "Your xTDH status - No Base TDH"
    : "Your xTDH status";
  const percentAllocated = calculatePercentage(allocated, dailyCapacity);
  const percentLabel = isEmptyState
    ? undefined
    : formatPercentLabel(percentAllocated, "Allocated");
  const footnote = isEmptyState ? "No capacity yet" : undefined;
  const baseTdhMetricValue =
    typeof data.baseTdhRate === "number" && Number.isFinite(data.baseTdhRate)
      ? formatRateValue(data.baseTdhRate)
      : NOT_AVAILABLE_LABEL;
  const baseTdhSuffix =
    typeof data.baseTdhRate === "number" && Number.isFinite(data.baseTdhRate)
      ? "/day"
      : undefined;
  const allocationsValue = NOT_AVAILABLE_LABEL;
  const collectionsValue = formatPlainNumber(data.grantedCollectionsCount);
  const tokensValue = formatPlainNumber(data.grantedTokensCount);
  const primaryMetrics = [
    {
      label: "Base TDH Rate",
      value: baseTdhMetricValue,
      valueSuffix: baseTdhSuffix,
      tooltip:
        "Your daily Base TDH generation rate (from Memes + Gradients). xTDH is calculated from this.",
    },
    {
      label: "Your Allocations",
      value: allocationsValue,
      tooltip: "Number of allocations you have actively granted.",
    },
    {
      label: "Collections",
      value: collectionsValue,
      tooltip: "Collections you have allocated xTDH to.",
    },
    {
      label: "Tokens",
      value: tokensValue,
      tooltip: "Individual tokens you have allocated xTDH to.",
    },
  ] as const;
  const secondaryMetrics = [
    {
      label: "Your xTDH Accrued",
      value: formatPlainNumber(data.totalReceivedXtdh),
      tooltip:
        "Total xTDH you've earned through auto-accrual and from collections allocating to your NFTs.",
    },
    {
      label: "Your xTDH Granted",
      value: formatPlainNumber(data.totalGrantedXtdh),
      tooltip: "Total xTDH you've given out through your allocations.",
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
              {isEmptyState ? (
                <>
                  {" "}
                  <Link
                    href="/network/metrics#tdh"
                    className="tw-font-semibold tw-text-primary-300 hover:tw-text-primary-200"
                  >
                    Learn about earning TDH
                  </Link>
                </>
              ) : null}
            </p>
          </div>
          <CapacityProgressCard
            title="YOUR DAILY XTDH CAPACITY"
            total={dailyCapacity}
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
