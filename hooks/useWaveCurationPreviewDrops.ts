"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { toApiWaveMin } from "@/helpers/waves/wave.helpers";
import {
  generateUniqueKeys,
  mapToExtendedDrops,
} from "@/helpers/waves/wave-drops.helpers";
import { fetchWaveCurationDropsV2 } from "@/services/api/wave-curation-drops-v2-api";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useWaveCurationPreviewDrops({
  wave,
  curationId,
  pageSize,
  enabled = true,
}: {
  readonly wave: ApiWave | null;
  readonly curationId: string | null | undefined;
  readonly pageSize: number;
  readonly enabled?: boolean | undefined;
}) {
  const normalizedCurationId = curationId?.trim() ?? "";
  const waveId = wave?.id ?? null;
  const waveMin = useMemo(() => (wave ? toApiWaveMin(wave) : null), [wave]);
  const queryKey = useMemo(
    () =>
      [
        QueryKey.DROPS,
        {
          waveId,
          curationId: normalizedCurationId || null,
          pageSize,
          context: "wave-curation-preview-drops",
        },
      ] as const,
    [normalizedCurationId, pageSize, waveId]
  );

  const { data, error, isError, isFetched, isFetching } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!wave || !normalizedCurationId) {
        throw new Error(
          "Wave and curation are required to load curation preview drops"
        );
      }

      return await fetchWaveCurationDropsV2({
        wave,
        curationId: normalizedCurationId,
        page: 1,
        pageSize,
        signal,
      });
    },
    enabled: enabled && !!waveId && normalizedCurationId.length > 0,
    staleTime: 2 * 60 * 1000,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const drops = useMemo<ExtendedDrop[]>(() => {
    if (!waveMin || !data) {
      return [];
    }

    return generateUniqueKeys(
      mapToExtendedDrops(
        [
          {
            wave: waveMin,
            drops: data.data as ApiDropWithoutWave[],
          },
        ],
        [],
        false
      ),
      []
    );
  }, [data, waveMin]);

  return {
    drops,
    error,
    isError,
    isFetched,
    isFetching,
  };
}
