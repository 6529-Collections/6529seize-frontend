import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

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

  // Sort decisions by round number (if available) in ascending order
  const sortedDecisionPoints = data?.data
    .map(data => ({
      ...data,
      winners: data.winners.sort((a, b) => a.place - b.place)
    }))
    .sort((a, b) => a.decision_time - b.decision_time) || [];

  return {
    decisionPoints: sortedDecisionPoints,
    isError,
    error,
    refetch,
    isFetching
  };
}
