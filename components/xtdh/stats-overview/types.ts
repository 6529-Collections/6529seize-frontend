import type { ReactNode } from "react";
import type { XtdhMultiplierMilestone } from "@/types/xtdh";

export interface UserStatsData {
  readonly baseTdhRate: number | null;
  readonly multiplier: number | null;
  readonly dailyCapacity: number;
  readonly allocatedDaily: number;
  readonly autoAccruingDaily: number;
  readonly allocationsCount: number | null;
  readonly collectionsAllocatedCount: number;
  readonly tokensAllocatedCount: number;
  readonly totalXtdhReceived: number;
  readonly totalXtdhGranted: number;
}

export type UserSectionState =
  | { kind: "loading" }
  | { kind: "error"; message?: string }
  | { kind: "unauthenticated" }
  | ({ kind: "no_base_tdh" } & UserStatsData)
  | ({ kind: "ready" } & UserStatsData);

export interface NetworkStats {
  readonly multiplier: {
    readonly current: number;
    readonly nextValue: number;
    readonly nextIncreaseDate: string;
    readonly milestones: readonly XtdhMultiplierMilestone[];
    readonly cycleProgress: MultiplierCycleProgress | null;
  };
  readonly lastUpdatedAt: string | null;
  readonly baseTdhRate: number;
  readonly totalCapacity: number;
  readonly allocatedCapacity: number;
  readonly availableCapacity: number;
  readonly percentAllocated: number;
  readonly activeAllocations: number;
  readonly grantors: number;
  readonly collections: number;
  readonly tokens: number;
  readonly totalXtdh: number;
}

export interface StatsMetric {
  readonly label: string;
  readonly tooltip: ReactNode;
  readonly value: string;
  readonly valueSuffix?: string;
  readonly helperText?: string;
  readonly tone?: "default" | "muted";
}

export interface MultiplierCycleProgress {
  readonly totalDays: number;
  readonly elapsedDays: number;
  readonly remainingDays: number;
  readonly percentComplete: number;
}

export type CapacityProgressVariant = "network" | "user";
