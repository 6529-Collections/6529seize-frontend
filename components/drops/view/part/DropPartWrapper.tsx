import { DropPart } from "../../../../generated/models/DropPart";
import DropPartDiscussion from "./actions/discussion/DropPartDiscussion";
import DropPartActionTriggers from "./actions/DropPartActionTriggers";
import { useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import DropPartQuote from "./quote/DropPartQuote";
import { QuotedDrop } from "../../../../generated/models/QuotedDrop";
import { DropVoteState } from "../item/DropsListItem";
import DropListItemData from "../item/data/DropListItemData";

export interface DropPartWrapperProps {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly availableCredit: number | null;
  readonly onQuote: (dropPartId: number | null) => void;
  readonly children: React.ReactNode;
}

export default function DropPartWrapper({
  drop,
  dropPart,
  voteState,
  canVote,
  availableCredit,
  onQuote,
  children,
}: DropPartWrapperProps) {
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const quotedDrop: QuotedDrop | null = dropPart.quoted_drop ?? null;

  const setQuoteDrop = (dropPartId: number) => {
    setIsDiscussionOpen(false);
    onQuote(dropPartId);
  };

  const onDiscussionOpen = (state: boolean) => {
    setIsDiscussionOpen(state);
    onQuote(null);
  };

  const haveData = !!drop.mentioned_users.length || !!drop.metadata.length;
  return (
    <div>
      <div className="tw-flex tw-w-full tw-h-full">
        <div className="tw-flex tw-flex-col tw-justify-between tw-h-full tw-w-full">
          <div className="tw-flex-1 tw-px-4">
            {children}
            <div className="sm:tw-ml-[3.25rem]">
              {quotedDrop && <DropPartQuote quotedDrop={quotedDrop} />}
            </div>
          </div>
          <div>{haveData && <DropListItemData drop={drop} />}</div>
          <div className="sm:tw-ml-[4.25rem] tw-mt-auto">
            <DropPartActionTriggers
              drop={drop}
              dropPart={dropPart}
              isDiscussionOpen={isDiscussionOpen}
              voteState={voteState}
              canVote={canVote}
              availableCredit={availableCredit ?? 0}
              setIsDiscussionOpen={onDiscussionOpen}
              onQuote={setQuoteDrop}
            />
          </div>
        </div>
      </div>
      {isDiscussionOpen && (
        <DropPartDiscussion dropPart={dropPart} drop={drop} />
      )}
    </div>
  );
}
