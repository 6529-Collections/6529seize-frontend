import { useState } from "react";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import { ApiDropPart } from "../../../../../generated/models/ApiDropPart";
import { DropVoteState } from "../../item/DropsListItem";
import DropListItemRateGive from "../../item/rate/give/DropListItemRateGive";
import DropPartQuoteButton from "../quote/DropPartQuoteButton";
import DropPartDiscussionButton from "./discussion/DropPartDiscussionButton";
import DropPartReplyButton from "./discussion/DropPartReplyButton";
import DropPartActionTriggersVoteVoters from "./vote/DropPartActionTriggersVoteVoters";
import DropPartActionTriggersVoteVotings from "./vote/DropPartActionTriggersVoteVotings";
import { useCopyToClipboard } from "react-use";

interface DropPartActionTriggersProps {
  readonly drop: ApiDrop;
  readonly dropPart: ApiDropPart;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly availableCredit: number | null;
  readonly onDiscussionButtonClick: () => void;
  readonly onQuote: (dropPartId: number) => void;
  readonly onReplyButtonClick: () => void;
}

export default function DropPartActionTriggers({
  drop,
  dropPart,
  voteState,
  canVote,
  availableCredit,
  onDiscussionButtonClick,
  onQuote,
  onReplyButtonClick,
}: DropPartActionTriggersProps) {
  const [copied, setCopied] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();
  const copyDropLink = () => {
    copyToClipboard(
      `${window.location.protocol}//${window.location.host}/waves/${drop.wave.id}?drop=${drop.serial_no}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tw-w-full tw-inline-flex tw-flex-wrap sm:tw-flex-nowrap tw-gap-y-2 tw-justify-between">
      <div
        className="tw-px-2 sm:tw-px-0 tw-gap-x-6 tw-flex tw-items-center"
      >
        {!!dropPart.replies_count && (
          <DropPartDiscussionButton
            dropPart={dropPart}
            onDiscussionButtonClick={onDiscussionButtonClick}
          />
        )}
        <DropPartReplyButton onReplyButtonClick={onReplyButtonClick} />
        <DropPartQuoteButton dropPart={dropPart} onQuote={onQuote} />
        <button
          type="button"
          title="Copy Link"
          className="tw-text-iron-500 icon tw-p-0 tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-normal tw-transition tw-ease-out tw-duration-300"
          onClick={copyDropLink}
        >
          <svg
            className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
            />
          </svg>
          {copied && (
            <span className="tw-text-primary-400 tw-text-xs tw-font-normal">Copied!</span>
          )}
        </button>
      </div>
      <div className="tw-px-2 sm:tw-px-0 tw-inline-flex tw-space-x-4 tw-items-center">
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
