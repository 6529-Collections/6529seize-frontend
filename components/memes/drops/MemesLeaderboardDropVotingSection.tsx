import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { SingleWaveDropVote } from "../../waves/drop/SingleWaveDropVote";

interface MemesLeaderboardDropVotingSectionProps {
  readonly drop: ExtendedDrop;
  readonly canShowVote: boolean;
}

export const MemesLeaderboardDropVotingSection: React.FC<MemesLeaderboardDropVotingSectionProps> = ({
  drop,
  canShowVote,
}) => {
  if (!canShowVote) {
    return null;
  }

  return (
    <div className="tw-px-4 tw-pb-4 tw-pt-4 tw-border-t tw-border-iron-800/50 tw-border-solid tw-border-x-0 tw-border-b-0">
      <h4 className="tw-text-xs tw-font-medium tw-text-iron-300 tw-uppercase tw-tracking-wider">
        Vote for this artwork
      </h4>
      <SingleWaveDropVote drop={drop} />
    </div>
  );
};

export default MemesLeaderboardDropVotingSection;