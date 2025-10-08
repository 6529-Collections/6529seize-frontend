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
  const { network, multiplier } = data;

  if (!network) return null;
  if (!isNonNegativeNumber(network.totalDailyCapacity)) return null;
  if (!isNonNegativeNumber(network.totalAllocated)) return null;
  if (!isNonNegativeNumber(network.totalAvailable)) return null;
  if (!isNonNegativeNumber(network.collections)) return null;
  if (!isNonNegativeNumber(network.grantors)) return null;
  if (!isNonNegativeNumber(network.tokens)) return null;
  if (!isNonNegativeNumber(network.activeAllocations)) return null;
  if (!isNonNegativeNumber(network.baseTdhRate)) return null;
  if (!isNonNegativeNumber(network.totalXtdh)) return null;

  if (!multiplier) return null;
  if (!isFiniteNumber(multiplier.current) || multiplier.current < 0) return null;
  if (!isFiniteNumber(multiplier.nextValue) || multiplier.nextValue < 0) return null;
  if (typeof multiplier.nextIncreaseDate !== "string") return null;
  if (!Array.isArray(multiplier.milestones)) return null;

  const hasInvalidMilestone = multiplier.milestones.some(
    (milestone) =>
      typeof milestone !== "object" ||
      milestone === null ||
      !isFiniteNumber((milestone as { percentage?: unknown }).percentage) ||
      typeof (milestone as { timeframe?: unknown }).timeframe !== "string"
  );

  if (hasInvalidMilestone) {
    return null;
  }

  const totalCapacity = network.totalDailyCapacity;
  const allocatedCapacity = clampToRange(network.totalAllocated, 0, totalCapacity);
  const availableCapacity = clampToRange(network.totalAvailable, 0, totalCapacity);
  const percentAllocated = calculatePercentage(allocatedCapacity, totalCapacity);

  return {
    multiplier: {
      current: multiplier.current,
      nextValue: multiplier.nextValue,
      nextIncreaseDate: multiplier.nextIncreaseDate,
      milestones: multiplier.milestones,
    },
    baseTdhRate: network.baseTdhRate,
    totalCapacity,
    allocatedCapacity,
    availableCapacity,
    percentAllocated,
    activeAllocations: network.activeAllocations,
    grantors: network.grantors,
    collections: network.collections,
    tokens: network.tokens,
    totalXtdh: network.totalXtdh,
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

  if (!isNonNegativeNumber(data.dailyCapacity)) {
    return { kind: "error", message: "Invalid xTDH user data" };
  }

  if (!isNonNegativeNumber(data.xtdhRateGranted)) {
    return { kind: "error", message: "Invalid xTDH user data" };
  }

  if (!isNonNegativeNumber(data.xtdhRateAutoAccruing)) {
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

  if (!isNonNegativeNumber(data.totalXtdhReceived)) {
    return { kind: "error", message: "Invalid xTDH user data" };
  }

  if (!isNonNegativeNumber(data.totalXtdhGranted)) {
    return { kind: "error", message: "Invalid xTDH user data" };
  }

  const dailyCapacity = clampToRange(data.dailyCapacity, 0, Number.MAX_SAFE_INTEGER);
  const allocatedDaily = clampToRange(data.xtdhRateGranted, 0, dailyCapacity);
  const autoAccruingDaily = clampToRange(
    data.xtdhRateAutoAccruing,
    0,
    dailyCapacity
  );

  if (data.baseTdhRate <= 0) {
    return {
      kind: "no_base_tdh",
      baseTdhRate: data.baseTdhRate,
      multiplier: data.multiplier,
      dailyCapacity,
      allocatedDaily,
      autoAccruingDaily,
      allocationsCount: data.allocationsCount,
      collectionsAllocatedCount: data.collectionsAllocatedCount,
      tokensAllocatedCount: data.tokensAllocatedCount,
      totalXtdhReceived: data.totalXtdhReceived,
      totalXtdhGranted: data.totalXtdhGranted,
    };
  }

  return {
    kind: "ready",
    baseTdhRate: data.baseTdhRate,
    multiplier: data.multiplier,
    dailyCapacity,
    allocatedDaily,
    autoAccruingDaily,
    allocationsCount: data.allocationsCount,
    collectionsAllocatedCount: data.collectionsAllocatedCount,
    tokensAllocatedCount: data.tokensAllocatedCount,
    totalXtdhReceived: data.totalXtdhReceived,
    totalXtdhGranted: data.totalXtdhGranted,
  };
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
