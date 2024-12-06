import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { WaveDropVote, WaveDropVoteSize } from "../../drop/WaveDropVote";
import { ParticipationDropRatings } from "./ParticipationDropRatings";

interface ParticipationDropFooterProps {
  readonly drop: ExtendedDrop;
  readonly canShowVote: boolean;
}

export default function ParticipationDropFooter({
  drop,
  canShowVote,
}: ParticipationDropFooterProps) {
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
