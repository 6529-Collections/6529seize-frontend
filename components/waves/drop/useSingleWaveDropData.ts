"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useCallback, useMemo } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useWaveData } from "@/hooks/useWaveData";
import { useDropVoteSummary } from "./useDropVoteSummary";
import { useDropDetailMetadata } from "./useDropDetailMetadata";

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

  const { metadata: hydratedMetadata, metadataState } =
    useDropDetailMetadata(initialDrop);

  const voteSummary = useDropVoteSummary({
    dropId: initialDrop.id,
    waveId: initialDrop.wave.id,
    enabled:
      initialDrop.drop_type === ApiDropType.Participatory &&
      wave?.wave.type === ApiWaveType.Rank,
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

  return { drop, wave, extendedDrop, voteSummary, metadataState };
};
