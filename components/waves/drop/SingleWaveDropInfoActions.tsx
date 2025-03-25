import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../generated/models/ApiWave";
import { SingleWaveDropTime } from "./SingleWaveDropTime";
import { SingleWaveDropVote } from "./SingleWaveDropVote";
import { SingleWaveDropVotes } from "./SingleWaveDropVotes";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import { WinnerBadge } from "./WinnerBadge";

interface SingleWaveDropInfoActionsProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
  readonly showBadge?: boolean;
  readonly showVotes?: boolean;
  readonly className?: string;
}

/**
 * Component that displays time, voting options, and vote counts for a drop.
 * For winning drops, displays a winner badge instead of the time component.
 */
export const SingleWaveDropInfoActions: React.FC<SingleWaveDropInfoActionsProps> = ({
  drop,
  wave,
  showBadge = true,
  showVotes = true,
  className = "tw-px-6",
}) => {
  const { canShowVote, isWinner } = useDropInteractionRules(drop);
  
  return (
    <div className={`tw-flex tw-flex-col tw-gap-y-2 tw-pb-6 ${className}`}>
      {isWinner 
        ? <WinnerBadge drop={drop} showBadge={showBadge} /> 
        : wave && <SingleWaveDropTime wave={wave} />
      }
      {canShowVote && <SingleWaveDropVote drop={drop} />}
      {showVotes && drop && <SingleWaveDropVotes drop={drop} />}
    </div>
  );
}; 
