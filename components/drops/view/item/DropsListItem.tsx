import { useContext, useEffect, useState } from "react";
import DropListItemContent from "./content/DropListItemContent";
import { Drop } from "../../../../generated/models/Drop";
import { AuthContext } from "../../../auth/Auth";
import DropsListItemFollowDrop from "./DropsListItemFollowDrop";
import DropReply, { DropReplyProps } from "./replies/DropReply";

export enum DropVoteState {
  NOT_LOGGED_IN = "NOT_LOGGED_IN",
  NO_PROFILE = "NO_PROFILE",
  PROXY = "PROXY",
  AUTHOR = "AUTHOR",
  CANT_VOTE = "CANT_VOTE",
  NO_CREDIT = "NO_CREDIT",
  CAN_VOTE = "CAN_VOTE",
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
  showFull = false,
  showWaveInfo = true,
  availableCredit,
  isReply = false,
  dropReplyDepth = 0,
}: {
  readonly drop: Drop;
  readonly replyToDrop: Drop | null;
  readonly showFull?: boolean;
  readonly showWaveInfo?: boolean;
  readonly availableCredit: number | null;
  readonly isReply?: boolean;
  readonly dropReplyDepth?: number;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

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
    if (!drop.wave.authenticated_user_eligible_to_vote) {
      return DropVoteState.CANT_VOTE;
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



  const getCanFollow = () => {
    if (!connectedProfile?.profile?.handle) {
      return false;
    }
    if (activeProfileProxy) {
      return false;
    }
    if (drop.author.handle === connectedProfile.profile.handle) {
      return false;
    }
    return true;
  };

  const [canFollow, setCanFollow] = useState(getCanFollow());
  useEffect(
    () => setCanFollow(getCanFollow()),
    [connectedProfile, activeProfileProxy, drop]
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

  return (
    <div
      className={`${
        !isReply &&
        "tw-rounded-xl tw-overflow-hidden tw-border tw-border-solid tw-border-iron-800 tw-transition tw-duration-300 tw-ease-out"
      }  tw-relative tw-bg-iron-900`}
    >
      <div className={`${dropReplyDepth === 0 && 'tw-pb-2'} tw-pt-2`}>
        {replyProps && dropReplyDepth === 0 && (
          <div className="tw-mb-1.5">
            <div className="tw-relative tw-flex tw-justify-end">
              <div className="tw-h-6 tw-absolute tw-top-2.5 tw-left-8 tw-border-iron-700 tw-border-0 tw-border-solid tw-border-t-[2px] tw-border-l-[2px] tw-cursor-pointer tw-w-6 tw-rounded-tl-[12px]"></div>
            </div>
            <DropReply {...replyProps} />
          </div>
        )}
        <div className="tw-relative tw-h-full tw-flex tw-justify-between tw-gap-x-4 md:tw-gap-x-6">
          <div className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col tw-justify-between">
            <DropListItemContent
              drop={drop}
              showFull={showFull}
              voteState={voteState}
              canVote={canVote}
              availableCredit={availableCredit}
              showWaveInfo={showWaveInfo}
              smallMenuIsShown={canFollow}
              dropReplyDepth={dropReplyDepth}
            />
            {canFollow && (
              <div className="tw-absolute tw-right-14">
                <DropsListItemFollowDrop drop={drop} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
