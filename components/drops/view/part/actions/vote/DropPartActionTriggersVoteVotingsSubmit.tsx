import Tippy from "@tippyjs/react";
import RateClapSolidIcon from "../../../../../utils/icons/RateClapSolidIcon";
import RateClapOutlineIcon from "../../../../../utils/icons/RateClapOutlineIcon";
import { Drop } from "../../../../../../generated/models/Drop";
import { DropVoteState, VOTE_STATE_ERRORS } from "../../../item/DropsListItem";

export default function DropPartActionTriggersVoteVotingsSubmit({
  drop,
  voteState,
  canVote,
}: {
  readonly drop: Drop;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
}) {
  const tooltipLabel = canVote ? "+1" : VOTE_STATE_ERRORS[voteState];
  const haveVoted = !!drop.context_profile_context?.rating;

  return (
    <Tippy content={tooltipLabel}>
      <div className="-tw-mt-1">{haveVoted ? <RateClapSolidIcon /> : <RateClapOutlineIcon />}</div>
    </Tippy>
  );
}
