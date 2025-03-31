import { useQueryClient } from "@tanstack/react-query";
import { WAVE_DROPS_PARAMS } from "../components/react-query-wrapper/utils/query-utils";
import { commonApiFetch } from "../services/api/common-api";
import { ApiWave } from "../generated/models/ApiWave";
import { ApiWaveDropsFeed } from "../generated/models/ApiWaveDropsFeed";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
export const usePrefetchWaveData = () => {
  const queryClient = useQueryClient();

  const prefetchWaveData = (waveId: string) => {
    queryClient.prefetchQuery({
      queryKey: [QueryKey.WAVE, { wave_id: waveId }],
      queryFn: async () =>
        await commonApiFetch<ApiWave>({
          endpoint: `waves/${waveId}`,
        }),
      staleTime: 60000,
    });

    queryClient.prefetchInfiniteQuery({
      queryKey: [
        QueryKey.DROPS,
        {
          waveId: waveId,
          limit: WAVE_DROPS_PARAMS.limit,
          dropId: null,
        },
      ],
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          limit: WAVE_DROPS_PARAMS.limit.toString(),
        };

        if (pageParam) {
          params.serial_no_less_than = `${pageParam}`;
        }
        return await commonApiFetch<ApiWaveDropsFeed>({
          endpoint: `waves/${waveId}/drops`,
          params,
        });
      },
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.drops.at(-1)?.serial_no ?? null,
      pages: 1,
      staleTime: 60000,
    });
  };

  return prefetchWaveData;
};
