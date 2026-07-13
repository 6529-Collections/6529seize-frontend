import { useQuery } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { getWaveQueryKey } from "@/services/api/wave-query";

interface UseWaveDataProps {
  waveId: string | null;
  refetchInterval?: number | undefined;
  onWaveNotFound?: (() => void) | undefined;
}

export const useWaveData = ({
  waveId,
  refetchInterval = Infinity,
  onWaveNotFound = () => {},
}: UseWaveDataProps) => {
  return useQuery<ApiWave>({
    queryKey: getWaveQueryKey(waveId),
    queryFn: async () => {
      if (!waveId) {
        return Promise.reject(new Error("Attempted fetch with null waveId")); // Prevent API call
      }
      return await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      });
    },

    staleTime: 60000,
    enabled: !!waveId,
    refetchInterval,
    retry: (failureCount, error) => {
      if (error?.message === "Attempted fetch with null waveId") {
        return false; // Don't retry our artificial error
      }
      if ((error as unknown) === `Wave ${waveId} not found`) {
        onWaveNotFound();
        return false;
      }
      return failureCount < 3;
    },
    retryDelay(failureCount) {
      return failureCount * 1000;
    },
  });
};
