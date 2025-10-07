"use client";

import { useCallback } from "react";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useXtdhOverviewStats } from "@/hooks/useXtdhOverview";

interface XtdhStatsOverviewProps {
  readonly enabled?: boolean;
}

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
        message={message ?? "Unable to load xTDH overview statistics."}
        onRetry={handleRetry}
      />
    );
  }

  const {
    totalCollections,
    totalGrantors,
    totalTokens,
    totalXtdhAllocated,
    totalXtdhRate,
    lastUpdatedAt,
  } = data;

  const formattedUpdatedAt = new Date(lastUpdatedAt).toLocaleString(undefined, {
    hour: "numeric",
    minute: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <section
      className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-text-iron-50 tw-shadow-md tw-shadow-black/30"
      role="region"
      aria-label="xTDH Ecosystem Overview"
    >
      <div className="tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-justify-between lg:tw-items-start">
        <div>
          <h1 className="tw-text-xl tw-font-semibold tw-m-0">xTDH Ecosystem</h1>
          <p className="tw-text-sm tw-text-iron-300 tw-mt-1 tw-mb-0">
            Track active allocations across all supported NFT collections.
          </p>
        </div>
        <div className="tw-text-right">
          <p className="tw-text-xs tw-uppercase tw-text-iron-400 tw-mb-1">
            Last updated
          </p>
          <p className="tw-text-sm tw-font-semibold tw-text-iron-200 tw-m-0">
            {formattedUpdatedAt}
            {isFetching ? " · refreshing…" : ""}
          </p>
        </div>
      </div>
      <div className="tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3">
        <OverviewStat
          label="Daily xTDH Capacity"
          value={`${formatDisplay(totalXtdhRate)} /day`}
        />
        <OverviewStat
          label="Active Allocations"
          value={formatDisplay(totalXtdhAllocated)}
        />
        <OverviewStat
          label="Grantors"
          value={formatDisplay(totalGrantors)}
        />
        <OverviewStat
          label="Collections"
          value={formatDisplay(totalCollections)}
        />
        <OverviewStat label="Tokens Receiving" value={formatDisplay(totalTokens)} />
        <OverviewStat
          label="Coverage"
          value={`${coveragePercentage(totalTokens, totalCollections)}% collections touched`}
        />
      </div>
    </section>
  );
}

function coveragePercentage(tokens: number, collections: number): string {
  if (!collections) {
    return "0";
  }
  const ratio = (tokens / (collections * 10)) * 100;
  return (Math.min(Math.max(ratio, 0), 100) || 0).toFixed(1);
}

function formatDisplay(value: number): string {
  if (Number.isNaN(value)) return "-";
  return formatNumberWithCommas(Math.floor(value));
}

function OverviewStat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-border tw-border-iron-800 tw-space-y-2">
      <p className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-300 tw-m-0">
        {label}
      </p>
      <p className="tw-text-lg tw-font-semibold tw-text-iron-50 tw-m-0">
        {value}
      </p>
    </div>
  );
}

function XtdhStatsOverviewSkeleton() {
  return (
    <section className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-shadow-md tw-shadow-black/30 tw-animate-pulse">
      <div className="tw-h-6 tw-w-40 tw-bg-iron-700 tw-rounded" />
      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="tw-space-y-2">
            <div className="tw-h-3 tw-w-24 tw-bg-iron-700 tw-rounded" />
            <div className="tw-h-5 tw-w-32 tw-bg-iron-600 tw-rounded" />
          </div>
        ))}
      </div>
    </section>
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
    <section className="tw-rounded-2xl tw-border tw-border-rose-500/40 tw-bg-rose-900/20 tw-p-5 tw-text-iron-50 tw-space-y-3">
      <div>
        <h2 className="tw-text-base tw-font-semibold tw-m-0">
          xTDH overview unavailable
        </h2>
        <p className="tw-text-sm tw-text-iron-200 tw-mt-1 tw-mb-0">{message}</p>
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
