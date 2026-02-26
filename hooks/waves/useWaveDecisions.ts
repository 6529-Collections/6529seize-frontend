import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import { commonApiFetch } from "@/services/api/common-api";

interface UseWaveDecisionsProps {
  readonly waveId: string;
  readonly enabled?: boolean | undefined;
}

export function useWaveDecisions({
  waveId,
  enabled = true,
}: UseWaveDecisionsProps) {
  const { data, isError, error, refetch, isFetching } = useQuery({
    queryKey: [QueryKey.WAVE_DECISIONS, { waveId }],
    queryFn: async () => {
      return await commonApiFetch<{ data: ApiWaveDecision[] }>({
        endpoint: `waves/${waveId}/decisions`,
        params: {
          sort_direction: "DESC",
          sort: "decision_time",
          page: "1",
          page_size: "100", // Fetch a reasonable amount, adjust as needed
        },
      });
    },
    enabled,
    staleTime: 60000, // Adjust based on how frequently decisions update
  });

  // Sort decisions by round number (if available) in ascending order
  const sortedDecisionPoints =
    data?.data
      .map((d) => ({
        ...d,
        winners: d.winners.sort((a, b) => a.place - b.place),
      }))
      .sort((a, b) => a.decision_time - b.decision_time) ?? [];

  return {
    decisionPoints: sortedDecisionPoints,
    isError,
    error,
    refetch,
    isFetching,
  };
}
