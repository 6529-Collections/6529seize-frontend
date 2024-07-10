import { Drop } from "../../../../../../generated/models/Drop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import RateClapOutlineIcon from "../../../../../utils/icons/RateClapOutlineIcon";
import DropPartActionTriggersVoteVoters from "./DropPartActionTriggersVoteVoters";
import DropPartActionTriggersVoteVotings from "./DropPartActionTriggersVoteVotings";

export default function DropPartActionTriggersVote({
  drop,
}: {
  readonly drop: Drop;
}) {
  return (
    <div className="tw-flex tw-gap-x-4">
      <DropPartActionTriggersVoteVotings drop={drop} />
      {!!drop.raters_count && <DropPartActionTriggersVoteVoters drop={drop} />}
    </div>
  );
}
