import type {
  XtdhMultiplierMilestone,
  XtdhOverviewStats,
  XtdhStatsResponse,
} from "@/types/xtdh";

import type { GrowthPathMetric, NetworkStats, UserSectionState } from "./types";
import {
  calculatePercentage,
  clampToRange,
  parseTimeframeToMonths,
} from "./utils";

export function buildNetworkStats(
  data: XtdhOverviewStats
): NetworkStats | null {
  const { network, multiplier, lastUpdatedAt } = data;

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
  const sanitizedLastUpdatedAt =
    typeof lastUpdatedAt === "string" && isParsableDate(lastUpdatedAt)
      ? lastUpdatedAt
      : null;

  return {
    multiplier: {
      current: multiplier.current,
      nextValue: multiplier.nextValue,
      nextIncreaseDate: multiplier.nextIncreaseDate,
      milestones: multiplier.milestones,
    },
    lastUpdatedAt: sanitizedLastUpdatedAt,
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

export function buildLongTermScheduleMetrics(
  milestones: ReadonlyArray<XtdhMultiplierMilestone>
): GrowthPathMetric[] {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return [];
  }

  const baseMetrics = milestones.map((milestone, index) => {
    const percent = Number.isFinite(milestone.percentage)
      ? `${milestone.percentage}%`
      : "-";
    const timeframe = milestone.timeframe || "TBD";
    const value =
      percent !== "-" && !percent.startsWith("-") ? `+${percent}` : percent;

    return {
      label: `Milestone ${index + 1}`,
      value,
      helperText: `≈ ${timeframe}`,
      tooltip: `Projected network multiplier reaching ${percent} in roughly ${timeframe}.`,
      monthsEstimate: parseTimeframeToMonths(timeframe),
      positionPercent: 0,
    };
  });

  const validMonths = baseMetrics
    .map((metric) => metric.monthsEstimate)
    .filter(
      (months): months is number =>
        Number.isFinite(months) && (months as number) >= 0
    );

  const maxMonths = validMonths.length > 0 ? Math.max(...validMonths) : 0;
  const minPosition = 5;
  const count = baseMetrics.length;

  const fallbackPosition = (index: number): number => {
    if (count <= 1) {
      return 100;
    }
    const ratio = index / (count - 1);
    return clampToRange(ratio * 100, minPosition, 100);
  };

  return baseMetrics.map((metric, index) => {
    const months = metric.monthsEstimate;
    if (!Number.isFinite(months) || months < 0 || maxMonths <= 0) {
      return {
        ...metric,
        positionPercent: fallbackPosition(index),
      };
    }

    const raw = (months / maxMonths) * 100;
    const isMax = Math.abs(months - maxMonths) < 0.0001;
    const position = isMax
      ? 100
      : clampToRange(raw, minPosition, 100);

    return {
      ...metric,
      positionPercent: position,
    };
  });
}

export function buildUserSectionState({
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

function isParsableDate(value: string): boolean {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}
