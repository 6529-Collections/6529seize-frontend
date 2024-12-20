import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { WaveDropTime } from "./WaveDropTime";
import { WaveDropVote } from "./WaveDropVote";
import { WaveDropVotes } from "./WaveDropVotes";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";

interface WaveDropInfoActionsProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
}

export const WaveDropInfoActions: React.FC<WaveDropInfoActionsProps> = ({
  drop,
  wave,
}) => {
  const { canShowVote } = useDropInteractionRules(drop);
  return (
    <div className="tw-px-6 tw-flex tw-flex-col tw-gap-y-3">
      {wave && <WaveDropTime wave={wave} />}
      {canShowVote && <WaveDropVote drop={drop} />}
      {drop && <WaveDropVotes drop={drop} />}
    </div>
  );
};
