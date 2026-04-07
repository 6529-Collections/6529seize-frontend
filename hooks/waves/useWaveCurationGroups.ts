"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

export const getWaveCurationsQueryKey = (waveId: string) =>
  [QueryKey.WAVE_CURATIONS, { wave_id: waveId }] as const;

interface UseWaveCurationGroupsProps {
  readonly waveId: string;
  readonly enabled?: boolean | undefined;
}

export function useWaveCurationGroups({
  waveId,
  enabled = true,
}: UseWaveCurationGroupsProps) {
  return useQuery<ApiWaveCuration[]>({
    queryKey: getWaveCurationsQueryKey(waveId),
    queryFn: async () =>
      await commonApiFetch<ApiWaveCuration[]>({
        endpoint: `waves/${waveId}/curations`,
      }),
    enabled: enabled && !!waveId,
    staleTime: 5 * 60 * 1000,
  });
}
