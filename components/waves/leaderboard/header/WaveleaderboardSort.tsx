"use client"

import React, { useCallback, useMemo } from "react";
import { debounce } from "lodash";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { useQueryClient } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiDropsLeaderboardPage } from "@/generated/models/ApiDropsLeaderboardPage";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WAVE_DROPS_PARAMS, getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";

interface WaveleaderboardSortProps {
  readonly sort: WaveDropsLeaderboardSort;
  readonly onSortChange: (sort: WaveDropsLeaderboardSort) => void;
  readonly waveId?: string;
}

const SORT_DIRECTION_MAP: Record<WaveDropsLeaderboardSort, string | undefined> = {
  [WaveDropsLeaderboardSort.RANK]: undefined,
  [WaveDropsLeaderboardSort.RATING_PREDICTION]: "DESC",
  [WaveDropsLeaderboardSort.MY_REALTIME_VOTE]: undefined,
  [WaveDropsLeaderboardSort.CREATED_AT]: "DESC",
};

export const WaveleaderboardSort: React.FC<WaveleaderboardSortProps> = ({
  sort,
  onSortChange,
  waveId,
}) => {
  const queryClient = useQueryClient();
  
  const prefetchSortImmediate = useCallback((targetSort: WaveDropsLeaderboardSort) => {
    if (!waveId || targetSort === sort) return;
    
    const sortDirection = SORT_DIRECTION_MAP[targetSort];
    const queryKey = [
      QueryKey.DROPS_LEADERBOARD,
      {
        waveId,
        page_size: WAVE_DROPS_PARAMS.limit,
        sort: targetSort,
        sort_direction: sortDirection,
      },
    ];
    
    queryClient
      .prefetchInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam }: { pageParam: number | null }) => {
          const params: Record<string, string> = {
            page_size: WAVE_DROPS_PARAMS.limit.toString(),
            sort: targetSort,
          };

          if (sortDirection) {
            params.sort_direction = sortDirection;
          }

          if (pageParam) {
            params.page = `${pageParam}`;
          }

          return await commonApiFetch<ApiDropsLeaderboardPage>({
            endpoint: `waves/${waveId}/leaderboard`,
            params,
          });
        },
        initialPageParam: null,
        getNextPageParam: (lastPage: ApiDropsLeaderboardPage) => {
          if (targetSort === WaveDropsLeaderboardSort.MY_REALTIME_VOTE) {
            const haveZeroVotes = lastPage.drops.some(
              (drop) => drop.context_profile_context?.rating === 0
            );
            if (haveZeroVotes) {
              return null;
            }
          }
          return lastPage.next ? lastPage.page + 1 : null;
        },
        pages: 1,
        staleTime: 60000,
        ...getDefaultQueryRetry(),
      })
      .catch((error) => {
        // Log prefetch errors for debugging while not blocking the UI
        console.warn('Failed to prefetch leaderboard data:', {
          waveId,
          targetSort,
          error: error.message || error
        });
      });
  }, [queryClient, waveId, sort]);

  // Debounce prefetch to prevent excessive network requests on rapid hover events
  const prefetchSort = useMemo(
    () => debounce(prefetchSortImmediate, 300),
    [prefetchSortImmediate]
  );
  
  const getButtonClassName = (buttonSort: WaveDropsLeaderboardSort) => {
    const baseClass =
      "tw-px-4 tw-py-1.5 tw-text-xs tw-font-medium tw-border-0 tw-rounded-md tw-transition-colors";

    if (sort === buttonSort) {
      return `${baseClass} tw-bg-white/10 tw-text-white tw-shadow-sm`;
    }

    return `${baseClass} tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-text-iron-300`;
  };

  return (
    <div
      id="tabsId"
      className="tw-flex tw-bg-iron-950 tw-p-1 tw-rounded-lg tw-border tw-border-solid tw-border-white/10"
    >
      <button
        className={getButtonClassName(WaveDropsLeaderboardSort.RANK)}
        onClick={() => onSortChange(WaveDropsLeaderboardSort.RANK)}
        onMouseEnter={() => prefetchSort(WaveDropsLeaderboardSort.RANK)}
      >
        Current Vote
      </button>
      <button
        className={getButtonClassName(WaveDropsLeaderboardSort.RATING_PREDICTION)}
        onClick={() => onSortChange(WaveDropsLeaderboardSort.RATING_PREDICTION)}
        onMouseEnter={() => prefetchSort(WaveDropsLeaderboardSort.RATING_PREDICTION)}
      >
        Projected Vote
      </button>
      <button
        className={getButtonClassName(WaveDropsLeaderboardSort.CREATED_AT)}
        onClick={() => onSortChange(WaveDropsLeaderboardSort.CREATED_AT)}
        onMouseEnter={() => prefetchSort(WaveDropsLeaderboardSort.CREATED_AT)}
      >
        Newest
      </button>
    </div>
  );
};
