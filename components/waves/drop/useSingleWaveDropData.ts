"use client";

import { useCallback, useMemo } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useWaveData } from "@/hooks/useWaveData";
import { useQuery } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DROP_DETAIL_STALE_TIME_MS } from "@/services/api/drop-api";
import { fetchDropV2ById } from "@/services/api/wave-drops-v2-api";

export const useSingleWaveDropData = (
  initialDrop: ExtendedDrop,
  onClose: () => void
) => {
  const { data: drop } = useQuery<ApiDrop | undefined>({
    queryKey: [
      QueryKey.DROP,
      {
        drop_id: initialDrop.id,
        view: "single-wave-drop",
      },
    ],
    queryFn: ({ signal }) =>
      fetchDropV2ById(initialDrop.id, signal, { includeTopRaters: false }),
    staleTime: DROP_DETAIL_STALE_TIME_MS,
  });

  const onWaveNotFound = useCallback(() => {
    onClose();
  }, [onClose]);

  const { data: wave } = useWaveData({
    waveId: drop?.wave.id ?? null,
    onWaveNotFound,
  });

  const extendedDrop = useMemo(
    () =>
      drop
        ? {
            type: DropSize.FULL as const,
            ...drop,
            stableHash: initialDrop.stableHash,
            stableKey: initialDrop.stableKey,
          }
        : null,
    [drop, initialDrop.stableHash, initialDrop.stableKey]
  );

  return { drop, wave, extendedDrop };
};
