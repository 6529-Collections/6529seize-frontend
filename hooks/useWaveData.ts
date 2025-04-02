import { useQuery } from "@tanstack/react-query";
import { ApiWave } from "../generated/models/ApiWave";
import { commonApiFetch } from "../services/api/common-api";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

interface UseWaveDataProps {
  waveId: string | null;
  refetchInterval?: number;
  onWaveNotFound?: () => void;
}


export const useWaveData = ({
  waveId,
  refetchInterval,
  onWaveNotFound = () => {},
}: UseWaveDataProps) => {
  return useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      }),

    staleTime: 60000,
    enabled: !!waveId,
    refetchInterval,
    retry: (failureCount, error) => {
      if ((error as any) === `Wave ${waveId} not found`) {
        onWaveNotFound();
        return false;
      }
      return failureCount < 3;
    },
    retryDelay(failureCount, error) {
      return failureCount * 1000;
    },
  });
};
