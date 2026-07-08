import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

export const usePrefetchWaveData = () => {
  const queryClient = useQueryClient();

  const prefetchWaveData = useCallback(
    (waveId: string) => {
      void queryClient.prefetchQuery({
        queryKey: [QueryKey.WAVE, { wave_id: waveId }],
        queryFn: async () =>
          await commonApiFetch<ApiWave>({
            endpoint: `waves/${waveId}`,
          }),
        staleTime: 60000,
      });
    },
    [queryClient]
  );

  return prefetchWaveData;
};
