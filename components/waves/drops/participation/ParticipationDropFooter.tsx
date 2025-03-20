import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";
import { SingleWaveDropVote } from "../../drop/SingleWaveDropVote";
import { ParticipationDropRatings } from "./ParticipationDropRatings";
import { format } from "date-fns";

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
        <div className="tw-px-4 sm:tw-ml-[3.25rem] tw-pt-4 tw-pb-4 tw-border-t tw-border-iron-800/30">
          <SingleWaveDropVote drop={drop} />
        </div>
      )}

      {!!drop.raters_count && (
        <div className="tw-px-4 sm:tw-ml-[3.25rem] tw-pb-4">
          <ParticipationDropRatings drop={drop} rank={drop.rank} />
        </div>
      )}
      
      <div className="tw-px-4 sm:tw-ml-[3.25rem] tw-pb-3 tw-text-[11px] tw-text-iron-500 tw-border-t tw-border-iron-800/30">
        {format(new Date(drop.created_at), "h:mm a · MMM d, yyyy")}
      </div>
    </>
  );
}
