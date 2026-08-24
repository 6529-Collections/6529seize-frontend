"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { fetchWaveSearchAuthors } from "@/services/api/wave-search-authors-api";
import { useQuery } from "@tanstack/react-query";

export function useWaveSearchAuthors({
  waveId,
  handle,
  enabled,
}: {
  readonly waveId: string;
  readonly handle: string;
  readonly enabled: boolean;
}) {
  const normalizedHandle = handle.trim();
  return useQuery({
    queryKey: [
      QueryKey.WAVE_SEARCH_AUTHORS,
      { waveId, handle: normalizedHandle },
    ],
    queryFn: ({ signal }) =>
      fetchWaveSearchAuthors({ waveId, handle: normalizedHandle, signal }),
    enabled,
    staleTime: 30_000,
  });
}
