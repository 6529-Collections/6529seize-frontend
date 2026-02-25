"use client";

import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWaveCurationGroup } from "@/generated/models/ApiWaveCurationGroup";
import { commonApiFetch } from "@/services/api/common-api";

export const getWaveCurationGroupsQueryKey = (waveId: string) =>
  [QueryKey.WAVE_CURATION_GROUPS, { wave_id: waveId }] as const;

interface UseWaveCurationGroupsProps {
  readonly waveId: string;
  readonly enabled?: boolean | undefined;
}

export function useWaveCurationGroups({
  waveId,
  enabled = true,
}: UseWaveCurationGroupsProps) {
  return useQuery<ApiWaveCurationGroup[]>({
    queryKey: getWaveCurationGroupsQueryKey(waveId),
    queryFn: async () =>
      await commonApiFetch<ApiWaveCurationGroup[]>({
        endpoint: `waves/${waveId}/curation-groups`,
      }),
    enabled: enabled && !!waveId,
    staleTime: 5 * 60 * 1000,
  });
}
