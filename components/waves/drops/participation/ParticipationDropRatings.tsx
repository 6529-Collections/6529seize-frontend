import React from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import ParticipationDropRatingsContainer from "./ratings/ParticipationDropRatingsContainer";

interface ParticipationDropRatingsProps {
  readonly drop: ApiDrop;
  readonly rank?: number | null | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
}

export const ParticipationDropRatings: React.FC<
  ParticipationDropRatingsProps
> = ({
  drop,
  rank = null,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
}) => {
  return (
    <ParticipationDropRatingsContainer
      drop={drop}
      rank={rank}
      winningThreshold={winningThreshold}
      winningThresholdMinDurationMs={winningThresholdMinDurationMs}
      isVotingClosed={isVotingClosed}
    />
  );
};
