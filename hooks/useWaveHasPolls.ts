"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import { ApiPageSortDirection } from "@/generated/models/ApiPageSortDirection";
import { fetchWavePollsV2 } from "@/services/api/wave-drops-v2-api";
import { useQuery } from "@tanstack/react-query";

const WAVE_POLLS_AVAILABILITY_PAGE_SIZE = 1;

interface WavePollSummary {
  readonly hasPolls: boolean;
  readonly unansweredPolls: number;
}

interface UseWaveHasPollsProps {
  readonly waveId: string | null | undefined;
  readonly enabled?: boolean | undefined;
}

const EMPTY_WAVE_POLL_SUMMARY: WavePollSummary = {
  hasPolls: false,
  unansweredPolls: 0,
};

const normalizeUnansweredPollCount = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
};

const getUnansweredPollCount = (
  pollsPage: Readonly<{
    open_unanswered?: unknown;
    unanswered_polls?: unknown;
  }>
): number =>
  normalizeUnansweredPollCount(
    pollsPage.open_unanswered ?? pollsPage.unanswered_polls
  );

export function useWavePollSummary({
  waveId,
  enabled = true,
}: UseWaveHasPollsProps): WavePollSummary {
  const normalizedWaveId = waveId?.trim() ?? "";
  const isEnabled = enabled && normalizedWaveId.length > 0;

  const { data } = useQuery({
    queryKey: [
      QueryKey.WAVE_POLLS,
      {
        scope: "poll-summary",
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

      return {
        hasPolls: pollsPage.count > 0 || pollsPage.data.length > 0,
        unansweredPolls: getUnansweredPollCount(pollsPage),
      };
    },
    enabled: isEnabled,
    staleTime: 60_000,
    ...getDefaultQueryRetry(),
  });

  return data ?? EMPTY_WAVE_POLL_SUMMARY;
}

export function useWaveHasPolls(props: UseWaveHasPollsProps): boolean {
  return useWavePollSummary(props).hasPolls;
}
