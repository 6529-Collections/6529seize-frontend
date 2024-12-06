import { useState } from "react";
import DropListItemContent from "./content/DropListItemContent";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import DropReply, { DropReplyProps } from "./replies/DropReply";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import DropsListItemOptions from "./options/DropsListItemOptions";
import { DropVoteState } from "../../../../hooks/drops/types";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";

export enum DropConnectingLineType {
  NONE = "NONE",
  TOP = "TOP",
  FULL = "FULL",
  BOTTOM = "BOTTOm",
}

export const VOTE_STATE_ERRORS: Record<DropVoteState, string | null> = {
  [DropVoteState.NOT_LOGGED_IN]: "Connect your wallet to rate",
  [DropVoteState.NO_PROFILE]: "Create a profile to rate",
  [DropVoteState.PROXY]: "Proxy can't rate",
  [DropVoteState.AUTHOR]: "You can't rate your own drop",
  [DropVoteState.CANT_VOTE]: "You are not eligible to rate",
  [DropVoteState.NO_CREDIT]: "You don't have enough credit to rate",
  [DropVoteState.CAN_VOTE]: null,
};

export default function DropsListItem({
  drop,
  replyToDrop,
  showWaveInfo = true,
  isReply = false,
  dropReplyDepth = 0,
  connectingLineType = DropConnectingLineType.BOTTOM,
  initialDiscussionOpen = false,
  onDiscussionStateChange,
  onDropDeleted,
}: {
  readonly drop: ApiDrop;
  readonly replyToDrop: ApiDrop | null;
  readonly showWaveInfo?: boolean;
  readonly isReply?: boolean;
  readonly dropReplyDepth?: number;
  readonly connectingLineType?: DropConnectingLineType | null;
  readonly initialDiscussionOpen?: boolean;
  readonly onDiscussionStateChange?: (dropId: string | null) => void;
  readonly onDropDeleted?: () => void;
}) {
  const { canDelete } = useDropInteractionRules(drop);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(
    initialDiscussionOpen
  );

  const getReplyProps = (): DropReplyProps | null => {
    if (replyToDrop) {
      return { reply: replyToDrop };
    }

    if (drop.reply_to?.drop_id) {
      return {
        dropId: drop.reply_to.drop_id,
        partId: drop.reply_to.drop_part_id,
      };
    }

    return null;
  };

  const replyProps = getReplyProps();

  const [randomKey, setRandomKey] = useState(getRandomObjectId());

  const onDiscussionButtonClick = () => {
    if (!isDiscussionOpen) {
      onDiscussionStateChange?.(drop.id);
      setIsDiscussionOpen(true);
    }
    setRandomKey(getRandomObjectId());
  };

  return (
    <div
      className={`${
        !isReply && "tw-rounded-xl tw-overflow-hidden"
      }  tw-relative tw-bg-iron-950 ${
        dropReplyDepth < 2 && ""
      }  tw-transition tw-duration-300 tw-ease-out tw-ring-1 tw-ring-inset tw-ring-iron-800`}
    >
      <div className={`${dropReplyDepth === 0 && "tw-pb-2 tw-pt-2"}`}>
        {replyProps && dropReplyDepth === 0 && (
          <div className="tw-my-1.5">
            <div className="tw-relative tw-flex tw-justify-end">
              <div className="tw-h-6 tw-absolute tw-top-2.5 tw-left-8 tw-border-iron-700 tw-border-0 tw-border-solid tw-border-t-[1.5px] tw-border-l-[1.5px] tw-cursor-pointer tw-w-6 tw-rounded-tl-[12px]"></div>
            </div>
            <DropReply {...replyProps} />
          </div>
        )}
        <div className="tw-relative tw-h-full sm:tw-flex tw-justify-between tw-gap-x-4 md:tw-gap-x-6">
          <div className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col tw-justify-between">
            <DropListItemContent
              key={randomKey}
              drop={drop}
              showWaveInfo={showWaveInfo}
              smallMenuIsShown={canDelete}
              dropReplyDepth={dropReplyDepth}
              isDiscussionOpen={isDiscussionOpen}
              connectingLineType={connectingLineType}
              onDiscussionButtonClick={onDiscussionButtonClick}
            />

            {canDelete && (
              <div className="tw-absolute tw-right-4 tw-top-2.5">
                <DropsListItemOptions
                  drop={drop}
                  onDropDeleted={onDropDeleted}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
