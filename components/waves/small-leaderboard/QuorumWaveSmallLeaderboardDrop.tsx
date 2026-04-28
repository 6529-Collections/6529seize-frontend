import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DefaultWaveSmallLeaderboardDrop } from "./DefaultWaveSmallLeaderboardDrop";

interface QuorumWaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: () => void;
}

export const QuorumWaveSmallLeaderboardDrop: React.FC<
  QuorumWaveSmallLeaderboardDropProps
> = ({ drop, onDropClick }) => {
  return (
    <DefaultWaveSmallLeaderboardDrop
      drop={drop}
      onDropClick={onDropClick}
      contentPresentation="quorumCompact"
    />
  );
};
