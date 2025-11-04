import type { XtdhOverviewStats } from "@/types/xtdh";

import type {
  MultiplierCycleProgress,
  NetworkStats,
} from "./types";
import { calculatePercentage, clampToRange, parseCountdownToDays } from "./utils";

const MIN_CYCLE_DAYS = 30;
const DEFAULT_ELAPSED_BUFFER_DAYS = 20;

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
  const cycleProgress = buildMultiplierCycleProgress(
    multiplier.nextIncreaseDate
  );
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
      cycleProgress,
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

export function buildMultiplierCycleProgress(
  nextIncreaseDate: string
): MultiplierCycleProgress | null {
  if (typeof nextIncreaseDate !== "string") {
    return null;
  }

  const countdownDays = parseCountdownToDays(nextIncreaseDate);
  if (countdownDays === null) {
    return null;
  }

  const totalDays = Math.max(
    Math.round(countdownDays + DEFAULT_ELAPSED_BUFFER_DAYS),
    MIN_CYCLE_DAYS
  );
  const remainingDays = clampToRange(countdownDays, 0, totalDays);
  const elapsedDays = clampToRange(totalDays - remainingDays, 0, totalDays);
  const percentComplete =
    totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

  return {
    totalDays,
    elapsedDays,
    remainingDays,
    percentComplete,
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
