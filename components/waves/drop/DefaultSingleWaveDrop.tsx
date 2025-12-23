"use client";

import React, { useCallback, useMemo } from "react";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDrop } from "@/hooks/useDrop";
import { useWaveData } from "@/hooks/useWaveData";
import { SingleWaveDropWrapper } from "./SingleWaveDropWrapper";
import { SingleWaveDropInfoPanel } from "./SingleWaveDropInfoPanel";

interface DefaultSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export const DefaultSingleWaveDrop: React.FC<DefaultSingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
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

  if (!extendedDrop || !wave || !drop) {
    return null;
  }

  return (
    <SingleWaveDropWrapper drop={drop} wave={wave} onClose={onClose}>
      <SingleWaveDropInfoPanel
        drop={extendedDrop}
        wave={wave}
        onClose={onClose}
      />
    </SingleWaveDropWrapper>
  );
};
