"use client";

import React, { useEffect } from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropWrapper } from "./SingleWaveDropWrapper";
import { SingleWaveDropInfoPanel } from "./SingleWaveDropInfoPanel";
import { useSingleWaveDropData } from "./useSingleWaveDropData";

interface DefaultSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
  readonly onContentReady?: () => void;
}

export const DefaultSingleWaveDrop: React.FC<DefaultSingleWaveDropProps> = ({
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
      <SingleWaveDropInfoPanel drop={extendedDrop} wave={wave} />
    </SingleWaveDropWrapper>
  );
};
