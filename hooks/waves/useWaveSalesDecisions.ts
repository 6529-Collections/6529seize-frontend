import { useInfiniteQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import type { ApiWaveDecisionsPage } from "@/generated/models/ApiWaveDecisionsPage";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMemo } from "react";

interface UseWaveSalesDecisionsProps {
  readonly waveId: string;
  readonly enabled?: boolean | undefined;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_STALE_TIME = 60000;

const sortDecisionPoint = (
  decisionPoint: ApiWaveDecision
): ApiWaveDecision => ({
  ...decisionPoint,
  winners: [...decisionPoint.winners].sort((a, b) => a.place - b.place),
});

export function useWaveSalesDecisions({
  waveId,
  enabled = true,
}: UseWaveSalesDecisionsProps) {
  const {
    data,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QueryKey.WAVE_DECISIONS_SALES, { waveId }],
    queryFn: async ({ pageParam }: { pageParam?: number | undefined }) => {
      const currentPage = pageParam ?? DEFAULT_PAGE;

      return await commonApiFetch<ApiWaveDecisionsPage>({
        endpoint: `waves/${waveId}/decisions`,
        params: {
          sort_direction: "DESC",
          sort: "decision_time",
          page: currentPage.toString(),
          page_size: DEFAULT_PAGE_SIZE.toString(),
        },
      });
    },
    initialPageParam: DEFAULT_PAGE,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    enabled,
    staleTime: DEFAULT_STALE_TIME,
  });

  const decisionPoints = useMemo(() => {
    const mergedDecisionPoints: ApiWaveDecision[] = [];
    const seenDecisionTimes = new Set<number>();

    for (const page of data?.pages ?? []) {
      for (const decisionPoint of page.data) {
        if (seenDecisionTimes.has(decisionPoint.decision_time)) {
          continue;
        }

        seenDecisionTimes.add(decisionPoint.decision_time);
        mergedDecisionPoints.push(sortDecisionPoint(decisionPoint));
      }
    }

    return mergedDecisionPoints.sort(
      (a, b) => a.decision_time - b.decision_time
    );
  }, [data?.pages]);

  return {
    decisionPoints,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
