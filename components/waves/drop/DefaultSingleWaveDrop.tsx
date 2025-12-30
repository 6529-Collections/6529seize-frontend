"use client";

import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropWrapper } from "./SingleWaveDropWrapper";
import { SingleWaveDropInfoPanel } from "./SingleWaveDropInfoPanel";
import { useSingleWaveDropData } from "./useSingleWaveDropData";

interface DefaultSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export const DefaultSingleWaveDrop: React.FC<DefaultSingleWaveDropProps> = ({
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
      <SingleWaveDropInfoPanel drop={extendedDrop} />
    </SingleWaveDropWrapper>
  );
};
