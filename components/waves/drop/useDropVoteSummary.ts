"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropVoteDistribution } from "@/generated/models/ApiDropVoteDistribution";
import { isWsDropUpdateRefData, WsMessageType } from "@/helpers/Types";
import { useDebouncedQueryRefetch } from "@/hooks/useDebouncedQueryRefetch";
import { DROP_DETAIL_STALE_TIME_MS } from "@/services/api/drop-api";
import { fetchDropVoteSummaryByIdV2 } from "@/services/api/drop-vote-summary-api";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

export type DropVoteSummaryState =
  | { readonly status: "disabled" }
  | { readonly status: "loading" }
  | {
      readonly status: "unavailable";
      readonly retry: () => void;
    }
  | {
      readonly status: "ready";
      readonly voteDistribution: ApiDropVoteDistribution;
      readonly retry: () => void;
    };

export const DISABLED_DROP_VOTE_SUMMARY_STATE = {
  status: "disabled",
} as const satisfies DropVoteSummaryState;

export function useDropVoteSummary({
  dropId,
  waveId,
  enabled,
}: {
  readonly dropId: string;
  readonly waveId: string;
  readonly enabled: boolean;
}): DropVoteSummaryState {
  const { data, isFetching, refetch } = useQuery({
    queryKey: [QueryKey.DROP, { drop_id: dropId, view: "vote-summary" }],
    queryFn: ({ signal }) => fetchDropVoteSummaryByIdV2(dropId, signal),
    enabled,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
    retry: 1,
  });
  const refetchWhenEnabled = useCallback(
    () => (enabled ? refetch() : Promise.resolve()),
    [enabled, refetch]
  );
  const requestRefetch = useDebouncedQueryRefetch({
    refetch: refetchWhenEnabled,
    isFetching,
    isFetchingNextPage: false,
  });
  const onDropUpdate = useCallback(
    (message: ApiDrop) => {
      if (enabled && message.id === dropId && message.wave.id === waveId) {
        requestRefetch();
      }
    },
    [dropId, enabled, requestRefetch, waveId]
  );

  useWebSocketMessage<ApiDrop>(WsMessageType.DROP_RATING_UPDATE, onDropUpdate);
  useWebSocketMessage<ApiDrop>(WsMessageType.DROP_UPDATE, onDropUpdate);
  useWebSocketMessage<unknown>(
    WsMessageType.DROP_UPDATE_REF,
    useCallback(
      (message) => {
        if (
          enabled &&
          isWsDropUpdateRefData(message) &&
          message.drop_id === dropId &&
          message.wave_id === waveId &&
          message.update_type !== WsMessageType.DROP_REACTION_UPDATE
        ) {
          requestRefetch();
        }
      },
      [dropId, enabled, requestRefetch, waveId]
    )
  );

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (!enabled) {
    return DISABLED_DROP_VOTE_SUMMARY_STATE;
  }
  if (data?.vote_distribution) {
    return {
      status: "ready",
      voteDistribution: data.vote_distribution,
      retry,
    };
  }
  if (isFetching) {
    return { status: "loading" };
  }
  return { status: "unavailable", retry };
}
