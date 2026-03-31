import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { ApiCollectedStats } from "@/generated/models/ApiCollectedStats";

export type UserPageStatsInitialData = {
  readonly initialActiveAddress: string | null;
  readonly initialCollectedStats?: ApiCollectedStats | undefined;
  readonly initialSeasons: MemeSeason[];
  readonly initialTdh?: ConsolidatedTDH | TDH | undefined;
  readonly initialOwnerBalance?: OwnerBalance | undefined;
  readonly initialBalanceMemes: OwnerBalanceMemes[];
};

export const EMPTY_USER_PAGE_STATS_INITIAL_DATA: UserPageStatsInitialData = {
  initialActiveAddress: null,
  initialCollectedStats: undefined,
  initialSeasons: [],
  initialTdh: undefined,
  initialOwnerBalance: undefined,
  initialBalanceMemes: [],
};
