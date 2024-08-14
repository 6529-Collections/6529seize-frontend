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
import DropListItemQuote from "../item/quote/DropListItemQuote";

export interface DropPartWrapperProps {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly availableCredit: number | null;
  readonly dropReplyDepth: number;
  readonly size?: DropPartSize;
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
  onContentClick,
  children,
}: DropPartWrapperProps) {
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const quotedDrop: QuotedDrop | null = dropPart.quoted_drop ?? null;

  const [quoteModePartId, setQuoteModePartId] = useState<number | null>(null);

  const onQuote = (dropPartId: number | null) => {
    if (dropPartId === quoteModePartId) {
      setQuoteModePartId(null);
    } else {
      setShowReplyInput(false);
      setQuoteModePartId(dropPartId);
    }
  };

  const onDiscussionOpen = (state: boolean) => {
    if (!dropPart.replies_count) {
      return
    }
    setIsDiscussionOpen(state);
    onQuote(null);
  };

  const onReplyButtonClick = () => {
    if (showReplyInput) {
      setShowReplyInput(false);
    } else {
      setQuoteModePartId(null);
      setShowReplyInput(true);
    }
  };

  const haveData = !!drop.mentioned_users.length || !!drop.metadata.length;
  const repliesIntent =
    dropReplyDepth === 0
      ? "tw-pl-0"
      : dropReplyDepth === 1
      ? "tw-pl-[52px]"
      : "tw-pl-8";
  const replyInputIntent = dropReplyDepth > 1 ? "tw-pl-0" : "tw-pl-[52px]";
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
          <div
            className={`tw-relative tw-z-10 ${
              size === DropPartSize.SMALL ? "tw-ml-[0px]" : "tw-ml-[54px]"
            }`}
          >
            {haveData && <DropListItemData drop={drop} />}
          </div>
          <div
            className={`tw-px-4 tw-relative tw-z-10 ${
              size === DropPartSize.SMALL
                ? "tw-ml-[0px]"
                : "tw-ml-[54px] tw-mt-2"
            }`}
          >
            <DropPartActionTriggers
              drop={drop}
              dropPart={dropPart}
              isDiscussionOpen={isDiscussionOpen}
              voteState={voteState}
              canVote={canVote}
              availableCredit={availableCredit ?? 0}
              size={size}
              setIsDiscussionOpen={onDiscussionOpen}
              onQuote={onQuote}
              onReplyButtonClick={onReplyButtonClick}
            />
          </div>
        </div>
      </div>
      {!!(showReplyInput || isDiscussionOpen || quoteModePartId) && (
        <div>
          {quoteModePartId && (
            <div className={replyInputIntent}>
              <DropListItemQuote
                quotedDrop={drop}
                quotedPartId={quoteModePartId}
                init={true}
                onSuccessfulDrop={() => setQuoteModePartId(null)}
              />
            </div>
          )}

          {showReplyInput && (
            <div className={replyInputIntent}>
              <DropReplyInputWrapper
                drop={drop}
                dropPart={dropPart}
                onReply={() => {
                  setShowReplyInput(false)
                  setIsDiscussionOpen(true)
                }}
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
