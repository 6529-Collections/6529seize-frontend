import { Drop } from "../../../../../generated/models/Drop";
import { DropPart } from "../../../../../generated/models/DropPart";
import { DropVoteState } from "../../item/DropsListItem";
import DropListItemRateGive from "../../item/rate/give/DropListItemRateGive";
import DropPartQuoteButton from "../quote/DropPartQuoteButton";
import DropPartDiscussionButton from "./discussion/DropPartDiscussionButton";
import DropPartActionTriggersVoteVoters from "./vote/DropPartActionTriggersVoteVoters";
import DropPartActionTriggersVoteVotings from "./vote/DropPartActionTriggersVoteVotings";

interface DropPartActionTriggersProps {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly isDiscussionOpen: boolean;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly availableCredit: number | null;
  readonly setIsDiscussionOpen: (open: boolean) => void;
  readonly onQuote: (dropPartId: number) => void;
}

export default function DropPartActionTriggers({
  drop,
  dropPart,
  isDiscussionOpen,
  voteState,
  canVote,
  availableCredit,
  setIsDiscussionOpen,
  onQuote,
}: DropPartActionTriggersProps) {
  return (
    <div className="tw-w-full tw-inline-flex tw-justify-between">
      <div className="tw-px-4 sm:tw-px-0 tw-gap-x-8 tw-flex tw-items-center ">
        <DropPartDiscussionButton
          dropPart={dropPart}
          isDiscussionOpen={isDiscussionOpen}
          setIsDiscussionOpen={setIsDiscussionOpen}
        />
        <DropPartQuoteButton dropPart={dropPart} onQuote={onQuote} />
      </div>
      <div className="tw-inline-flex tw-space-x-4 tw-items-center">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {!!drop.raters_count && (
            <DropPartActionTriggersVoteVoters drop={drop} />
            
          )}
         
          <DropPartActionTriggersVoteVotings drop={drop} />
        </div>
        <DropListItemRateGive
          drop={drop}
          voteState={voteState}
          canVote={canVote}
          availableCredit={availableCredit ?? 0}
        />
      </div>
    </div>
  );
}
