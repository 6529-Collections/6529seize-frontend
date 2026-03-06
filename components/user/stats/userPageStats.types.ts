import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";

export type UserPageStatsInitialData = {
  readonly initialActiveAddress: string | null;
  readonly initialSeasons: MemeSeason[];
  readonly initialTdh?: ConsolidatedTDH | TDH | undefined;
  readonly initialOwnerBalance?: OwnerBalance | undefined;
  readonly initialBalanceMemes: OwnerBalanceMemes[];
};

export const EMPTY_USER_PAGE_STATS_INITIAL_DATA: UserPageStatsInitialData = {
  initialActiveAddress: null,
  initialSeasons: [],
  initialTdh: undefined,
  initialOwnerBalance: undefined,
  initialBalanceMemes: [],
};
