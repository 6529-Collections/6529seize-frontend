import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { WaveDropTime } from "./WaveDropTime";
import { WaveDropVote } from "./WaveDropVote";
import { WaveDropVotes } from "./WaveDropVotes";

interface WaveDropInfoActionsProps {
  readonly drop: ExtendedDrop | undefined;
  readonly wave: ApiWave | null;
  readonly isVotingEligible: boolean;
  readonly isAuthor: boolean;
}

export const WaveDropInfoActions: React.FC<WaveDropInfoActionsProps> = ({
  drop,
  wave,
  isVotingEligible,
  isAuthor,
}) => {
  return (
    <div className="tw-px-6 tw-flex tw-flex-col tw-gap-y-3">
      {wave && <WaveDropTime wave={wave} />}
      {wave &&
        drop &&
        isVotingEligible &&
        !isAuthor && (
          <WaveDropVote drop={drop} />
        )}
      {drop && <WaveDropVotes drop={drop} />}
    </div>
  );
}; 
