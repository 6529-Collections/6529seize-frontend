import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../generated/models/ApiWave";
import { SingleWaveDropTime } from "./SingleWaveDropTime";
import { SingleWaveDropVote } from "./SingleWaveDropVote";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";

interface SingleWaveDropInfoActionsProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
  readonly className?: string;
}

export const SingleWaveDropInfoActions: React.FC<
  SingleWaveDropInfoActionsProps
> = ({ drop, wave, className = "tw-px-6" }) => {
  const { canShowVote, isWinner } = useDropInteractionRules(drop);

  return (
    <div
      className={`tw-flex tw-flex-col tw-gap-y-2 tw-mt-4 tw-border-t tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-b-0 ${className}`}
    >
      {/* Display time only for non-winner drops */}
      {wave && !isWinner && <SingleWaveDropTime wave={wave} />}

      {canShowVote && <SingleWaveDropVote drop={drop} />}
    </div>
  );
};
