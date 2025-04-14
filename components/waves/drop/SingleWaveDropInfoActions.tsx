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
  readonly showVotes?: boolean;
  readonly className?: string;
}

export const SingleWaveDropInfoActions: React.FC<
  SingleWaveDropInfoActionsProps
> = ({ drop, wave, showVotes = true, className = "tw-px-6" }) => {
  const { canShowVote, isWinner } = useDropInteractionRules(drop);

  return (
    <div
      className={`tw-flex tw-flex-col tw-gap-y-2 tw-mt-4 ${className}`}
    >
      {/* Display time only for non-winner drops */}
      {wave && !isWinner && <SingleWaveDropTime wave={wave} />}

      {canShowVote && <SingleWaveDropVote drop={drop} />}
      {showVotes && drop && <SingleWaveDropVotes drop={drop} />}
    </div>
  );
};
