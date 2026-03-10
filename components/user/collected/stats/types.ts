import type { UserPageStatsInitialData } from "@/components/user/stats/userPageStats.types";
import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { ApiCollectedStats } from "@/generated/models/ApiCollectedStats";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";

export type CollectedHeaderMetric = {
  readonly id: string;
  readonly label: string;
  readonly val: string;
  readonly sub?: string;
};

export type DisplaySeason = {
  readonly id: string;
  readonly label: string;
  readonly totalCards: number;
  readonly setsHeld: number;
  readonly nextSetCards: number;
  readonly totalCardsHeld: number;
  readonly isStarted: boolean;
  readonly isRestingComplete: boolean;
  readonly progressPct: number;
  readonly detailText: string | null;
};

export type CollectedStatsViewModel = {
  readonly mainMetrics: CollectedHeaderMetric[];
  readonly allSeasons: DisplaySeason[];
  readonly startedSeasons: DisplaySeason[];
  readonly notStartedSeasons: DisplaySeason[];
};

export interface UseCollectedStatsDataArgs {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly initialStatsData: UserPageStatsInitialData;
  readonly isDetailsOpen: boolean;
}

export interface UseCollectedStatsDataResult {
  readonly statsPath: string | null;
  readonly collectedStats: ApiCollectedStats | undefined;
  readonly seasons: MemeSeason[];
  readonly tdh: ConsolidatedTDH | TDH | undefined;
  readonly ownerBalance: OwnerBalance | undefined;
  readonly balanceMemes: OwnerBalanceMemes[];
}
