import { DropPart } from "../../../../generated/models/DropPart";
import DropPartDiscussion from "./actions/discussion/DropPartDiscussion";
import DropPartActionTriggers from "./actions/DropPartActionTriggers";
import { useEffect, useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import DropPartQuote from "./quote/DropPartQuote";
import { QuotedDrop } from "../../../../generated/models/QuotedDrop";
import { DropConnectingLineType, DropVoteState } from "../item/DropsListItem";
import DropReplyInputWrapper from "../item/replies/input/DropReplyInputWrapper";
import { DropPartSize } from "./DropPart";
import DropListItemQuote from "../item/quote/DropListItemQuote";
import DropInputWrapper from "../../utils/DropInputWrapper";

export interface DropPartWrapperProps {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly availableCredit: number | null;
  readonly dropReplyDepth: number;
  readonly isDiscussionOpen: boolean;
  readonly showWaveInfo?: boolean;
  readonly size?: DropPartSize;
  readonly connectingLineType?: DropConnectingLineType | null;
  readonly onDiscussionButtonClick: () => void;
  readonly onRedropClick?: (serialNo: number) => void;
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
  showWaveInfo = true,
  size = DropPartSize.MEDIUM,
  connectingLineType = DropConnectingLineType.NONE,
  onRedropClick,
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

  const [activeDiscussionDropId, setActiveDiscussionDropId] = useState<
    string | null
  >(null);

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

  const getShowInputLine = (): boolean => {
    return (
      !(connectingLineType === DropConnectingLineType.FULL && !repliesOpen) &&
      !(
        connectingLineType === DropConnectingLineType.BOTTOM &&
        !activeDiscussionDropId
      ) &&
      isDiscussionOpen
    );
  };
  const [showInputLine, setShowInputLine] = useState(getShowInputLine());
  useEffect(
    () => setShowInputLine(getShowInputLine()),
    [connectingLineType, activeDiscussionDropId, isDiscussionOpen, repliesOpen]
  );
  return (
    <div>
      <div className="tw-flex tw-w-full tw-h-full">
        <div className="tw-flex tw-flex-col tw-justify-between tw-h-full tw-w-full tw-relative">
          <div
            className={`${
              connectingLineType === DropConnectingLineType.FULL &&
              !repliesOpen &&
              "tw-h-8"
            } ${
              connectingLineType === DropConnectingLineType.BOTTOM && "tw-pt-8"
            }  tw-absolute tw-z-[1] tw-top-0 tw-left-[2.15rem] tw-bottom-0 tw-flex tw-flex-col tw-items-center`}
          >
            <div
              className={` tw-flex-1 tw-w-[1.5px] tw-bg-iron-700 ${
                (showReplyInput || isDiscussionOpen) &&
                !(
                  connectingLineType === DropConnectingLineType.BOTTOM &&
                  !activeDiscussionDropId
                )
                  ? "tw-visible"
                  : "tw-hidden"
              }`}
            ></div>
          </div>

          <div className="tw-flex-1 tw-px-2 sm:tw-px-4 tw-relative tw-z-20">
            {children}
            <div>
              {quotedDrop && (
                <div>
                  <DropPartQuote
                    quotedDrop={quotedDrop}
                    onRedropClick={onRedropClick}
                  />
                </div>
              )}
            </div>
          </div>

          <div
            className={`tw-ml-9 tw-mt-2 sm:tw-mt-1 ${
              size === DropPartSize.SMALL
                ? "sm:tw-px-4 sm:tw-ml-[40px]"
                : "tw-px-4 sm:tw-ml-[54px]"
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
            <div className="tw-relative">
              {showInputLine && (
                <div
                  className={`tw-absolute tw-top-0 tw-h-full tw-bottom-0 tw-left-[2.15rem] tw-w-[1.5px] tw-bg-iron-700 tw-z-[1]`}
                ></div>
              )}
              <div className={replyInputIntent}>
                <DropInputWrapper drop={drop}>
                  <DropListItemQuote
                    quotedDrop={drop}
                    quotedPartId={quoteModePartId}
                    init={true}
                    onSuccessfulDrop={() => setQuoteModePartId(null)}
                  />
                </DropInputWrapper>
              </div>
            </div>
          )}

          {showReplyInput && (
            <div className="tw-relative">
              {showInputLine && (
                <div
                  className={`tw-absolute tw-top-0 tw-h-full tw-bottom-0 tw-left-[2.15rem] tw-w-[1.5px] tw-bg-iron-700 tw-z-[1]`}
                ></div>
              )}
              <div className={replyInputIntent}>
                <DropInputWrapper drop={drop}>
                  <DropReplyInputWrapper
                    drop={drop}
                    dropPart={dropPart}
                    onReply={() => {
                      setShowReplyInput(false);
                      onDiscussionButtonClick();
                    }}
                  />
                </DropInputWrapper>
              </div>
            </div>
          )}
          {isDiscussionOpen && (
            <div className={repliesIntent}>
              <DropPartDiscussion
                dropPart={dropPart}
                drop={drop}
                availableCredit={availableCredit}
                dropReplyDepth={dropReplyDepth}
                activeDiscussionDropId={activeDiscussionDropId}
                showWaveInfo={showWaveInfo}
                setActiveDiscussionDropId={setActiveDiscussionDropId}
                setRepliesOpen={setRepliesOpen}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
