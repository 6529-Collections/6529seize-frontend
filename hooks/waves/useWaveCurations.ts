"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

export const getWaveCurationsQueryKey = (waveId: string) =>
  [QueryKey.WAVE_CURATIONS, { wave_id: waveId }] as const;

const getPriorityOrder = (
  curation: ApiWaveCuration,
  fallbackIndex: number
): number =>
  Number.isSafeInteger(curation.priority_order) && curation.priority_order > 0
    ? curation.priority_order
    : fallbackIndex + 1;

export const sortWaveCurations = (
  curations: readonly ApiWaveCuration[]
): ApiWaveCuration[] =>
  curations
    .map((curation, index) => ({
      curation,
      index,
      priorityOrder: getPriorityOrder(curation, index),
    }))
    .sort(
      (left, right) =>
        left.priorityOrder - right.priorityOrder ||
        left.curation.created_at - right.curation.created_at ||
        left.curation.id.localeCompare(right.curation.id) ||
        left.index - right.index
    )
    .map(({ curation }) => curation);

interface UseWaveCurationsProps {
  readonly waveId: string;
  readonly enabled?: boolean | undefined;
}

export function useWaveCurations({
  waveId,
  enabled = true,
}: UseWaveCurationsProps) {
  return useQuery<ApiWaveCuration[]>({
    queryKey: getWaveCurationsQueryKey(waveId),
    queryFn: async () =>
      await commonApiFetch<ApiWaveCuration[]>({
        endpoint: `waves/${waveId}/curations`,
      }),
    select: sortWaveCurations,
    enabled: enabled && !!waveId,
    staleTime: 5 * 60 * 1000,
  });
}
