"use client";

import React, { useEffect } from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { MemesSingleWaveDropInfoPanel } from "./MemesSingleWaveDropInfoPanel";
import { SingleWaveDropWrapper } from "./SingleWaveDropWrapper";
import { useSingleWaveDropData } from "./useSingleWaveDropData";

interface MemesSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
  readonly onContentReady?: () => void;
}

export const MemesSingleWaveDrop: React.FC<MemesSingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
  onContentReady,
}) => {
  const { drop, wave, extendedDrop } = useSingleWaveDropData(
    initialDrop,
    onClose
  );

  useEffect(() => {
    if (drop && wave && extendedDrop) {
      onContentReady?.();
    }
  }, [drop, wave, extendedDrop, onContentReady]);

  if (!extendedDrop || !wave || !drop) {
    return null;
  }

  return (
    <SingleWaveDropWrapper drop={drop} wave={wave} onClose={onClose}>
      <MemesSingleWaveDropInfoPanel drop={extendedDrop} wave={wave} />
    </SingleWaveDropWrapper>
  );
};
