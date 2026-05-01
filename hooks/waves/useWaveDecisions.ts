import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import type { ApiWaveDecisionsPage } from "@/generated/models/ApiWaveDecisionsPage";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { prepareWaveDecisionPoint } from "@/helpers/waves/wave-decision.helpers";

interface UseWaveDecisionsProps {
  readonly waveId: string;
  readonly enabled?: boolean | undefined;
  readonly loadAllPages?: boolean | undefined;
  readonly pageSize?: number | undefined;
}

const DEFAULT_PAGE = 1;
const DEFAULT_WAVE_DECISIONS_PAGE_SIZE = 100;
export const FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE = 2000;
const DEFAULT_STALE_TIME = 60000;

const getValidPageSize = (pageSize: number | undefined): number => {
  if (
    typeof pageSize === "number" &&
    Number.isFinite(pageSize) &&
    pageSize > 0
  ) {
    return Math.min(
      Math.floor(pageSize),
      FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE
    );
  }

  return DEFAULT_WAVE_DECISIONS_PAGE_SIZE;
};

export function useWaveDecisions({
  waveId,
  enabled = true,
  loadAllPages = false,
  pageSize,
}: UseWaveDecisionsProps) {
  const resolvedPageSize = getValidPageSize(pageSize);
  const {
    data,
    isError,
    error,
    refetch,
    isFetching,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QueryKey.WAVE_DECISIONS, { waveId, pageSize: resolvedPageSize }],
    queryFn: async ({ pageParam }: { pageParam?: number | undefined }) => {
      const currentPage = pageParam ?? DEFAULT_PAGE;

      return await commonApiFetch<ApiWaveDecisionsPage>({
        endpoint: `waves/${waveId}/decisions`,
        params: {
          sort_direction: "DESC",
          sort: "decision_time",
          page: currentPage.toString(),
          page_size: resolvedPageSize.toString(),
        },
      });
    },
    initialPageParam: DEFAULT_PAGE,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    enabled,
    staleTime: DEFAULT_STALE_TIME,
  });

  useEffect(() => {
    if (
      !enabled ||
      !loadAllPages ||
      !hasNextPage ||
      isFetchNextPageError ||
      isFetchingNextPage
    ) {
      return;
    }

    void fetchNextPage();
  }, [
    enabled,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    loadAllPages,
  ]);

  const decisionPoints = useMemo(() => {
    const mergedDecisionPoints: ApiWaveDecision[] = [];
    const seenDecisionTimes = new Set<number>();

    for (const page of data?.pages ?? []) {
      for (const decisionPoint of page.data) {
        if (seenDecisionTimes.has(decisionPoint.decision_time)) {
          continue;
        }

        seenDecisionTimes.add(decisionPoint.decision_time);
        mergedDecisionPoints.push(
          prepareWaveDecisionPoint(decisionPoint, waveId)
        );
      }
    }

    return mergedDecisionPoints.sort(
      (a, b) => a.decision_time - b.decision_time
    );
  }, [data?.pages, waveId]);

  const hasLoadedAllPages =
    Boolean(data?.pages.length) && hasNextPage === false && !isFetchingNextPage;
  const isLoadingAllPages = Boolean(
    enabled &&
    (isLoading ||
      (loadAllPages && (Boolean(hasNextPage) || isFetchingNextPage)))
  );

  return {
    decisionPoints,
    isError,
    error,
    refetch,
    isFetching,
    isLoading,
    hasLoadedAllPages,
    isLoadingAllPages,
    fetchNextPage,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
  };
}
