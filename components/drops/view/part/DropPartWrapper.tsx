import { DropPart } from "../../../../generated/models/DropPart";
import DropPartDiscussion from "./actions/discussion/DropPartDiscussion";

import DropPartActionTriggers from "./actions/DropPartActionTriggers";
import { useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import DropPartQuote from "./quote/DropPartQuote";
import { QuotedDrop } from "../../../../generated/models/QuotedDrop";
import { DropVoteState } from "../item/DropsListItem";

export default function DropPartWrapper({
  drop,
  dropPart,
  isFirstPart,
  voteState,
  canVote,
  onQuote,
  children,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly isFirstPart: boolean;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly onQuote: (dropPartId: number) => void;

  readonly children: React.ReactNode;
}) {
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const quotedDrop: QuotedDrop | null = dropPart.quoted_drop ?? null;
  return (
    <div
      className={`${
        isFirstPart && "tw-min-h-36"
      } tw-flex tw-flex-col tw-justify-between tw-h-full`}
    >
      <div className="tw-flex-1">
        {children}
        <div className="sm:tw-ml-12">
          {quotedDrop && <DropPartQuote quotedDrop={quotedDrop} />}
        </div>
      </div>
      <div className="sm:tw-ml-12">
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
        {isDiscussionOpen && (
          <DropPartDiscussion dropPart={dropPart} drop={drop} />
        )}
      </div>
    </div>
  );
}
