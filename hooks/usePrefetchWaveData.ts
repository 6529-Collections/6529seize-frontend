import { useQueryClient } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiWave } from "@/generated/models/ApiWave";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
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

  };

  return prefetchWaveData;
};
