import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";
import { SingleWaveDropVote } from "../../drop/SingleWaveDropVote";
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
        <div className="tw-px-4 md:tw-px-6 tw-pt-4 tw-border-t tw-border-iron-800/30">
          <SingleWaveDropVote drop={drop} />
        </div>
      )}

      {!!drop.raters_count && (
        <div className="tw-px-4 md:tw-px-6 tw-pt-4 tw-border-t tw-border-iron-800/30">
          <ParticipationDropRatings drop={drop} rank={drop.rank} />
        </div>
      )}
    </>
  );
}
