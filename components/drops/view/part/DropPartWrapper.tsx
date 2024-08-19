import { DropPart } from "../../../../generated/models/DropPart";
import DropPartDiscussion from "./actions/discussion/DropPartDiscussion";
import DropPartActionTriggers from "./actions/DropPartActionTriggers";
import { useEffect, useState } from "react";
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
  readonly isDiscussionOpen: boolean;
  readonly size?: DropPartSize;
  readonly onContentClick?: () => void;
  readonly onDiscussionButtonClick: () => void;
  readonly children: React.ReactNode;
}

export default function DropPartWrapper({
  drop,
  dropPart,
  voteState,
  canVote,
  availableCredit,
  dropReplyDepth,
  isDiscussionOpen,
  size = DropPartSize.MEDIUM,
  onContentClick,
  onDiscussionButtonClick,
  children,
}: DropPartWrapperProps) {
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

  const onDiscussionOpen = () => {
    if (!dropPart.replies_count) {
      return;
    }
    onDiscussionButtonClick();
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
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [repliesIntent, setRepliesIntent] = useState<"tw-pl-12" | "tw-pl-0">(
    "tw-pl-0"
  );

  useEffect(() => {
    if (repliesOpen) {
      setRepliesIntent("tw-pl-0");
      return;
    }
    setRepliesIntent("tw-pl-12");
  }, [dropReplyDepth, repliesOpen]);

  const replyInputIntent = "tw-pl-12";
  return (
    <div>
      <div className="tw-flex tw-w-full tw-h-full">
        <div className="tw-flex tw-flex-col tw-justify-between tw-h-full tw-w-full tw-relative">
          
          <div className="tw-absolute tw-top-2 tw-left-[2.15rem] tw-bottom-0 tw-flex tw-flex-col tw-items-center tw-pr-4">
            {/*  <div className="tw-w-[38px] tw-h-[38px] tw-rounded-lg tw-bg-white tw-mb-2"></div> */}
            <div
              className={`tw-flex-1 tw-w-[1.5px] tw-bg-iron-700 ${
                showReplyInput || isDiscussionOpen ? "tw-visible" : "tw-hidden"
              }`}
            ></div>
          </div>

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
              size === DropPartSize.SMALL
                ? "sm:tw-ml-[40px]"
                : "sm:tw-ml-[54px]"
            }`}
          >
            {haveData && <DropListItemData drop={drop} />}
          </div>
          <div
            className={`tw-px-4 tw-relative tw-z-10 tw-ml-9 tw-mt-2 ${
              size === DropPartSize.SMALL
                ? "sm:tw-ml-[40px]"
                : "sm:tw-ml-[54px]"
            }`}
          >
            <DropPartActionTriggers
              drop={drop}
              dropPart={dropPart}
              voteState={voteState}
              canVote={canVote}
              availableCredit={availableCredit ?? 0}
              onDiscussionButtonClick={onDiscussionOpen}
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
                  setShowReplyInput(false);
                  onDiscussionButtonClick();
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
                setRepliesOpen={setRepliesOpen}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
