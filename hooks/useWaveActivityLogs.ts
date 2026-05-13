"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { ApiWaveLog } from "@/generated/models/ApiWaveLog";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

interface UseWaveActivityLogsProps {
  readonly waveId: string;
  readonly connectedProfileHandle: string | undefined;
  readonly reverse: boolean;
  readonly dropId: string | null;
  readonly logTypes: string[];
  readonly enabled?: boolean | undefined;
}

export function useWaveActivityLogs({
  waveId,
  connectedProfileHandle,
  reverse,
  dropId,
  logTypes,
  enabled = true,
}: UseWaveActivityLogsProps) {
  const queryClient = useQueryClient();

  const [logs, setLogs] = useState<ApiWaveLog[]>([]);
  const canFetch = enabled && !!connectedProfileHandle;
  const serializedLogTypes = logTypes.join(",");

  const queryKey = useMemo(
    () => [
      QueryKey.WAVE_LOGS,
      {
        waveId,
        limit: WAVE_LOGS_PARAMS.limit,
        dropId,
        logTypes: serializedLogTypes,
      },
    ],
    [waveId, dropId, serializedLogTypes]
  );

  useEffect(() => {
    if (!canFetch) {
      return;
    }

    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          limit: WAVE_LOGS_PARAMS.limit.toString(),
        };
        if (dropId) {
          params["drop_id"] = dropId;
        }
        if (serializedLogTypes) {
          params["log_types"] = serializedLogTypes;
        }
        if (pageParam) {
          params["offset"] = `${pageParam}`;
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
  }, [canFetch, queryKey, waveId, dropId, serializedLogTypes, queryClient]);

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          limit: WAVE_LOGS_PARAMS.limit.toString(),
        };
        if (dropId) {
          params["drop_id"] = dropId;
        }
        if (serializedLogTypes) {
          params["log_types"] = serializedLogTypes;
        }
        if (pageParam !== null) {
          params["offset"] = `${pageParam}`;
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
      enabled: canFetch,
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
