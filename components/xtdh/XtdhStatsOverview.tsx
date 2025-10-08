"use client";

import { useCallback, useId, type ReactNode } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";

import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useXtdhOverviewStats } from "@/hooks/useXtdhOverview";

interface XtdhStatsOverviewProps {
  readonly enabled?: boolean;
}

type UserSectionState =
  | { kind: "loading" }
  | { kind: "error"; message?: string }
  | { kind: "unauthenticated" }
  | { kind: "no_base_tdh" }
  | {
      kind: "ready";
      baseTdhRate: number;
      multiplier: number;
      allocatedRate: number;
      allocationsCount: number;
    };

interface NetworkStats {
  readonly multiplier: number;
  readonly totalCapacity: number;
  readonly allocatedCapacity: number;
  readonly availableCapacity: number;
  readonly percentAllocated: number;
  readonly activeAllocations: number;
  readonly grantors: number;
  readonly collections: number;
  readonly tokens: number;
}

const DEFAULT_NETWORK_MULTIPLIER = 0.1;
const DEFAULT_ACTIVE_ALLOCATIONS = 3_220;
const DEFAULT_TOTAL_CAPACITY = 3_140;
const DEFAULT_ALLOCATED_CAPACITY = 2_355;
const DEFAULT_GRANTORS = 14;
const DEFAULT_COLLECTIONS = 4;
const DEFAULT_TOKENS = 9;

const NEXT_MULTIPLIER_EVENT = {
  label: "Next increase in 30 days",
  value: 0.12,
};

const INFO_TOOLTIP_STYLE = {
  backgroundColor: "#111827",
  color: "#F9FAFB",
  padding: "8px 12px",
  borderRadius: "12px",
  maxWidth: "20rem",
  lineHeight: "1.4",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.45)",
};

const MULTIPLIER_MILESTONES = [
  "30% multiplier in 36 months",
  "100% multiplier in 120 months",
];

const SECTION_HEADER_CLASS =
  "tw-flex tw-min-h-[84px] tw-flex-col tw-justify-start tw-gap-1";

const DEFAULT_USER_STATE: UserSectionState = {
  kind: "ready",
  baseTdhRate: 1_500,
  multiplier: DEFAULT_NETWORK_MULTIPLIER,
  allocatedRate: 50,
  allocationsCount: 2,
};

export default function XtdhStatsOverview({
  enabled = true,
}: Readonly<XtdhStatsOverviewProps>) {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useXtdhOverviewStats(enabled);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (isLoading && !data) {
    return <XtdhStatsOverviewSkeleton />;
  }

  if (isError || !data) {
    const message = error instanceof Error ? error.message : undefined;
    return (
      <XtdhStatsOverviewError
        message={message ?? "Unable to load xTDH data"}
        onRetry={handleRetry}
      />
    );
  }

  const totalCapacity = data?.totalXtdhRate ?? DEFAULT_TOTAL_CAPACITY;
  const allocatedCapacity = clampToRange(
    data?.totalXtdhAllocated ?? DEFAULT_ALLOCATED_CAPACITY,
    0,
    totalCapacity
  );
  const availableCapacity = Math.max(totalCapacity - allocatedCapacity, 0);
  const percentAllocated = calculatePercentage(allocatedCapacity, totalCapacity);

  const networkStats: NetworkStats = {
    multiplier: DEFAULT_NETWORK_MULTIPLIER,
    totalCapacity,
    allocatedCapacity,
    availableCapacity,
    percentAllocated,
    activeAllocations: DEFAULT_ACTIVE_ALLOCATIONS,
    grantors: data?.totalGrantors ?? DEFAULT_GRANTORS,
    collections: data?.totalCollections ?? DEFAULT_COLLECTIONS,
    tokens: data?.totalTokens ?? DEFAULT_TOKENS,
  };

  return (
    <section
      className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-6 tw-text-iron-50 tw-shadow-md tw-shadow-black/30"
      role="region"
      aria-label="xTDH Overview"
    >
      {isFetching ? (
        <div className="tw-mb-2 tw-flex tw-justify-end">
          <span
            className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-300"
            aria-live="polite"
          >
            <span className="tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400 tw-animate-pulse" />
            Refreshing data…
          </span>
        </div>
      ) : null}
      <div className="tw-mt-6 tw-grid tw-items-start tw-gap-6 xl:tw-grid-cols-2">
        <NetworkStatsSection stats={networkStats} />
        <UserXtdhStatusSection state={DEFAULT_USER_STATE} onRetry={handleRetry} />
      </div>
    </section>
  );
}

function NetworkStatsSection({ stats }: { readonly stats: NetworkStats }) {
  const metrics: ReadonlyArray<NetworkMetric> = [
    {
      label: "Active Allocations",
      value: formatPlainNumber(stats.activeAllocations),
      tooltip:
        "Total number of individual xTDH allocations active in the ecosystem.",
    },
    {
      label: "Grantors",
      value: formatPlainNumber(stats.grantors),
      tooltip:
        "Unique identities allocating their Fluid TDH to collections.",
    },
    {
      label: "Collections",
      value: formatPlainNumber(stats.collections),
      tooltip: "NFT collections currently receiving xTDH allocations.",
    },
    {
      label: "Tokens",
      value: formatPlainNumber(stats.tokens),
      tooltip: "Individual tokens/NFTs receiving xTDH.",
    },
  ];

  return (
    <section
      className="tw-flex tw-h-full tw-flex-col tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-text-iron-50"
      role="region"
      aria-label="Network Stats"
    >
      <div className="tw-space-y-6">
        <div className={SECTION_HEADER_CLASS}>
          <h2 className="tw-m-0 tw-text-lg tw-font-semibold">Network Stats</h2>
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            Fluid xTDH capacity and allocations across the network.
          </p>
        </div>
        <CapacityProgressCard
          title="Total Daily xTDH Capacity"
          total={stats.totalCapacity}
          allocated={stats.allocatedCapacity}
          reserved={stats.availableCapacity}
          allocatedLabel="Allocated"
          reservedLabel="Available"
          percentLabel={formatPercentLabel(stats.percentAllocated, "Allocated")}
          variant="network"
        />
        <MultiplierHighlight multiplier={stats.multiplier} />
        <NetworkMetricsGrid metrics={metrics} />
      </div>
    </section>
  );
}

function MultiplierHighlight({ multiplier }: { readonly multiplier: number }) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-primary-500/30 tw-bg-primary-500/10 tw-p-4 tw-shadow-inner tw-shadow-primary-900/30">
      <div className="tw-flex tw-flex-col tw-gap-3">
        <div className="tw-flex tw-items-center tw-gap-2">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-200">
            Current Multiplier
          </p>
          <InfoTooltip
            ariaLabel="Explain the xTDH multiplier"
            tooltip={
              <div className="tw-space-y-2 tw-text-left">
                <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
                  Understanding the multiplier
                </p>
                <p className="tw-m-0 tw-text-xs tw-text-iron-200">
                  Fluid xTDH equals your Base TDH rate multiplied by the current
                  network multiplier.
                </p>
                <ul className="tw-m-0 tw-list-disc tw-space-y-1 tw-pl-4 tw-text-xs tw-text-iron-200">
                  <li>
                    Current: {formatMultiplierDisplay(multiplier)} (
                    {Math.round(multiplier * 100)}%)
                  </li>
                  <li>
                    {NEXT_MULTIPLIER_EVENT.label}:{" "}
                    {formatMultiplierDisplay(NEXT_MULTIPLIER_EVENT.value)}
                  </li>
                  <li>{MULTIPLIER_MILESTONES[0]}</li>
                  <li>{MULTIPLIER_MILESTONES[1]}</li>
                </ul>
                <p className="tw-m-0 tw-text-xs tw-text-iron-200">
                  Fluid xTDH auto-accrues unless you allocate it elsewhere.
                </p>
              </div>
            }
          />
        </div>
        <div>
          <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-primary-100">
            {formatMultiplierDisplay(multiplier)}
          </p>
          <p className="tw-m-0 tw-text-sm tw-text-primary-100">
            {Math.round(multiplier * 100)}% of Base TDH
          </p>
        </div>
      </div>
    </div>
  );
}

interface CapacityProgressCardProps {
  readonly title: string;
  readonly total: number;
  readonly allocated: number;
  readonly reserved: number;
  readonly allocatedLabel: string;
  readonly reservedLabel: string;
  readonly percentLabel: string;
  readonly variant: "network" | "user";
}

function CapacityProgressCard({
  title,
  total,
  allocated,
  reserved,
  allocatedLabel,
  reservedLabel,
  percentLabel,
  variant,
}: Readonly<CapacityProgressCardProps>) {
  const ariaLabel =
    variant === "network"
      ? "Total network xTDH capacity allocated"
      : "Your xTDH capacity allocated";
  return (
    <div className="tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950/60 tw-p-4 tw-space-y-4">
      <div className="tw-flex tw-flex-col tw-gap-1 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-300">
            {title}
          </p>
          <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
            {formatRateValue(total)}
            <span className="tw-text-base tw-font-medium tw-text-iron-300">
              {" "}
              /day
            </span>
          </p>
        </div>
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
          {percentLabel}
        </p>
      </div>
      <CapacityProgressBar
        value={allocated}
        total={total}
        variant={variant}
        ariaLabel={ariaLabel}
      />
      <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-sm tw-text-iron-200">
        <span>
          {allocatedLabel}: {formatRateValue(allocated)}/day
        </span>
        <span className="tw-text-iron-600">•</span>
        <span>
          {reservedLabel}: {formatRateValue(reserved)}/day
        </span>
      </p>
    </div>
  );
}

function CapacityProgressBar({
  value,
  total,
  variant,
  ariaLabel,
}: {
  readonly value: number;
  readonly total: number;
  readonly variant: "network" | "user";
  readonly ariaLabel: string;
}) {
  const percent = calculatePercentage(value, total);
  const containerClasses =
    variant === "user"
      ? "tw-relative tw-h-3 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-emerald-500/20 tw-ring-1 tw-ring-emerald-400/30"
      : "tw-relative tw-h-3 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-800";
  const progressClasses =
    variant === "user"
      ? "tw-absolute tw-left-0 tw-top-0 tw-h-full tw-bg-primary-400 tw-shadow-[0_4px_12px_rgba(14,165,233,0.35)]"
      : "tw-absolute tw-left-0 tw-top-0 tw-h-full tw-bg-primary-500 tw-shadow-[0_4px_12px_rgba(59,130,246,0.35)]";

  return (
    <div
      className={containerClasses}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div className={progressClasses} style={{ width: `${percent}%` }} />
    </div>
  );
}

interface NetworkMetric {
  readonly label: string;
  readonly value: string;
  readonly tooltip: ReactNode;
}

function NetworkMetricsGrid({
  metrics,
}: {
  readonly metrics: ReadonlyArray<NetworkMetric>;
}) {
  return (
    <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2">
      {metrics.map((metric) => (
        <MetricTile key={metric.label} metric={metric} />
      ))}
    </div>
  );
}

function MetricTile({ metric }: { readonly metric: NetworkMetric }) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-space-y-1">
      <div className="tw-flex tw-items-center tw-gap-2">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-300">
          {metric.label}
        </p>
        <InfoTooltip
          ariaLabel={`Learn more about ${metric.label}`}
          tooltip={<span className="tw-text-xs">{metric.tooltip}</span>}
        />
      </div>
      <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
        {metric.value}
      </p>
    </div>
  );
}

function UserXtdhStatusSection({
  state,
  onRetry,
}: {
  readonly state: UserSectionState;
  readonly onRetry?: () => void;
}) {
  if (state.kind === "loading") {
    return <UserStatusSkeleton />;
  }

  const baseClass =
    "tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-text-iron-50 tw-flex tw-h-full tw-flex-col";
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

  return (
    <section className={baseClass} role="region" aria-label="Your xTDH status">
      <div className="tw-space-y-6">
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
        <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2">
          <UserDetailCard
            label="Base TDH Rate"
            value={`${formatRateValue(state.baseTdhRate)}/day`}
            tooltip="Your daily Base TDH generation rate (from Memes + Gradients). Fluid xTDH is calculated from this."
          />
          <UserDetailCard
            label="Your Allocations"
            value={`${state.allocationsCount} ${
              state.allocationsCount === 1 ? "collection" : "collections"
            }`}
            tooltip="Number of collections you're currently allocating xTDH to."
          />
        </div>
      </div>
      <AllocateButton
        disabled={autoAccruing <= 0}
        tooltip="You have no available xTDH to allocate"
      />
    </section>
  );
}

function UserDetailCard({
  label,
  value,
  tooltip,
}: {
  readonly label: string;
  readonly value: string;
  readonly tooltip: string;
}) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-3">
      <div className="tw-flex tw-items-center tw-gap-2">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-300">
          {label}
        </p>
        <InfoTooltip
          ariaLabel={`Explain ${label}`}
          tooltip={<span className="tw-text-xs">{tooltip}</span>}
        />
      </div>
      <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
        {value}
      </p>
    </div>
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

function InfoTooltip({
  tooltip,
  ariaLabel = "More information",
}: {
  readonly tooltip: ReactNode;
  readonly ariaLabel?: string;
}) {
  const tooltipId = useId().replace(/:/g, "");
  return (
    <>
      <span
        className="tw-inline-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-text-iron-300 hover:tw-text-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
        data-tooltip-id={tooltipId}
        data-tooltip-place="top"
        data-tooltip-offset={10}
        data-tooltip-delay-show={150}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
      >
        <FontAwesomeIcon icon={faInfoCircle} className="tw-h-4 tw-w-4" />
      </span>
      <Tooltip id={tooltipId} style={INFO_TOOLTIP_STYLE}>
        {tooltip}
      </Tooltip>
    </>
  );
}

function XtdhStatsOverviewSkeleton() {
  return (
    <section className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-6 tw-shadow-md tw-shadow-black/30 tw-text-iron-50">
      <div className="tw-h-7 tw-w-40 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
      <div className="tw-mt-6 tw-grid tw-gap-6 xl:tw-grid-cols-[1.2fr_1fr]">
        <NetworkStatsSkeleton />
        <UserStatusSkeleton />
      </div>
    </section>
  );
}

function NetworkStatsSkeleton() {
  return (
    <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-space-y-5 tw-animate-pulse">
      <div className="tw-space-y-2">
        <div className="tw-h-5 tw-w-32 tw-rounded tw-bg-iron-800" />
        <div className="tw-h-3 tw-w-48 tw-rounded tw-bg-iron-800" />
      </div>
      <div className="tw-h-20 tw-rounded-xl tw-bg-primary-500/20" />
      <div className="tw-space-y-3">
        <div className="tw-h-3 tw-w-full tw-rounded-full tw-bg-iron-800" />
        <div className="tw-h-6 tw-w-full tw-rounded tw-bg-iron-800" />
      </div>
      <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="tw-space-y-2 tw-rounded-lg tw-bg-iron-950 tw-p-4"
          >
            <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-6 tw-w-24 tw-rounded tw-bg-iron-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

function UserStatusSkeleton() {
  return (
    <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-flex tw-flex-col tw-gap-4 tw-animate-pulse">
      <div className="tw-h-5 tw-w-32 tw-rounded tw-bg-iron-800" />
      <div className="tw-h-20 tw-rounded-xl tw-bg-iron-800" />
      <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2">
        <div className="tw-h-16 tw-rounded-lg tw-bg-iron-800" />
        <div className="tw-h-16 tw-rounded-lg tw-bg-iron-800" />
      </div>
      <div className="tw-ml-auto tw-h-10 tw-w-32 tw-rounded-lg tw-bg-iron-800" />
    </div>
  );
}

function XtdhStatsOverviewError({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}) {
  return (
    <section className="tw-rounded-2xl tw-border tw-border-rose-500/40 tw-bg-rose-900/20 tw-p-6 tw-text-iron-50 tw-space-y-4">
      <div className="tw-space-y-1">
        <h2 className="tw-m-0 tw-text-lg tw-font-semibold">
          Unable to load xTDH data
        </h2>
        <p className="tw-m-0 tw-text-sm tw-text-iron-200">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-50 tw-transition hover:tw-bg-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
      >
        Retry
      </button>
    </section>
  );
}

function clampToRange(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  if (max <= min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function calculatePercentage(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  const ratio = (value / total) * 100;
  return Math.min(Math.max(ratio, 0), 100);
}

function formatPercentLabel(value: number, suffix: string): string {
  const rounded = Number.isFinite(value) ? Math.round(value) : 0;
  return `${rounded}% ${suffix}`;
}

function formatRateValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return formatNumberWithCommas(Math.max(0, Math.round(value)));
}

function formatPlainNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return formatNumberWithCommas(Math.max(0, Math.round(value)));
}

function formatMultiplierDisplay(multiplier: number): string {
  if (!Number.isFinite(multiplier)) {
    return "0.00× Base TDH";
  }
  return `${multiplier.toFixed(2)}× Base TDH`;
}
