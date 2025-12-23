"use client";

import { useCallback, useMemo } from "react";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDrop } from "@/hooks/useDrop";
import { useWaveData } from "@/hooks/useWaveData";

export const useSingleWaveDropData = (
  initialDrop: ExtendedDrop,
  onClose: () => void
) => {
  const { drop } = useDrop({ dropId: initialDrop.id });

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
