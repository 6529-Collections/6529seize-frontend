import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveSmallLeaderboardTopThreeDrop } from "./WaveSmallLeaderboardTopThreeDrop";
import { WaveSmallLeaderboardDefaultDrop } from "./WaveSmallLeaderboardDefaultDrop";

interface MemesWaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly isApproveWave?: boolean | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly outcomesVisible?: boolean | undefined;
  readonly onDropClick: () => void;
}

export const MemesWaveSmallLeaderboardDrop: React.FC<
  MemesWaveSmallLeaderboardDropProps
> = ({
  drop,
  isApproveWave = false,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  outcomesVisible = true,
  onDropClick,
}) => {
  return (
    <div className="tw-cursor-pointer" onClick={onDropClick}>
      {!isApproveWave && typeof drop.rank === "number" && drop.rank <= 3 ? (
        <WaveSmallLeaderboardTopThreeDrop
          drop={drop}
          onDropClick={onDropClick}
          outcomesVisible={outcomesVisible}
        />
      ) : (
        <WaveSmallLeaderboardDefaultDrop
          drop={drop}
          isVotingClosed={isVotingClosed}
          isVotingControlsLocked={isVotingControlsLocked}
          isApproveWave={isApproveWave}
          onDropClick={onDropClick}
          outcomesVisible={outcomesVisible}
        />
      )}
    </div>
  );
};
