import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
import { useCallback, useEffect, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { commonApiFetch } from "../services/api/common-api";
import { useDebounce } from "react-use";
import { WAVE_LOGS_PARAMS } from "../components/react-query-wrapper/utils/query-utils";
import { ApiWaveLog } from "../generated/models/ApiWaveLog";

interface UseWaveActivityLogsProps {
  readonly waveId: string;
  readonly connectedProfileHandle: string | undefined;
  readonly reverse: boolean;
  readonly dropId: string | null;
}

const POLLING_DELAY = 3000;
const ACTIVE_POLLING_INTERVAL = 5000;
const INACTIVE_POLLING_INTERVAL = 30000;

function useTabVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return isVisible;
}

export function useWaveActivityLogs({
  waveId,
  connectedProfileHandle,
  reverse,
  dropId,
}: UseWaveActivityLogsProps) {
  const queryClient = useQueryClient();

  const [logs, setLogs] = useState<ApiWaveLog[]>([]);
  const [haveNewLogs, setHaveNewLogs] = useState(false);
  const [canPoll, setCanPoll] = useState(false);
  const [delayedPollingResult, setDelayedPollingResult] = useState<
    ApiWaveLog[] | undefined
  >(undefined);
  const isTabVisible = useTabVisibility();

  const queryKey = [
    QueryKey.LOGS,
    {
      waveId,
      limit: WAVE_LOGS_PARAMS.limit,
      dropId,
    },
  ];

  useEffect(() => {
    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          limit: WAVE_LOGS_PARAMS.limit.toString(),
        };
        if (dropId) {
          params.drop_id = dropId;
        }

        if (pageParam) {
          params.offset = `${pageParam}`;
        }
        return await commonApiFetch<ApiWaveLog[]>({
          endpoint: `waves/${waveId}/logs`,
          params,
        });
      },
      initialPageParam: null,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === WAVE_LOGS_PARAMS.limit
          ? allPages.length * WAVE_LOGS_PARAMS.limit
          : null,
      pages: 3,
      staleTime: 60000,
    });
  }, [waveId]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        limit: WAVE_LOGS_PARAMS.limit.toString(),
      };
      if (dropId) {
        params.drop_id = dropId;
      }
      if (pageParam !== null) {
        params.offset = `${pageParam}`;
      }

      const results = await commonApiFetch<ApiWaveLog[]>({
        endpoint: `waves/${waveId}/logs`,
        params,
      });

      return results;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === WAVE_LOGS_PARAMS.limit
        ? allPages.length * WAVE_LOGS_PARAMS.limit
        : null,
    keepPreviousData: true,
    enabled: !!connectedProfileHandle,
    staleTime: 60000,
  });

  useEffect(() => {
    setLogs((prev) => {
      const newLogs = data?.pages ? data.pages.flat() : [];
      return reverse ? newLogs.reverse() : newLogs;
    });
  }, [data, reverse]);

  useDebounce(() => setCanPoll(true), 10000, [data]);

  const { data: pollingResult } = useQuery({
    queryKey: [...queryKey, "polling"],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: "1",
      };
      if (dropId) {
        params.drop_id = dropId;
      }
      return await commonApiFetch<ApiWaveLog[]>({
        endpoint: `waves/${waveId}/logs`,
        params,
      });
    },
    enabled: !haveNewLogs && canPoll,
    refetchInterval: isTabVisible
      ? ACTIVE_POLLING_INTERVAL
      : INACTIVE_POLLING_INTERVAL,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (pollingResult) {
      const timer = setTimeout(() => {
        setDelayedPollingResult(pollingResult);
      }, POLLING_DELAY);

      return () => clearTimeout(timer);
    }
  }, [pollingResult]);

  useEffect(() => {
    if (delayedPollingResult !== undefined) {
      if (delayedPollingResult.length > 0) {
        const latestPolledLog = delayedPollingResult[0];

        if (logs.length > 0) {
          const latestExistingLog = logs[0];

          const polledCreatedAt = new Date(
            latestPolledLog.created_at
          ).getTime();
          const existingCreatedAt = new Date(
            latestExistingLog.created_at
          ).getTime();

          setHaveNewLogs(polledCreatedAt > existingCreatedAt);
        } else {
          setHaveNewLogs(true);
        }
      } else {
        setHaveNewLogs(false);
      }
    }
  }, [delayedPollingResult, logs]);

  useEffect(() => {
    if (!haveNewLogs) return;
    if (!isTabVisible) return;
    refetch();
    setHaveNewLogs(false);
  }, [haveNewLogs, isTabVisible]);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({
        queryKey: [QueryKey.LOGS, { waveId }],
      });
    };
  }, [waveId, queryClient]);

  const manualFetch = useCallback(async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  return {
    logs,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    haveNewLogs,
    manualFetch,
  };
} 
