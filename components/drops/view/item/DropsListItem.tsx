import { useContext, useEffect, useState } from "react";
import DropListItemContent from "./content/DropListItemContent";
import DropListItemCreateQuote from "./quote/DropListItemCreateQuote";
import { Drop } from "../../../../generated/models/Drop";
import { AuthContext } from "../../../auth/Auth";
import DropsListItemFollowDrop from "./DropsListItemFollowDrop";

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
  showFull = false,
  showWaveInfo = true,
  availableCredit,
}: {
  readonly drop: Drop;
  readonly showFull?: boolean;
  readonly showWaveInfo?: boolean;
  readonly availableCredit: number | null;
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

  const [quoteModePartId, setQuoteModePartId] = useState<number | null>(null);

  const onQuote = (dropPartId: number | null) => {
    if (dropPartId === quoteModePartId) {
      setQuoteModePartId(null);
    } else {
      setQuoteModePartId(dropPartId);
    }
  };

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

  return (
    <div className="tw-relative tw-bg-iron-900 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 hover:tw-border-iron-650 tw-transition tw-duration-300 tw-ease-out">
      <DropListItemCreateQuote
        drop={drop}
        quotedPartId={quoteModePartId}
        onSuccessfulQuote={() => setQuoteModePartId(null)}
      />
      <div className="tw-pt-2 sm:tw-pt-3">
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
              onQuote={onQuote}
            />
            {canFollow && (
              <div className="tw-absolute tw-right-10">
                <DropsListItemFollowDrop drop={drop} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
