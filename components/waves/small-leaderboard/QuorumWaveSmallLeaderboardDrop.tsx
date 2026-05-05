import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DefaultWaveSmallLeaderboardDrop } from "./DefaultWaveSmallLeaderboardDrop";

interface QuorumWaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly onDropClick: () => void;
}

export const QuorumWaveSmallLeaderboardDrop: React.FC<
  QuorumWaveSmallLeaderboardDropProps
> = ({
  drop,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  onDropClick,
}) => {
  return (
    <DefaultWaveSmallLeaderboardDrop
      drop={drop}
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
      onDropClick={onDropClick}
      contentPresentation="quorumCompact"
    />
  );
};
