"use client";

import { useCallback, useContext, useMemo } from "react";

import { AuthContext } from "@/components/auth/Auth";
import { useXtdhOverviewStats } from "@/hooks/useXtdhOverview";
import { useXtdhStats } from "@/hooks/useXtdhStats";
import type { XtdhOverviewStats, XtdhStatsResponse } from "@/types/xtdh";

import { deriveProfileIdentifier } from "./profile-utils";
import { XtdhStatsOverviewSkeleton } from "./stats-overview/Skeletons";
import { XtdhStatsOverviewError } from "./stats-overview/ErrorState";
import { NetworkStatsSection } from "./stats-overview/NetworkStatsSection";
import { UserXtdhStatusSection } from "./stats-overview/UserXtdhStatusSection";
import { CurrentMultiplierCard } from "./stats-overview/CurrentMultiplierCard";
import type { NetworkStats, UserSectionState } from "./stats-overview/types";
import { calculatePercentage, clampToRange } from "./stats-overview/utils";

interface XtdhStatsOverviewProps {
  readonly enabled?: boolean;
}

export default function XtdhStatsOverview({
  enabled = true,
}: Readonly<XtdhStatsOverviewProps>) {
  const { connectedProfile } = useContext(AuthContext);
  const profileKey = useMemo(
    () => deriveProfileIdentifier(connectedProfile),
    [connectedProfile]
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching: isNetworkFetching,
  } = useXtdhOverviewStats(enabled);

  const {
    data: userData,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
    refetch: refetchUserStats,
    isFetching: isUserFetching,
  } = useXtdhStats({ profile: profileKey, enabled });

  const handleRetry = useCallback(() => {
    void refetch();
    if (profileKey) {
      void refetchUserStats();
    }
  }, [profileKey, refetch, refetchUserStats]);

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

  const networkStats = buildNetworkStats(data);

  if (!networkStats) {
    return (
      <XtdhStatsOverviewError
        message="Unable to load xTDH data"
        onRetry={handleRetry}
      />
    );
  }

  const userState = buildUserSectionState({
    connectedProfile,
    profileKey,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
    data: userData,
  });

  const showRefreshing =
    isNetworkFetching || (profileKey !== null && isUserFetching);

  return (
    <section
      className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-6 tw-text-iron-50 tw-shadow-md tw-shadow-black/30"
      role="region"
      aria-label="xTDH Overview"
    >
      {showRefreshing ? (
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
        <UserXtdhStatusSection state={userState} onRetry={handleRetry} />
      </div>
      <div className="tw-mt-6">
        <CurrentMultiplierCard multiplier={networkStats.multiplier} />
      </div>
    </section>
  );
}

function buildNetworkStats(data: XtdhOverviewStats): NetworkStats | null {
  if (!isNonNegativeNumber(data.totalXtdhRate)) return null;
  if (!isNonNegativeNumber(data.totalXtdhAllocated)) return null;
  if (!isNonNegativeNumber(data.totalCollections)) return null;
  if (!isNonNegativeNumber(data.totalGrantors)) return null;
  if (!isNonNegativeNumber(data.totalTokens)) return null;
  if (!isNonNegativeNumber(data.totalActiveAllocations)) return null;
  if (!isNonNegativeNumber(data.totalBaseTdhRate)) return null;
  if (!isFiniteNumber(data.currentMultiplier)) return null;

  const totalCapacity = data.totalXtdhRate;
  const allocatedCapacity = clampToRange(
    data.totalXtdhAllocated,
    0,
    totalCapacity
  );
  const availableCapacity = Math.max(totalCapacity - allocatedCapacity, 0);
  const percentAllocated = calculatePercentage(allocatedCapacity, totalCapacity);

  return {
    multiplier: data.currentMultiplier,
    baseTdhRate: data.totalBaseTdhRate,
    totalCapacity,
    allocatedCapacity,
    availableCapacity,
    percentAllocated,
    activeAllocations: data.totalActiveAllocations,
    grantors: data.totalGrantors,
    collections: data.totalCollections,
    tokens: data.totalTokens,
  };
}

function buildUserSectionState({
  connectedProfile,
  profileKey,
  isLoading,
  isError,
  error,
  data,
}: {
  readonly connectedProfile: unknown;
  readonly profileKey: string | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly data: XtdhStatsResponse | undefined;
}): UserSectionState {
  if (!connectedProfile || !profileKey) {
    return { kind: "unauthenticated" };
  }

  if (isLoading && !data) {
    return { kind: "loading" };
  }

  if (isError || !data) {
    const message = error instanceof Error ? error.message : undefined;
    return { kind: "error", message };
  }

  if (!isNonNegativeNumber(data.baseTdhRate)) {
    return { kind: "error", message: "Invalid xTDH user data" };
  }

  if (!isFiniteNumber(data.multiplier) || data.multiplier < 0) {
    return { kind: "error", message: "Invalid xTDH user data" };
  }

  if (!isNonNegativeNumber(data.xtdhRateGranted)) {
    return { kind: "error", message: "Invalid xTDH user data" };
  }

  if (!isNonNegativeNumber(data.allocationsCount) || !Number.isInteger(data.allocationsCount)) {
    return { kind: "error", message: "Invalid xTDH user data" };
  }

  if (
    !isNonNegativeNumber(data.collectionsAllocatedCount) ||
    !Number.isInteger(data.collectionsAllocatedCount)
  ) {
    return { kind: "error", message: "Invalid xTDH user data" };
  }

  if (
    !isNonNegativeNumber(data.tokensAllocatedCount) ||
    !Number.isInteger(data.tokensAllocatedCount)
  ) {
    return { kind: "error", message: "Invalid xTDH user data" };
  }

  if (
    !isNonNegativeNumber(data.receivingCollectionsCount) ||
    !Number.isInteger(data.receivingCollectionsCount)
  ) {
    return { kind: "error", message: "Invalid xTDH user data" };
  }

  if (data.baseTdhRate <= 0) {
    return { kind: "no_base_tdh" };
  }

  return {
    kind: "ready",
    baseTdhRate: data.baseTdhRate,
    multiplier: data.multiplier,
    allocatedRate: data.xtdhRateGranted,
    allocationsCount: data.allocationsCount,
    collectionsAllocatedCount: data.collectionsAllocatedCount,
    tokensAllocatedCount: data.tokensAllocatedCount,
    receivingCollectionsCount: data.receivingCollectionsCount,
  };
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
