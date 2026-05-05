import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";
import { WaveSmallLeaderboardTopThreeDrop } from "./WaveSmallLeaderboardTopThreeDrop";
import { WaveSmallLeaderboardDefaultDrop } from "./WaveSmallLeaderboardDefaultDrop";

interface DefaultWaveSmallLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: () => void;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

export const DefaultWaveSmallLeaderboardDrop: React.FC<
  DefaultWaveSmallLeaderboardDropProps
> = ({
  drop,
  onDropClick,
  contentPresentation = "default",
  isVotingClosed = false,
  isVotingControlsLocked = false,
}) => {
  return (
    <div className="tw-cursor-pointer" onClick={onDropClick}>
      {typeof drop.rank === "number" && drop.rank <= 3 ? (
        <WaveSmallLeaderboardTopThreeDrop
          drop={drop}
          onDropClick={onDropClick}
          contentPresentation={contentPresentation}
        />
      ) : (
        <WaveSmallLeaderboardDefaultDrop
          drop={drop}
          onDropClick={onDropClick}
          contentPresentation={contentPresentation}
          isVotingClosed={isVotingClosed}
          isVotingControlsLocked={isVotingControlsLocked}
        />
      )}
    </div>
  );
};
