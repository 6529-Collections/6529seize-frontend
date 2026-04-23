import React from "react";
import { useWaveParticipationRendererSet } from "../drops/participation/participationRendererRegistry";
import type { SingleWaveDropProps } from "../drops/participation/participationRenderer.types";

export const SingleWaveDrop: React.FC<SingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const { SingleWaveDrop: SingleWaveDropRenderer } =
    useWaveParticipationRendererSet(initialDrop.wave.id);

  return <SingleWaveDropRenderer drop={initialDrop} onClose={onClose} />;
};
