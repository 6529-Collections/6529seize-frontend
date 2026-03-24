"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { Time } from "@/helpers/time";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

const getMemesQuickVoteDropQueryKey = (dropId: string) =>
  [
    QueryKey.DROP,
    {
      context: "memes-quick-vote",
      drop_id: dropId,
    },
  ] as const;

const fetchMemesQuickVoteDrop = async (dropId: string) =>
  await commonApiFetch<ApiDrop>({
    endpoint: `drops/${dropId}`,
  });

const shouldInvalidateActiveDrop = (
  drop: ApiDrop,
  now = Time.currentMillis()
): boolean => {
  const profileContext = drop.context_profile_context;

  if (drop.drop_type !== ApiDropType.Participatory) {
    return true;
  }

  if (
    profileContext?.rating !== 0 ||
    typeof profileContext.max_rating !== "number"
  ) {
    return true;
  }

  // Preserve zero-power cards so the queue can show an exhausted state
  // instead of discarding otherwise valid candidates for the session.

  if (
    !drop.wave.authenticated_user_eligible_to_vote ||
    drop.id.startsWith("temp-")
  ) {
    return true;
  }

  const votingPeriodStart = drop.wave.voting_period_start;

  if (votingPeriodStart !== null && now < votingPeriodStart) {
    return true;
  }

  const votingPeriodEnd = drop.wave.voting_period_end;

  return votingPeriodEnd !== null && now > votingPeriodEnd;
};

export const useMemesQuickVoteActiveDrop = ({
  activeCandidateId,
  discoveredDropsById,
  enabled,
  nextCandidateId,
  onInvalidatedDrop,
}: {
  readonly activeCandidateId: string | null;
  readonly discoveredDropsById: Record<string, ApiDrop>;
  readonly enabled: boolean;
  readonly nextCandidateId: string | null;
  readonly onInvalidatedDrop: (dropId: string) => void;
}) => {
  const queryClient = useQueryClient();
  const activeInitialDrop = activeCandidateId
    ? discoveredDropsById[activeCandidateId]
    : undefined;

  const activeQuery = useQuery({
    queryKey: activeCandidateId
      ? getMemesQuickVoteDropQueryKey(activeCandidateId)
      : [QueryKey.DROP, { context: "memes-quick-vote", drop_id: null }],
    queryFn: () => fetchMemesQuickVoteDrop(activeCandidateId!),
    enabled: enabled && !!activeCandidateId,
    initialData: activeInitialDrop,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
    ...getDefaultQueryRetry(),
  });

  const isUsingInitialData =
    !!activeInitialDrop &&
    activeQuery.data === activeInitialDrop &&
    !activeQuery.isFetchedAfterMount;
  const hasFreshData = !!activeQuery.data && !isUsingInitialData;

  useEffect(() => {
    if (!enabled || !nextCandidateId) {
      return;
    }

    void queryClient.prefetchQuery({
      queryKey: getMemesQuickVoteDropQueryKey(nextCandidateId),
      queryFn: () => fetchMemesQuickVoteDrop(nextCandidateId),
      staleTime: 0,
      ...getDefaultQueryRetry(),
    });
  }, [enabled, nextCandidateId, queryClient]);

  useEffect(() => {
    if (!activeCandidateId || !activeQuery.data || !hasFreshData) {
      return;
    }

    if (!shouldInvalidateActiveDrop(activeQuery.data)) {
      return;
    }

    onInvalidatedDrop(activeCandidateId);
  }, [activeCandidateId, activeQuery.data, hasFreshData, onInvalidatedDrop]);

  useEffect(() => {
    if (!activeCandidateId || activeQuery.isFetching || !activeQuery.error) {
      return;
    }

    onInvalidatedDrop(activeCandidateId);
  }, [
    activeCandidateId,
    activeQuery.error,
    activeQuery.isFetching,
    onInvalidatedDrop,
  ]);

  const activeDrop = useMemo(() => {
    if (!activeQuery.data) {
      return null;
    }

    return convertApiDropToExtendedDrop(activeQuery.data);
  }, [activeQuery.data]);

  return {
    activeDrop,
    hasFreshData,
    isLoading:
      !!activeCandidateId &&
      !activeQuery.data &&
      (activeQuery.isLoading || activeQuery.isFetching),
  };
};
