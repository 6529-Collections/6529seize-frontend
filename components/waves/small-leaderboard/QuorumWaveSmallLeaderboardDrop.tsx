import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DefaultWaveSmallLeaderboardDrop } from "./DefaultWaveSmallLeaderboardDrop";

interface QuorumWaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly isApproveWave?: boolean | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly outcomesVisible?: boolean | undefined;
  readonly onDropClick: () => void;
}

export const QuorumWaveSmallLeaderboardDrop: React.FC<
  QuorumWaveSmallLeaderboardDropProps
> = ({
  drop,
  isApproveWave = false,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  outcomesVisible = true,
  onDropClick,
}) => {
  return (
    <DefaultWaveSmallLeaderboardDrop
      drop={drop}
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
      isApproveWave={isApproveWave}
      onDropClick={onDropClick}
      contentPresentation="quorumCompact"
      outcomesVisible={outcomesVisible}
    />
  );
};
