import { useQuery } from "@tanstack/react-query";
import { ApiWave } from "../generated/models/ApiWave";
import { commonApiFetch } from "../services/api/common-api";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";


export const useWaveData = (
  waveId: string | null,
  refetchInterval?: number
) => {
  return useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      }),
    staleTime: 60000,
    enabled: !!waveId,
    refetchInterval,
  });
};
