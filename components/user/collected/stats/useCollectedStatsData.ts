import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { ApiCollectedStats } from "@/generated/models/ApiCollectedStats";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { STATS_QUERY_KEY } from "./constants";
import {
  getSafeCollectedStatsIdentityKey,
  getSafeStatsPath,
  isAbortError,
} from "./helpers";
import type {
  UseCollectedStatsDataArgs,
  UseCollectedStatsDataResult,
} from "./types";

type CollectedStatsFetchState = {
  readonly shouldFetchCollectedStats: boolean;
  readonly shouldFetchSeasons: boolean;
  readonly shouldFetchTdh: boolean;
  readonly shouldFetchOwnerBalance: boolean;
  readonly shouldFetchBalanceMemes: boolean;
};

type CollectedStatsTdh = ConsolidatedTDH | TDH | undefined;

const DETAILS_DATA_STALE_TIME = 60_000;

const fetchStatsQuery = async <T>({
  endpoint,
  fallback,
  signal,
}: {
  readonly endpoint: string | null;
  readonly fallback: T;
  readonly signal: AbortSignal;
}): Promise<T> => {
  if (endpoint === null) {
    return fallback;
  }

  try {
    return await commonApiFetch<T>({
      endpoint,
      signal,
    });
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }
    return fallback;
  }
};

const getCollectedStatsFetchState = ({
  activeAddress,
  collectedStatsIdentityKey,
  initialStatsData,
  isDetailsOpen,
  statsPath,
}: {
  readonly activeAddress: string | null;
  readonly collectedStatsIdentityKey: string | null;
  readonly initialStatsData: UseCollectedStatsDataArgs["initialStatsData"];
  readonly isDetailsOpen: boolean;
  readonly statsPath: string | null;
}): CollectedStatsFetchState => {
  const isInitialAddress =
    activeAddress === initialStatsData.initialActiveAddress;

  return {
    shouldFetchCollectedStats:
      collectedStatsIdentityKey !== null &&
      !(
        isInitialAddress && initialStatsData.initialCollectedStats !== undefined
      ),
    shouldFetchSeasons:
      isDetailsOpen &&
      statsPath !== null &&
      initialStatsData.initialSeasons.length === 0,
    shouldFetchTdh:
      isDetailsOpen &&
      statsPath !== null &&
      !(isInitialAddress && initialStatsData.initialTdh !== undefined),
    shouldFetchOwnerBalance:
      isDetailsOpen &&
      statsPath !== null &&
      !(isInitialAddress && initialStatsData.initialOwnerBalance !== undefined),
    shouldFetchBalanceMemes:
      isDetailsOpen &&
      statsPath !== null &&
      !(isInitialAddress && initialStatsData.initialBalanceMemes.length > 0),
  };
};

const buildCollectedStatsDataResult = ({
  balanceMemes,
  collectedStats,
  initialStatsData,
  ownerBalance,
  seasons,
  shouldFetchBalanceMemes,
  shouldFetchCollectedStats,
  shouldFetchOwnerBalance,
  shouldFetchSeasons,
  shouldFetchTdh,
  statsPath,
  tdh,
}: {
  readonly balanceMemes: OwnerBalanceMemes[] | undefined;
  readonly collectedStats: ApiCollectedStats | undefined;
  readonly initialStatsData: UseCollectedStatsDataArgs["initialStatsData"];
  readonly ownerBalance: OwnerBalance | undefined;
  readonly seasons: MemeSeason[] | undefined;
  readonly shouldFetchBalanceMemes: boolean;
  readonly shouldFetchCollectedStats: boolean;
  readonly shouldFetchOwnerBalance: boolean;
  readonly shouldFetchSeasons: boolean;
  readonly shouldFetchTdh: boolean;
  readonly statsPath: string | null;
  readonly tdh: CollectedStatsTdh;
}): UseCollectedStatsDataResult => ({
  statsPath,
  collectedStats: shouldFetchCollectedStats
    ? collectedStats
    : initialStatsData.initialCollectedStats,
  seasons: shouldFetchSeasons
    ? (seasons ?? [])
    : initialStatsData.initialSeasons,
  tdh: shouldFetchTdh ? tdh : initialStatsData.initialTdh,
  ownerBalance: shouldFetchOwnerBalance
    ? ownerBalance
    : initialStatsData.initialOwnerBalance,
  balanceMemes: shouldFetchBalanceMemes
    ? (balanceMemes ?? [])
    : initialStatsData.initialBalanceMemes,
});

export function useCollectedStatsData({
  profile,
  activeAddress,
  initialStatsData,
  isDetailsOpen,
}: Readonly<UseCollectedStatsDataArgs>): UseCollectedStatsDataResult {
  const statsPath = getSafeStatsPath(profile, activeAddress);
  const collectedStatsIdentityKey = getSafeCollectedStatsIdentityKey(
    profile,
    activeAddress
  );
  const {
    shouldFetchCollectedStats,
    shouldFetchSeasons,
    shouldFetchTdh,
    shouldFetchOwnerBalance,
    shouldFetchBalanceMemes,
  } = getCollectedStatsFetchState({
    activeAddress,
    collectedStatsIdentityKey,
    initialStatsData,
    isDetailsOpen,
    statsPath,
  });

  const { data: fetchedCollectedStats } = useQuery<
    ApiCollectedStats | undefined
  >({
    queryKey: [STATS_QUERY_KEY, "collected-stats", collectedStatsIdentityKey],
    enabled: shouldFetchCollectedStats,
    retry: false,
    queryFn: ({ signal }) =>
      fetchStatsQuery<ApiCollectedStats | undefined>({
        endpoint:
          collectedStatsIdentityKey === null
            ? null
            : `collected-stats/${encodeURIComponent(collectedStatsIdentityKey)}`,
        fallback: undefined,
        signal,
      }),
  });

  const { data: fetchedSeasons } = useQuery<MemeSeason[]>({
    queryKey: [STATS_QUERY_KEY, "seasons"],
    enabled: shouldFetchSeasons,
    retry: false,
    staleTime: Infinity,
    queryFn: ({ signal }) =>
      fetchStatsQuery<MemeSeason[]>({
        endpoint: "new_memes_seasons",
        fallback: [],
        signal,
      }),
  });

  const { data: fetchedTdh } = useQuery<CollectedStatsTdh>({
    queryKey: [STATS_QUERY_KEY, "tdh", statsPath],
    enabled: shouldFetchTdh,
    retry: false,
    staleTime: DETAILS_DATA_STALE_TIME,
    queryFn: ({ signal }) =>
      fetchStatsQuery<ConsolidatedTDH | TDH | undefined>({
        endpoint: statsPath === null ? null : `tdh/${statsPath}`,
        fallback: undefined,
        signal,
      }),
  });

  const { data: fetchedOwnerBalance } = useQuery<OwnerBalance | undefined>({
    queryKey: [STATS_QUERY_KEY, "owner-balance", statsPath],
    enabled: shouldFetchOwnerBalance,
    retry: false,
    staleTime: DETAILS_DATA_STALE_TIME,
    queryFn: ({ signal }) =>
      fetchStatsQuery<OwnerBalance | undefined>({
        endpoint: statsPath === null ? null : `owners-balances/${statsPath}`,
        fallback: undefined,
        signal,
      }),
  });

  const { data: fetchedBalanceMemes } = useQuery<OwnerBalanceMemes[]>({
    queryKey: [STATS_QUERY_KEY, "balance-memes", statsPath],
    enabled: shouldFetchBalanceMemes,
    retry: false,
    staleTime: DETAILS_DATA_STALE_TIME,
    queryFn: ({ signal }) =>
      fetchStatsQuery<OwnerBalanceMemes[]>({
        endpoint:
          statsPath === null ? null : `owners-balances/${statsPath}/memes`,
        fallback: [],
        signal,
      }),
  });

  return buildCollectedStatsDataResult({
    balanceMemes: fetchedBalanceMemes,
    collectedStats: fetchedCollectedStats,
    initialStatsData,
    ownerBalance: fetchedOwnerBalance,
    seasons: fetchedSeasons,
    shouldFetchBalanceMemes,
    shouldFetchCollectedStats,
    shouldFetchOwnerBalance,
    shouldFetchSeasons,
    shouldFetchTdh,
    statsPath,
    tdh: fetchedTdh,
  });
}
