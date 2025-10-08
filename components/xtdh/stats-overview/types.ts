import type { ReactNode } from "react";

export type UserSectionState =
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
      collectionsAllocatedCount: number;
      tokensAllocatedCount: number;
      receivingCollectionsCount: number;
    };

export interface NetworkStats {
  readonly multiplier: number;
  readonly baseTdhRate: number;
  readonly totalCapacity: number;
  readonly allocatedCapacity: number;
  readonly availableCapacity: number;
  readonly percentAllocated: number;
  readonly activeAllocations: number;
  readonly grantors: number;
  readonly collections: number;
  readonly tokens: number;
}

export interface StatsMetric {
  readonly label: string;
  readonly tooltip: ReactNode;
  readonly value: string;
  readonly valueSuffix?: string;
}

export type CapacityProgressVariant = "network" | "user";
