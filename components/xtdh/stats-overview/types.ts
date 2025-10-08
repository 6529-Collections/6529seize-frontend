import type { ReactNode } from "react";
import type { XtdhMultiplierMilestone } from "@/types/xtdh";

export type UserSectionState =
  | { kind: "loading" }
  | { kind: "error"; message?: string }
  | { kind: "unauthenticated" }
  | { kind: "no_base_tdh" }
  | {
      kind: "ready";
      baseTdhRate: number;
      multiplier: number;
      dailyCapacity: number;
      allocatedDaily: number;
      autoAccruingDaily: number;
      allocationsCount: number;
      collectionsAllocatedCount: number;
      tokensAllocatedCount: number;
      totalXtdhReceived: number;
      totalXtdhGranted: number;
    };

export interface NetworkStats {
  readonly multiplier: {
    readonly current: number;
    readonly nextValue: number;
    readonly nextIncreaseDate: string;
    readonly milestones: readonly XtdhMultiplierMilestone[];
  };
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
}

export type CapacityProgressVariant = "network" | "user";
