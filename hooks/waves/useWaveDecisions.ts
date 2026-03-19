import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

interface UseWaveDecisionsProps {
  readonly waveId: string;
  readonly enabled?: boolean | undefined;
}

const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_STALE_TIME = 60000;

const sortDecisionPoint = (
  decisionPoint: ApiWaveDecision
): ApiWaveDecision => ({
  ...decisionPoint,
  winners: [...decisionPoint.winners].sort((a, b) => a.place - b.place),
});

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
          page_size: DEFAULT_PAGE_SIZE.toString(),
        },
      });
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
  });

  const decisionPoints =
    data?.data
      .map((decisionPoint) => sortDecisionPoint(decisionPoint))
      .sort((a, b) => a.decision_time - b.decision_time) ?? [];

  return {
    decisionPoints,
    isError,
    error,
    refetch,
    isFetching,
  };
}
