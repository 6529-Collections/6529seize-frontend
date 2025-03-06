import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../components/react-query-wrapper/utils/query-keys";
import { commonApiFetch } from "../../services/api/common-api";
import { ApiWave } from "../../generated/models/ApiWave";
import { ApiWaveDecision } from "../../generated/models/ApiWaveDecision";


interface UseWaveDecisionsProps {
  readonly wave: ApiWave;
  readonly enabled?: boolean;
}

export function useWaveDecisions({ wave, enabled = true }: UseWaveDecisionsProps) {

  const { data, isError, error, refetch, isFetching } = useQuery({
    queryKey: [QueryKey.WAVE_DECISIONS, { waveId: wave.id }],
    queryFn: async () => {
      return await commonApiFetch<{ data: ApiWaveDecision[] }>({
        endpoint: `waves/${wave.id}/decisions`,
        params: {
          sort_direction: "DESC",
          sort: "decision_time",
          page: "1",
          page_size: "100"  // Fetch a reasonable amount, adjust as needed
        }
      });
    },
    enabled: enabled && !!wave.id,
    staleTime: 60000 // Adjust based on how frequently decisions update
  });




  return {
    decisionPoints: data?.data.map(data => ({
      ...data,
      winners: data.winners.sort((a, b) => a.place - b.place)
    })) || [],
    isError,
    error,
    refetch,
    isFetching
  };
}
