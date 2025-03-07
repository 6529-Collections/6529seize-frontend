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

  // Sort decisions by round number (if available) in ascending order
  const sortedDecisionPoints = data?.data
    .map(data => ({
      ...data,
      winners: data.winners.sort((a, b) => a.place - b.place)
    }))
    .sort((a, b) => {
      // Extract round numbers from decision_name if possible
      const roundA = a.decision_name ? parseInt(a.decision_name.match(/\d+/)?.[0] || "0") : 0;
      const roundB = b.decision_name ? parseInt(b.decision_name.match(/\d+/)?.[0] || "0") : 0;
      return roundA - roundB; // Sort in ascending order (1, 2, 3...)
    }) || [];

  return {
    decisionPoints: sortedDecisionPoints,
    isError,
    error,
    refetch,
    isFetching
  };
}
