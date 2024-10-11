import React, { useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../../auth/Auth";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { ProfileAvailableDropRateResponse } from "../../../../entities/IProfile";
import { DropVoteState } from "../../../drops/view/item/DropsListItem";
import DropListItemRateGive from "../../../drops/view/item/rate/give/DropListItemRateGive";
import { Drop } from "../../../../generated/models/Drop";

interface WaveDetailedDropActionsRateProps {
  drop: Drop;
  readonly onRated?: () => void;
  isMobile?: boolean;
}

const WaveDetailedDropActionsRate: React.FC<
  WaveDetailedDropActionsRateProps
> = ({ drop, onRated, isMobile = false }) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const { data: availableRateResponse } =
    useQuery<ProfileAvailableDropRateResponse>({
      queryKey: [
        QueryKey.PROFILE_AVAILABLE_DROP_RATE,
        connectedProfile?.profile?.handle,
      ],
      queryFn: async () =>
        await commonApiFetch<ProfileAvailableDropRateResponse>({
          endpoint: `profiles/${connectedProfile?.profile?.handle}/drops/available-credit-for-rating`,
        }),
      enabled: !!connectedProfile?.profile?.handle && !activeProfileProxy,
    });

  const [availableCredit, setAvailableCredit] = useState<number | null>(
    availableRateResponse?.available_credit_for_rating ?? null
  );

  useEffect(() => {
    setAvailableCredit(
      availableRateResponse?.available_credit_for_rating ?? null
    );
  }, [availableRateResponse]);

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
            availableCredit={availableCredit ?? 0}
            onRated={onRated}
            isMobile={isMobile}
          />
        </div>
      )}
    </>
  );
};

export default WaveDetailedDropActionsRate;
