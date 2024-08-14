import { DropPart } from "../../../../generated/models/DropPart";
import DropPartDiscussion from "./actions/discussion/DropPartDiscussion";
import DropPartActionTriggers from "./actions/DropPartActionTriggers";
import { useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import DropPartQuote from "./quote/DropPartQuote";
import { QuotedDrop } from "../../../../generated/models/QuotedDrop";
import { DropVoteState } from "../item/DropsListItem";
import DropListItemData from "../item/data/DropListItemData";
import DropReplyInputWrapper from "../item/replies/input/DropReplyInputWrapper";
import { DropPartSize } from "./DropPart";

export interface DropPartWrapperProps {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly availableCredit: number | null;
  readonly dropReplyDepth: number;
  readonly size?: DropPartSize;
  readonly onQuote: (dropPartId: number | null) => void;
  readonly onContentClick?: () => void;
  readonly children: React.ReactNode;
}

export default function DropPartWrapper({
  drop,
  dropPart,
  voteState,
  canVote,
  availableCredit,
  dropReplyDepth,
  size = DropPartSize.MEDIUM,
  onQuote,
  onContentClick,
  children,
}: DropPartWrapperProps) {
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const quotedDrop: QuotedDrop | null = dropPart.quoted_drop ?? null;

  const setQuoteDrop = (dropPartId: number) => {
    setIsDiscussionOpen(false);
    onQuote(dropPartId);
  };

  const onDiscussionOpen = (state: boolean) => {
    setIsDiscussionOpen(state);
    onQuote(null);
  };

  const onReplyButtonClick = () => {
    setShowReplyInput(!showReplyInput);
  };

  const haveData = !!drop.mentioned_users.length || !!drop.metadata.length;
  const repliesIntent = dropReplyDepth === 0 ? "tw-pl-0" : dropReplyDepth === 1 ? "tw-pl-12" : "tw-pl-8";
  const replyInputIntent =dropReplyDepth > 1 ? "tw-pl-0" : "tw-pl-12";
  return (
    <div>
      <div className="tw-flex tw-w-full tw-h-full">
        <div className="tw-flex tw-flex-col tw-justify-between tw-h-full tw-w-full tw-relative">
          <div className="tw-flex-1 tw-px-4 tw-relative tw-z-20">
            {children}
            <div>
              {quotedDrop && (
                <div>
                  <DropPartQuote
                    quotedDrop={quotedDrop}
                    onContentClick={onContentClick}
                  />
                </div>
              )}
            </div>
          </div>
          <div className={`tw-relative tw-z-10 ${size === DropPartSize.SMALL ? "tw-ml-[0px]" : "tw-ml-[54px]"}`}>
            {haveData && <DropListItemData drop={drop} />}
          </div>
          <div className={`tw-px-4  tw-relative tw-z-10 ${size === DropPartSize.SMALL ? "tw-ml-[0px]" : "tw-ml-[54px] tw-mt-2 tw-pb-2"}`}>
            <DropPartActionTriggers
              drop={drop}
              dropPart={dropPart}
              isDiscussionOpen={isDiscussionOpen}
              voteState={voteState}
              canVote={canVote}
              availableCredit={availableCredit ?? 0}
              size={size}
              setIsDiscussionOpen={onDiscussionOpen}
              onQuote={setQuoteDrop}
              onReplyButtonClick={onReplyButtonClick}
            />
          </div>
        </div>
      </div>
      {!!(showReplyInput || isDiscussionOpen) && (
        <div className="tw-pb-2">
          {showReplyInput && (
           <div className={replyInputIntent}>
             <DropReplyInputWrapper
              drop={drop}
              dropPart={dropPart}
              onReply={() => setShowReplyInput(false)}
            />
           </div>
          )}
          {isDiscussionOpen && (
          <div className={repliesIntent}>
              <DropPartDiscussion
              dropPart={dropPart}
              drop={drop}
              availableCredit={availableCredit}
              dropReplyDepth={dropReplyDepth}
            />
          </div>
          )}
        </div>
      )}
    </div>
  );
}
