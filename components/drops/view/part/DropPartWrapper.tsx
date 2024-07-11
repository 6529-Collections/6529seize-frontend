import { DropPart } from "../../../../generated/models/DropPart";
import DropPartDiscussion from "./actions/discussion/DropPartDiscussion";

import DropPartActionTriggers from "./actions/DropPartActionTriggers";
import { useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import DropPartQuote from "./quote/DropPartQuote";
import { QuotedDrop } from "../../../../generated/models/QuotedDrop";
import { DropVoteState } from "../item/DropsListItem";
import DropListItemRateGive from "../item/rate/give/DropListItemRateGive";

export default function DropPartWrapper({
  drop,
  dropPart,
  isFirstPart,
  voteState,
  canVote,
  availableCredit,
  onQuote,
  children,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly isFirstPart: boolean;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly availableCredit: number | null;
  readonly onQuote: (dropPartId: number) => void;
  readonly children: React.ReactNode;
}) {
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const quotedDrop: QuotedDrop | null = dropPart.quoted_drop ?? null;
  return (
    <div>
      <div className="tw-inline-flex tw-w-full">
        <div className="tw-flex tw-flex-col tw-justify-between tw-h-full tw-w-full">
          <div className="tw-flex-1 tw-px-4">
            {children}
            <div className="sm:tw-ml-[3.25rem]">
              {quotedDrop && <DropPartQuote quotedDrop={quotedDrop} />}
            </div>
          </div>
          <div className="sm:tw-ml-[4.25rem]">
            <DropPartActionTriggers
              drop={drop}
              dropPart={dropPart}
              isDiscussionOpen={isDiscussionOpen}
              isFirstPart={isFirstPart}
              voteState={voteState}
              canVote={canVote}
              setIsDiscussionOpen={setIsDiscussionOpen}
              onQuote={onQuote}
            />
          </div>
        </div>
        {isFirstPart && (
          <DropListItemRateGive
            drop={drop}
            voteState={voteState}
            canVote={canVote}
            availableCredit={availableCredit ?? 0}
          />
        )}
      </div>
      {isDiscussionOpen && (
        <DropPartDiscussion dropPart={dropPart} drop={drop} />
      )}
    </div>
  );
}
