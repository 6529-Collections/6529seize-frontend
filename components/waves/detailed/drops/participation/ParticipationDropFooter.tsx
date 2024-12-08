import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { useDropInteractionRules } from "../../../../../hooks/drops/useDropInteractionRules";
import { WaveDropVote, WaveDropVoteSize } from "../../drop/WaveDropVote";
import { ParticipationDropRatings } from "./ParticipationDropRatings";

interface ParticipationDropFooterProps {
  readonly drop: ExtendedDrop;
}

export default function ParticipationDropFooter({
  drop,
}: ParticipationDropFooterProps) {
  const { canShowVote } = useDropInteractionRules(drop);
  return (
    <>
      {canShowVote && (
        <div className="tw-px-6 tw-py-4 tw-border-t tw-border-iron-800/30">
          <WaveDropVote drop={drop} size={WaveDropVoteSize.COMPACT} />
        </div>
      )}

      {!!drop.raters_count && (
        <div className="tw-px-6 tw-py-4 tw-border-t tw-border-iron-800/30">
          <ParticipationDropRatings drop={drop} rank={drop.rank} />
        </div>
      )}
    </>
  );
} 
