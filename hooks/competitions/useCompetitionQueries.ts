"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  competitionQueryKey,
  competitionScope,
  fetchCompetition,
  fetchDefaultCompetition,
  fetchCompetitionHub,
  fetchCompetitionPauseState,
  fetchCompetitions,
  fetchCompetitionResource,
  type CompetitionIdentity,
  type CompetitionCollectionFilter,
  type CompetitionResourcePages,
} from "@/services/api/competitions-api";

export function useCompetitionViewer() {
  const { connectedProfile, activeProfileProxy } = useAuth();
  return connectedProfile
    ? `${connectedProfile.id ?? "unknown"}:${activeProfileProxy?.id ?? "self"}`
    : null;
}

export function useCompetitionHub(waveId: string, enabled = true) {
  const viewer = useCompetitionViewer();
  return useQuery({
    queryKey: [QueryKey.COMPETITION_HUB, { wave_id: waveId, viewer }],
    queryFn: ({ signal }) => fetchCompetitionHub(waveId, signal),
    retry: false,
    staleTime: 30_000,
    enabled,
  });
}

export function useDefaultCompetition(waveId: string, enabled = true) {
  const viewer = useCompetitionViewer();
  return useQuery({
    queryKey: [QueryKey.DEFAULT_COMPETITION, { wave_id: waveId, viewer }],
    queryFn: ({ signal }) => fetchDefaultCompetition(waveId, signal),
    enabled,
    retry: false,
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Use server durations so device clock skew cannot keep a completed contest active.
      if (
        data?.next_refresh_at === undefined ||
        data.next_refresh_at === null ||
        data.next_refresh_at <= data.evaluated_at
      )
        return 30_000;
      const delay = data.next_refresh_at - data.evaluated_at;
      return Math.max(250, Math.min(30_000, delay));
    },
  });
}

export function useCompetitionList(
  waveId: string,
  filter: CompetitionCollectionFilter = "all",
  enabled = true,
  refetchInterval: number | false = false
) {
  const viewer = useCompetitionViewer();
  return useInfiniteQuery({
    queryKey: [QueryKey.COMPETITIONS, { wave_id: waveId, viewer, filter }],
    queryFn: ({ pageParam, signal }) =>
      fetchCompetitions(waveId, pageParam, signal, filter),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
    retry: false,
    staleTime: 30_000,
    refetchInterval,
    enabled,
  });
}

export function useCompetitionPauseState(identity: CompetitionIdentity) {
  const viewer = useCompetitionViewer();
  return useQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      "current-pause",
    ],
    queryFn: ({ signal }) => fetchCompetitionPauseState(identity, signal),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useCompetitionDetail(identity: CompetitionIdentity) {
  const viewer = useCompetitionViewer();
  return useQuery({
    queryKey: competitionQueryKey(identity, viewer),
    queryFn: ({ signal }) => fetchCompetition(identity, signal),
    retry: false,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useCompetitionResource<
  K extends keyof CompetitionResourcePages,
>(
  identity: CompetitionIdentity,
  resource: K,
  params: Record<string, string> = {},
  enabled = true
) {
  const viewer = useCompetitionViewer();
  return useInfiniteQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      resource,
      params,
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchCompetitionResource(
        identity,
        resource,
        { limit: "50", ...params, ...(pageParam ? { cursor: pageParam } : {}) },
        signal
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
    retry: false,
    staleTime: 15_000,
    enabled,
  });
}
