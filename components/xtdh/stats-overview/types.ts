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
    };

export interface NetworkStats {
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

export interface NetworkMetric {
  readonly label: string;
  readonly value: string;
  readonly tooltip: ReactNode;
}

export type CapacityProgressVariant = "network" | "user";
