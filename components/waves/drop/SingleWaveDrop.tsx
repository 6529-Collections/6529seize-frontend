"use client";

import React from "react";
import { useWaveSingleWaveDropRendererSet } from "./singleWaveDropRendererRegistry";
import type { SingleWaveDropProps } from "../drops/participation/participationRenderer.types";
import { useCompetitionDrop } from "@/hooks/competitions/useCompetitionDrop";

function CompetitionSingleWaveDrop(props: SingleWaveDropProps) {
  const drop = useCompetitionDrop(props.drop);
  return <SingleWaveDropContent {...props} drop={drop} />;
}

export const SingleWaveDrop: React.FC<SingleWaveDropProps> = (props) => (
  <CompetitionSingleWaveDrop {...props} />
);

const SingleWaveDropContent: React.FC<SingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const { SingleWaveDrop: SingleWaveDropRenderer } =
    useWaveSingleWaveDropRendererSet(
      initialDrop.wave.id,
      initialDrop.competition_context?.data.competition?.capabilities
    );

  return <SingleWaveDropRenderer drop={initialDrop} onClose={onClose} />;
};
