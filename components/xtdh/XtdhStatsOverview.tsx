"use client";

import { useCallback } from "react";

import { useXtdhOverviewStats } from "@/hooks/useXtdhOverview";

import {
  DEFAULT_ACTIVE_ALLOCATIONS,
  DEFAULT_ALLOCATED_CAPACITY,
  DEFAULT_COLLECTIONS,
  DEFAULT_GRANTORS,
  DEFAULT_NETWORK_MULTIPLIER,
  DEFAULT_TOTAL_CAPACITY,
  DEFAULT_TOKENS,
  DEFAULT_USER_STATE,
} from "./stats-overview/constants";
import { XtdhStatsOverviewSkeleton } from "./stats-overview/Skeletons";
import { XtdhStatsOverviewError } from "./stats-overview/ErrorState";
import { NetworkStatsSection } from "./stats-overview/NetworkStatsSection";
import { UserXtdhStatusSection } from "./stats-overview/UserXtdhStatusSection";
import type { NetworkStats } from "./stats-overview/types";
import { calculatePercentage, clampToRange } from "./stats-overview/utils";

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
