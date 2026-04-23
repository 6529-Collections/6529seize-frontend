"use client";

import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DefaultWaveLeaderboardDrop } from "./DefaultWaveLeaderboardDrop";

interface QuorumWaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const QuorumWaveLeaderboardDrop: React.FC<
  QuorumWaveLeaderboardDropProps
> = ({ drop, onDropClick }) => {
  return (
    <DefaultWaveLeaderboardDrop
      drop={drop}
      onDropClick={onDropClick}
      contentPresentation="quorumCompact"
    />
  );
};
