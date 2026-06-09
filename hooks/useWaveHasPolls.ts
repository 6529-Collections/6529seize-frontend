"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import { ApiPageSortDirection } from "@/generated/models/ApiPageSortDirection";
import { fetchWavePollsV2 } from "@/services/api/wave-drops-v2-api";
import { useQuery } from "@tanstack/react-query";

const WAVE_POLLS_AVAILABILITY_PAGE_SIZE = 1;

interface UseWaveHasPollsProps {
  readonly waveId: string | null | undefined;
  readonly enabled?: boolean | undefined;
}

export function useWaveHasPolls({
  waveId,
  enabled = true,
}: UseWaveHasPollsProps): boolean {
  const normalizedWaveId = waveId?.trim() ?? "";
  const isEnabled = enabled && normalizedWaveId.length > 0;

  const { data } = useQuery({
    queryKey: [
      QueryKey.WAVE_POLLS,
      {
        scope: "has-polls",
        waveId: normalizedWaveId,
        pageSize: WAVE_POLLS_AVAILABILITY_PAGE_SIZE,
        sortDirection: ApiPageSortDirection.Desc,
        sort: "created_at",
      },
    ] as const,
    queryFn: async ({ signal }) => {
      const pollsPage = await fetchWavePollsV2({
        waveId: normalizedWaveId,
        page: 1,
        pageSize: WAVE_POLLS_AVAILABILITY_PAGE_SIZE,
        sortDirection: ApiPageSortDirection.Desc,
        sort: "created_at",
        signal,
      });

      return pollsPage.count > 0 || pollsPage.data.length > 0;
    },
    enabled: isEnabled,
    staleTime: 60_000,
    ...getDefaultQueryRetry(),
  });

  return data === true;
}
