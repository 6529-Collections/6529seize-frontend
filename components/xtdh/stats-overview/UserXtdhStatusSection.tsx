import { useId } from "react";
import Link from "next/link";
import { Tooltip } from "react-tooltip";

import { CapacityProgressCard } from "./CapacityProgressCard";
import {
  INFO_TOOLTIP_STYLE,
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

  if (state.kind === "no_base_tdh") {
    return (
      <section className={baseClass} role="region" aria-label="Your xTDH status">
        {title}
        <p className="tw-mt-2 tw-text-sm tw-text-iron-300">
          You need Base TDH (from Memes/Gradients) to generate xTDH.
        </p>
        <Link
          href="/network/metrics#tdh"
          className="tw-mt-3 tw-inline-flex tw-text-sm tw-font-semibold tw-text-primary-300 hover:tw-text-primary-200"
        >
          Learn about earning TDH
        </Link>
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

  if (state.kind !== "ready") {
    return <UserStatusSkeleton />;
  }

  const capacity = Math.max(state.baseTdhRate * state.multiplier, 0);
  const allocated = clampToRange(state.allocatedRate, 0, capacity);
  const autoAccruing = Math.max(capacity - allocated, 0);
  const percentAllocated = calculatePercentage(allocated, capacity);
  const metrics = [
    {
      label: "Base TDH Rate",
      value: formatRateValue(state.baseTdhRate),
      valueSuffix: "/day",
      tooltip:
        "Your daily Base TDH generation rate (from Memes + Gradients). Fluid xTDH is calculated from this.",
    },
    {
      label: "Your Allocations",
      value: formatPlainNumber(state.allocationsCount),
      tooltip: "Number of allocations you have actively granted.",
    },
    {
      label: "Collections",
      value: formatPlainNumber(state.collectionsAllocatedCount),
      tooltip: "Collections you have allocated xTDH to.",
    },
    {
      label: "Tokens",
      value: formatPlainNumber(state.tokensAllocatedCount),
      tooltip: "Individual tokens you have allocated xTDH to.",
    },
    {
      label: "Receiving Collections",
      value: formatPlainNumber(state.receivingCollectionsCount),
      tooltip:
        "Collections allocating xTDH to NFTs you hold. This shows where you benefit from others' allocations.",
    },
  ] as const;

  return (
    <section className={baseClass} role="region" aria-label="Your xTDH status">
      <div className="tw-flex tw-h-full tw-flex-col">
        <div className="tw-flex-1 tw-space-y-6">
          <div className={SECTION_HEADER_CLASS}>
            {title}
            <p className="tw-mt-1 tw-text-sm tw-text-iron-300">
              Daily Fluid xTDH budget from your Base TDH and multiplier.
            </p>
          </div>
          <CapacityProgressCard
            title="Your Daily xTDH Capacity"
            total={capacity}
            allocated={allocated}
            reserved={autoAccruing}
            allocatedLabel="Allocated"
            reservedLabel="Auto-accruing"
            percentLabel={formatPercentLabel(percentAllocated, "Allocated")}
            variant="user"
          />
          <StatsMetricsGrid metrics={metrics} />
        </div>
        <AllocateButton
          disabled={autoAccruing <= 0}
          tooltip="You have no available xTDH to allocate"
        />
      </div>
    </section>
  );
}

function AllocateButton({
  disabled,
  tooltip,
}: {
  readonly disabled: boolean;
  readonly tooltip?: string;
}) {
  const tooltipId = useId().replace(/:/g, "");
  return (
    <div className="tw-mt-6 tw-flex tw-justify-end">
      <button
        type="button"
        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-50 tw-transition hover:tw-bg-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
        disabled={disabled}
        data-tooltip-id={disabled && tooltip ? tooltipId : undefined}
        data-tooltip-place="top"
      >
        Allocate xTDH
      </button>
      {disabled && tooltip ? (
        <Tooltip id={tooltipId} style={INFO_TOOLTIP_STYLE}>
          {tooltip}
        </Tooltip>
      ) : null}
    </div>
  );
}
