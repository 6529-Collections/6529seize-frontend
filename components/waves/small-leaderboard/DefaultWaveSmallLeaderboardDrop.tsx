import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";
import { WaveSmallLeaderboardTopThreeDrop } from "./WaveSmallLeaderboardTopThreeDrop";
import { WaveSmallLeaderboardDefaultDrop } from "./WaveSmallLeaderboardDefaultDrop";

interface DefaultWaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: () => void;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly isApproveWave?: boolean | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly outcomesVisible?: boolean | undefined;
}

export const DefaultWaveSmallLeaderboardDrop: React.FC<
  DefaultWaveSmallLeaderboardDropProps
> = ({
  drop,
  onDropClick,
  contentPresentation = "default",
  isApproveWave = false,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  outcomesVisible = true,
}) => {
  return (
    <div className="tw-cursor-pointer" onClick={onDropClick}>
      {!isApproveWave && typeof drop.rank === "number" && drop.rank <= 3 ? (
        <WaveSmallLeaderboardTopThreeDrop
          drop={drop}
          onDropClick={onDropClick}
          contentPresentation={contentPresentation}
          outcomesVisible={outcomesVisible}
        />
      ) : (
        <WaveSmallLeaderboardDefaultDrop
          drop={drop}
          onDropClick={onDropClick}
          contentPresentation={contentPresentation}
          isApproveWave={isApproveWave}
          isVotingClosed={isVotingClosed}
          isVotingControlsLocked={isVotingControlsLocked}
          outcomesVisible={outcomesVisible}
        />
      )}
    </div>
  );
};
