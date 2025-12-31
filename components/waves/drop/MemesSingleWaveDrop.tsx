"use client";

import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { MemesSingleWaveDropInfoPanel } from "./MemesSingleWaveDropInfoPanel";
import { SingleWaveDropWrapper } from "./SingleWaveDropWrapper";
import { useSingleWaveDropData } from "./useSingleWaveDropData";

interface MemesSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export const MemesSingleWaveDrop: React.FC<MemesSingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const { drop, wave, extendedDrop } = useSingleWaveDropData(
    initialDrop,
    onClose
  );

  if (!extendedDrop || !wave || !drop) {
    return null;
  }

  return (
    <SingleWaveDropWrapper drop={drop} wave={wave} onClose={onClose}>
      <MemesSingleWaveDropInfoPanel drop={extendedDrop} wave={wave} />
    </SingleWaveDropWrapper>
  );
};
