import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveLeaderboardRendererSet } from "../leaderboard/leaderboardRendererRegistry";
import { isApproveWave } from "@/helpers/waves/approve-wave.helpers";

interface WaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly onDropClick: () => void;
}

export const WaveSmallLeaderboardDrop: React.FC<
  WaveSmallLeaderboardDropProps
> = ({
  drop,
  wave,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  onDropClick,
}) => {
  const { SmallLeaderboardDrop } = useWaveLeaderboardRendererSet(wave.id);

  return (
    <SmallLeaderboardDrop
      drop={drop}
      isApproveWave={isApproveWave(wave)}
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
      onDropClick={onDropClick}
    />
  );
};
