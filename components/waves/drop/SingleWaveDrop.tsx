"use client";

import React from "react";
import { useWaveSingleWaveDropRendererSet } from "./singleWaveDropRendererRegistry";
import type { SingleWaveDropProps } from "../drops/participation/participationRenderer.types";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import { useCompetitionDrop } from "@/hooks/competitions/useCompetitionDrop";

function CompetitionSingleWaveDrop(props: SingleWaveDropProps) {
  const drop = useCompetitionDrop(props.drop);
  return <SingleWaveDropContent {...props} drop={drop} />;
}

export const SingleWaveDrop: React.FC<SingleWaveDropProps> = (props) =>
  isMultiCompetitionEnabled() ? (
    <CompetitionSingleWaveDrop {...props} />
  ) : (
    <SingleWaveDropContent {...props} />
  );

const SingleWaveDropContent: React.FC<SingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const { SingleWaveDrop: SingleWaveDropRenderer } =
    useWaveSingleWaveDropRendererSet(initialDrop.wave.id);

  return <SingleWaveDropRenderer drop={initialDrop} onClose={onClose} />;
};
