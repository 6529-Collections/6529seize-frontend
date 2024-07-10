import Tippy from "@tippyjs/react";
import RateClapSolidIcon from "../../../../../utils/icons/RateClapSolidIcon";
import RateClapOutlineIcon from "../../../../../utils/icons/RateClapOutlineIcon";
import { Drop } from "../../../../../../generated/models/Drop";

export default function DropPartActionTriggersVoteVotingsSubmit({
  drop,
}: {
  readonly drop: Drop;
}) {
  return (
    <Tippy content="+1">
      <span>
        {!!drop.context_profile_context?.rating ? (
          <RateClapSolidIcon />
        ) : (
          <RateClapOutlineIcon />
        )}
      </span>
    </Tippy>
  );
}

// TODO
// disabled if not logged in
// disabled if no profile
// disabled if logged in as proxy
// disabled if you are the author
// disabled if not in "can vote"
// disabled if no credit left and not voted
// disabled if no credit left and voted (solid icon)
