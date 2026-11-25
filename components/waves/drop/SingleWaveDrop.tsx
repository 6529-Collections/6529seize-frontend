"use client";

import React from "react";
import { useWaveSingleWaveDropRendererSet } from "./singleWaveDropRendererRegistry";
import type { SingleWaveDropProps } from "../drops/participation/participationRenderer.types";
import { useCompetitionDrop } from "@/hooks/competitions/useCompetitionDrop";
import { WavesMoveScope } from "@/components/waves-move/WavesMoveScope";

function CompetitionSingleWaveDrop(props: SingleWaveDropProps) {
  const drop = useCompetitionDrop(props.drop, { loadDetail: true });
  return <SingleWaveDropContent {...props} drop={drop} />;
}

// The drop's controls follow its wave's part in the move to the 6529
// Network, wherever the drop opens (a wave, notifications, a profile).
export const SingleWaveDrop: React.FC<SingleWaveDropProps> = (props) => (
  <WavesMoveScope
    wave={props.drop.wave}
    waveId={props.drop.wave.id}
    dropId={props.drop.id}
  >
    <CompetitionSingleWaveDrop {...props} />
  </WavesMoveScope>
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
