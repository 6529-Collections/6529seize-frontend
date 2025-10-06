"use client";

import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import {
  getDefaultQueryRetry,
  WAVE_LOGS_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import { ApiWaveLog } from "@/generated/models/ApiWaveLog";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

interface UseWaveActivityLogsProps {
  readonly waveId: string;
  readonly connectedProfileHandle: string | undefined;
  readonly reverse: boolean;
  readonly dropId: string | null;
  readonly logTypes: string[];
}

export function useWaveActivityLogs({
  waveId,
  connectedProfileHandle,
  reverse,
  dropId,
  logTypes,
}: UseWaveActivityLogsProps) {
  const queryClient = useQueryClient();

  const [logs, setLogs] = useState<ApiWaveLog[]>([]);

  const queryKey = [
    QueryKey.WAVE_LOGS,
    {
      waveId,
      limit: WAVE_LOGS_PARAMS.limit,
      dropId,
      logTypes,
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
        if (logTypes) {
          params.log_types = logTypes.join(",");
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
      ...getDefaultQueryRetry(),
    });
  }, [waveId]);

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          limit: WAVE_LOGS_PARAMS.limit.toString(),
        };
        if (dropId) {
          params.drop_id = dropId;
        }
        if (logTypes) {
          params.log_types = logTypes.join(",");
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
      placeholderData: keepPreviousData,
      enabled: !!connectedProfileHandle,
      staleTime: 60000,
      refetchInterval: 30000,
      ...getDefaultQueryRetry(),
    });

  useEffect(() => {
    setLogs(() => {
      const newLogs = data?.pages ? data.pages.flat() : [];
      return reverse ? newLogs.reverse() : newLogs;
    });
  }, [data, reverse]);

  return {
    logs,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  };
}
