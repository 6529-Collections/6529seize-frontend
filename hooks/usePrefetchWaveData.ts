import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

export const usePrefetchWaveData = () => {
  const queryClient = useQueryClient();

  const prefetchWaveData = useCallback(
    (waveId: string) => {
      return (async () => {
        try {
          await queryClient.prefetchQuery({
            queryKey: [QueryKey.WAVE, { wave_id: waveId }],
            queryFn: async ({ signal }) =>
              await commonApiFetch<ApiWave>({
                endpoint: `waves/${waveId}`,
                signal,
                errorMode: "structured",
              }),
            staleTime: 60000,
          });
        } catch {
          // Notification prefetching is best effort; reply can still fetch on demand.
        }
      })();
    },
    [queryClient]
  );

  return prefetchWaveData;
};
