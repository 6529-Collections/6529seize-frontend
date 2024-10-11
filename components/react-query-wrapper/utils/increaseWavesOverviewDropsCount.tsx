import { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "../ReactQueryWrapper";
import { WAVE_FOLLOWING_WAVES_PARAMS } from "./query-utils";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWavesOverviewType } from "../../../generated/models/ApiWavesOverviewType";

type WavesOverviewQueryData = {
  pages?: ApiWave[][];
};

export const increaseWavesOverviewDropsCount = (
  queryClient: QueryClient,
  waveId: string
) => {
  const queryKey = [
    QueryKey.WAVES_OVERVIEW,
    {
      limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
      type: ApiWavesOverviewType.RecentlyDroppedTo,
      only_waves_followed_by_authenticated_user:
        WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user,
    },
  ];

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
          latest_drop_timestamp: Date.now(),
        },
      };

      const updatedPages = pages.map((page, pageIndex) => {
        if (pageIndex === matchingWavePage) {
          return page.filter((_, index) => index !== matchingWaveIndex);
        }
        return page;
      });

      for (let i = updatedPages.length - 1; i > 0; i--) {
        const lastItem = updatedPages[i - 1].pop();
        if (lastItem) {
          updatedPages[i].unshift(lastItem);
        }
      }

      updatedPages[0].unshift(updatedMatchingWave);

      return { ...oldData, pages: updatedPages };
    }
  );
};
