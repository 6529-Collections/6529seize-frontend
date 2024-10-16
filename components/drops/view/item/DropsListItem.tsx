import { useContext, useEffect, useState } from "react";
import DropListItemContent from "./content/DropListItemContent";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { AuthContext } from "../../../auth/Auth";

import DropReply, { DropReplyProps } from "./replies/DropReply";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import DropsListItemOptions from "./options/DropsListItemOptions";

export enum DropVoteState {
  NOT_LOGGED_IN = "NOT_LOGGED_IN",
  NO_PROFILE = "NO_PROFILE",
  PROXY = "PROXY",
  AUTHOR = "AUTHOR",
  CANT_VOTE = "CANT_VOTE",
  NO_CREDIT = "NO_CREDIT",
  CAN_VOTE = "CAN_VOTE",
}

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
  availableCredit,
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
  readonly availableCredit: number | null;
  readonly isReply?: boolean;
  readonly dropReplyDepth?: number;
  readonly connectingLineType?: DropConnectingLineType | null;
  readonly initialDiscussionOpen?: boolean;
  readonly onDiscussionStateChange?: (dropId: string | null) => void;
  readonly onDropDeleted?: () => void;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(
    initialDiscussionOpen
  );

  const getVoteState = () => {
    if (!connectedProfile) {
      return DropVoteState.NOT_LOGGED_IN;
    }
    if (!connectedProfile.profile?.handle) {
      return DropVoteState.NO_PROFILE;
    }
    if (activeProfileProxy) {
      return DropVoteState.PROXY;
    }
    if (connectedProfile.profile.handle === drop.author.handle) {
      return DropVoteState.AUTHOR;
    }
    if (!availableCredit) {
      return DropVoteState.NO_CREDIT;
    }

    return DropVoteState.CAN_VOTE;
  };

  const [voteState, setVoteState] = useState<DropVoteState>(getVoteState());

  useEffect(() => {
    setVoteState(getVoteState());
  }, [connectedProfile, activeProfileProxy, drop, availableCredit]);

  const getCanVote = () => voteState === DropVoteState.CAN_VOTE;
  const [canVote, setCanVote] = useState(getCanVote());
  useEffect(() => setCanVote(getCanVote()), [voteState]);

  const getShowOptions = () => {
    if (!connectedProfile?.profile?.handle) {
      return false;
    }
    if (activeProfileProxy) {
      return false;
    }

    if (
      connectedProfile.profile.handle === drop.author.handle &&
      drop.id === drop.wave.description_drop_id
    ) {
      return false;
    }

    return true;
  };

  const [showOptions, setShowOptions] = useState(getShowOptions());

  useEffect(
    () => setShowOptions(getShowOptions()),
    [connectedProfile, activeProfileProxy]
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
      }  tw-relative tw-bg-iron-900 ${
        dropReplyDepth < 2 && ""
      }  tw-transition tw-duration-300 tw-ease-out`}
    >
      <div className={`${dropReplyDepth === 0 && "tw-pb-2 tw-pt-2"}`}>
        {replyProps && dropReplyDepth === 0 && (
          <div className="tw-mb-1.5">
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
              voteState={voteState}
              canVote={canVote}
              availableCredit={availableCredit}
              showWaveInfo={showWaveInfo}
              smallMenuIsShown={showOptions}
              dropReplyDepth={dropReplyDepth}
              isDiscussionOpen={isDiscussionOpen}
              connectingLineType={connectingLineType}
              onDiscussionButtonClick={onDiscussionButtonClick}
            />

            {showOptions && (
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
