"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  WAVE_DROPS_PARAMS,
  getDefaultQueryRetry,
} from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDropsLeaderboardPage } from "@/generated/models/ApiDropsLeaderboardPage";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { commonApiFetch } from "@/services/api/common-api";
import { useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo } from "react";

interface WaveleaderboardSortProps {
  readonly sort: WaveDropsLeaderboardSort;
  readonly onSortChange: (sort: WaveDropsLeaderboardSort) => void;
  readonly waveId?: string | undefined;
  readonly curatedByGroupId?: string | undefined;
}

const SORT_DIRECTION_MAP: Record<
  WaveDropsLeaderboardSort,
  "ASC" | "DESC" | undefined
> = {
  [WaveDropsLeaderboardSort.RANK]: undefined,
  [WaveDropsLeaderboardSort.RATING_PREDICTION]: "DESC",
  [WaveDropsLeaderboardSort.TREND]: "DESC",
  [WaveDropsLeaderboardSort.MY_REALTIME_VOTE]: undefined,
  [WaveDropsLeaderboardSort.CREATED_AT]: "DESC",
};

export const WaveleaderboardSort: React.FC<WaveleaderboardSortProps> = ({
  sort,
  onSortChange,
  waveId,
  curatedByGroupId,
}) => {
  const queryClient = useQueryClient();
  const normalizedCuratedByGroupId = curatedByGroupId?.trim() ?? undefined;

  const prefetchSortImmediate = useCallback(
    (targetSort: WaveDropsLeaderboardSort) => {
      if (!waveId || targetSort === sort) return;

      const sortDirection = SORT_DIRECTION_MAP[targetSort];
      const queryKey = [
        QueryKey.DROPS_LEADERBOARD,
        {
          waveId,
          page_size: WAVE_DROPS_PARAMS.limit,
          sort: targetSort,
          sort_direction: sortDirection,
          curated_by_group: normalizedCuratedByGroupId ?? null,
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
              params["sort_direction"] = sortDirection;
            }

            if (typeof pageParam === "number") {
              params["page"] = `${pageParam}`;
            }

            if (normalizedCuratedByGroupId) {
              params["curated_by_group"] = normalizedCuratedByGroupId;
            }

            return await commonApiFetch<ApiDropsLeaderboardPage>({
              endpoint: `waves/${waveId}/leaderboard`,
              params,
            });
          },
          pages: 1,
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
          staleTime: 60000,
          ...getDefaultQueryRetry(),
        })
        .catch((error: unknown) => {
          // Log prefetch errors for debugging while not blocking the UI
          console.warn("Failed to prefetch leaderboard data:", {
            waveId,
            targetSort,
            error: error instanceof Error ? error.message : error,
          });
        });
    },
    [queryClient, waveId, sort, normalizedCuratedByGroupId]
  );

  // Debounce prefetch to prevent excessive network requests on rapid hover events
  const prefetchSort = useMemo(
    () => debounce(prefetchSortImmediate, 300),
    [prefetchSortImmediate]
  );

  // Cancel pending debounced calls on unmount to avoid late network requests
  useEffect(() => {
    return () => prefetchSort.cancel();
  }, [prefetchSort]);

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
      className="tw-flex tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-1"
    >
      <button
        className={getButtonClassName(WaveDropsLeaderboardSort.RANK)}
        onClick={() => onSortChange(WaveDropsLeaderboardSort.RANK)}
        onMouseEnter={() => prefetchSort(WaveDropsLeaderboardSort.RANK)}
      >
        Current Vote
      </button>
      <button
        className={getButtonClassName(
          WaveDropsLeaderboardSort.RATING_PREDICTION
        )}
        onClick={() => onSortChange(WaveDropsLeaderboardSort.RATING_PREDICTION)}
        onMouseEnter={() =>
          prefetchSort(WaveDropsLeaderboardSort.RATING_PREDICTION)
        }
      >
        Projected Vote
      </button>
      <button
        className={getButtonClassName(WaveDropsLeaderboardSort.TREND)}
        onClick={() => onSortChange(WaveDropsLeaderboardSort.TREND)}
        onMouseEnter={() => prefetchSort(WaveDropsLeaderboardSort.TREND)}
      >
        Hot
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
