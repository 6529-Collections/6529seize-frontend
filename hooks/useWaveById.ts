import { useQuery } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

interface UseWaveByIdOptions {
  readonly enabled?: boolean | undefined;
}

export function useWaveById(
  waveId: string | null,
  { enabled = true }: UseWaveByIdOptions = {}
) {
  const {
    data: wave,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () => {
      if (!waveId) {
        throw new Error("Cannot fetch wave without a wave id");
      }

      return await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      });
    },
    enabled: Boolean(enabled && waveId),
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
