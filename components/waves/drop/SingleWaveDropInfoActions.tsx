import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../generated/models/ApiWave";
import { SingleWaveDropTime } from "./SingleWaveDropTime";
import { SingleWaveDropVote } from "./SingleWaveDropVote";
import { SingleWaveDropVotes } from "./SingleWaveDropVotes";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";

interface SingleWaveDropInfoActionsProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
}

export const SingleWaveDropInfoActions: React.FC<SingleWaveDropInfoActionsProps> = ({
  drop,
  wave,
}) => {
  const { canShowVote } = useDropInteractionRules(drop);
  return (
    <div className="tw-px-6 tw-flex tw-flex-col tw-gap-y-3">
      {wave && <SingleWaveDropTime wave={wave} />}
      {canShowVote && <SingleWaveDropVote drop={drop} />}
      {drop && <SingleWaveDropVotes drop={drop} />}
    </div>
  );
}; 