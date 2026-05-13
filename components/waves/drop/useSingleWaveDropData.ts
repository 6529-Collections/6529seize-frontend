"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useCallback, useMemo } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useWaveData } from "@/hooks/useWaveData";
import { DROP_DETAIL_STALE_TIME_MS } from "@/services/api/drop-api";
import { fetchDropMetadataByIdV2 } from "@/services/api/wave-drops-v2-api";
import { useQuery } from "@tanstack/react-query";

export const useSingleWaveDropData = (
  initialDrop: ExtendedDrop,
  onClose: () => void
) => {
  const onWaveNotFound = useCallback(() => {
    onClose();
  }, [onClose]);

  const { data: wave } = useWaveData({
    waveId: initialDrop.wave.id,
    onWaveNotFound,
  });

  const { data: hydratedMetadata } = useQuery({
    queryKey: [
      QueryKey.DROP,
      {
        drop_id: initialDrop.id,
        view: "metadata",
      },
    ],
    queryFn: ({ signal }) =>
      fetchDropMetadataByIdV2({
        dropId: initialDrop.id,
        priorityMetadata: initialDrop.metadata,
        signal,
      }),
    enabled: initialDrop.id.trim().length > 0,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
  });

  const drop = useMemo<ApiDrop>(
    () => ({
      ...initialDrop,
      metadata: hydratedMetadata ?? initialDrop.metadata,
    }),
    [hydratedMetadata, initialDrop]
  );

  const extendedDrop = useMemo(
    () => ({
      ...drop,
      type: DropSize.FULL as const,
      stableHash: initialDrop.stableHash,
      stableKey: initialDrop.stableKey,
    }),
    [drop, initialDrop.stableHash, initialDrop.stableKey]
  );

  return { drop, wave, extendedDrop };
};
