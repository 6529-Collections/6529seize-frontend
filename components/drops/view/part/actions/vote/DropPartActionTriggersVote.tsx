import { Drop } from "../../../../../../generated/models/Drop";
import { DropVoteState } from "../../../item/DropsListItem";
import DropPartActionTriggersVoteVoters from "./DropPartActionTriggersVoteVoters";
import DropPartActionTriggersVoteVotings from "./DropPartActionTriggersVoteVotings";

export default function DropPartActionTriggersVote({
  drop,
  voteState,
  canVote,
}: {
  readonly drop: Drop;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
}) {
  return (
    <div className="tw-flex tw-gap-x-4">
      <DropPartActionTriggersVoteVotings
        drop={drop}
        canVote={canVote}
        voteState={voteState}
      />
      {!!drop.raters_count && <DropPartActionTriggersVoteVoters drop={drop} />}
    </div>
  );
}
