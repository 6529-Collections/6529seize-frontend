import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";


export function useWaveById(waveId: string | null) {
  const {
    data: wave,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      }),
    enabled: !!waveId,
    staleTime: 60000,
    placeholderData: (prev) => prev,
  });

  return {
    wave,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  };
}
