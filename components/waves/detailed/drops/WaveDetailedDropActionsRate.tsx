import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../auth/Auth";
import { DropVoteState } from "../../../drops/view/item/DropsListItem";
import DropListItemRateGive from "../../../drops/view/item/rate/give/DropListItemRateGive";
import { ApiDrop } from "../../../../generated/models/ApiDrop";

interface WaveDetailedDropActionsRateProps {
  readonly drop: ApiDrop;
  readonly onRated?: () => void;
  readonly isMobile?: boolean;
}

const WaveDetailedDropActionsRate: React.FC<
  WaveDetailedDropActionsRateProps
> = ({ drop, onRated, isMobile = false }) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const availableCredit = Math.abs(
    (drop.context_profile_context?.max_rating ?? 0) -
      (drop.context_profile_context?.rating ?? 0)
  );

  const getVoteState = (): DropVoteState => {
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

  const getShowClap = (state: DropVoteState): boolean => {
    return (
      state === DropVoteState.CAN_VOTE ||
      state === DropVoteState.CANT_VOTE ||
      state === DropVoteState.NO_CREDIT
    );
  };

  const [showClap, setShowClap] = useState<boolean>(getShowClap(voteState));

  useEffect(() => {
    setShowClap(getShowClap(voteState));
  }, [voteState]);

  return (
    <>
      {showClap && (
        <div className={isMobile ? "tw-p-4 tw-rounded-xl tw-inline-flex" : ""}>
          <DropListItemRateGive
            drop={drop}
            voteState={voteState}
            canVote={canVote}
            onRated={onRated}
            isMobile={isMobile}
          />
        </div>
      )}
    </>
  );
};

export default WaveDetailedDropActionsRate;
