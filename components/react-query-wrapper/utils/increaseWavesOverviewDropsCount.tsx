import { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "../ReactQueryWrapper";
import { WAVE_FOLLOWING_WAVES_PARAMS } from "./query-utils";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWavesOverviewType } from "../../../generated/models/ApiWavesOverviewType";

type WavesOverviewQueryData = {
  pages?: ApiWave[][];
};

export const increaseWavesOverviewDropsCount = async (
  queryClient: QueryClient,
  waveId: string
) => {
  for (const type of Object.values(ApiWavesOverviewType)) {
    const queryKey = [
      QueryKey.WAVES_OVERVIEW,
      {
        limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
        type,
        only_waves_followed_by_authenticated_user:
          WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user,
      },
    ];

    await queryClient.cancelQueries({ queryKey });

    queryClient.setQueryData<WavesOverviewQueryData | undefined>(
      queryKey,
      (
        oldData: WavesOverviewQueryData | undefined
      ): WavesOverviewQueryData | undefined => {
        if (!oldData?.pages || oldData.pages.length === 0) {
          return oldData;
        }

        const pages: ApiWave[][] = JSON.parse(JSON.stringify(oldData.pages));
        let matchingWave: ApiWave | undefined;
        let matchingWaveIndex: number = -1;
        let matchingWavePage: number = -1;

        for (let i = 0; i < pages.length; i++) {
          matchingWaveIndex = pages[i].findIndex((wave) => wave.id === waveId);
          if (matchingWaveIndex !== -1) {
            matchingWavePage = i;
            matchingWave = pages[i][matchingWaveIndex];
            break;
          }
        }

        if (!matchingWave) {
          return oldData;
        }

        const updatedMatchingWave = {
          ...matchingWave,
          metrics: {
            ...matchingWave.metrics,
            drops_count: matchingWave.metrics.drops_count + 1,
            your_drops_count: (matchingWave.metrics.your_drops_count ?? 0) + 1,
            latest_drop_timestamp: Date.now(),
            your_latest_drop_timestamp: Date.now(),
          },
        };

        let updatedPages = pages.flat();
        updatedPages = updatedPages.filter((wave) => wave.id !== waveId);

        switch (type) {
          case ApiWavesOverviewType.MostDropped:
            updatedPages.push(updatedMatchingWave);
            updatedPages.sort(
              (a, b) => b.metrics.drops_count - a.metrics.drops_count
            );
            break;
          case ApiWavesOverviewType.MostDroppedByYou:
            updatedPages.push(updatedMatchingWave);
            updatedPages.sort(
              (a, b) =>
                (b.metrics.your_drops_count ?? 0) -
                (a.metrics.your_drops_count ?? 0)
            );
            break;
          case ApiWavesOverviewType.RecentlyDroppedTo:
          case ApiWavesOverviewType.RecentlyDroppedToByYou:
            updatedPages.unshift(updatedMatchingWave);
            break;
          default:
            updatedPages.splice(
              matchingWaveIndex +
                matchingWavePage * WAVE_FOLLOWING_WAVES_PARAMS.limit,
              0,
              updatedMatchingWave
            );
        }

        const newPages: ApiWave[][] = [];
        for (
          let i = 0;
          i < updatedPages.length;
          i += WAVE_FOLLOWING_WAVES_PARAMS.limit
        ) {
          newPages.push(
            updatedPages.slice(i, i + WAVE_FOLLOWING_WAVES_PARAMS.limit)
          );
        }

        return { ...oldData, pages: newPages };
      },
      {
        updatedAt: Date.now(),
      }
    );
  }
};
