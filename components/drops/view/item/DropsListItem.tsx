import { useContext, useEffect, useState } from "react";
import DropListItemData from "./data/DropListItemData";
import DropListItemContent from "./content/DropListItemContent";
import DropListItemCreateQuote from "./quote/DropListItemCreateQuote";
import { Drop } from "../../../../generated/models/Drop";
import { getRandomColorWithSeed } from "../../../../helpers/Helpers";
import Link from "next/link";
import { AuthContext } from "../../../auth/Auth";
import DropListItemRateGive from "./rate/give/DropListItemRateGive";

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
  [DropVoteState.NOT_LOGGED_IN]: "Connect your wallet to vote",
  [DropVoteState.NO_PROFILE]: "Create a profile to vote",
  [DropVoteState.PROXY]: "Proxy can't vote",
  [DropVoteState.AUTHOR]: "You can't vote for your own drop",
  [DropVoteState.CANT_VOTE]: "You are not eligible to vote",
  [DropVoteState.NO_CREDIT]: "You don't have enough credit to vote",
  [DropVoteState.CAN_VOTE]: null,
};

export default function DropsListItem({
  drop,
  showFull = false,
  isWaveDescriptionDrop = false,
  showWaveInfo = true,
  availableCredit,
}: {
  readonly drop: Drop;
  readonly showFull?: boolean;
  readonly isWaveDescriptionDrop?: boolean;
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
  const haveData = !!drop.mentioned_users.length || !!drop.metadata.length;

  const banner1 =
    drop.author.banner1_color ?? getRandomColorWithSeed(drop.author.handle);
  const banner2 =
    drop.author.banner2_color ?? getRandomColorWithSeed(drop.author.handle);

  const onQuote = (dropPartId: number | null) => {
    if (dropPartId === quoteModePartId) {
      setQuoteModePartId(null);
    } else {
      setQuoteModePartId(dropPartId);
    }
  };

  return (
    <div className="tw-relative tw-bg-iron-900 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800">
      {/* <DropsListItemChallengeBar
        maxValue={100000}
        current={drop.rating}
        myRate={drop.context_profile_context?.rating ?? null}
      /> */}
      {isWaveDescriptionDrop && (
        <div
          className="tw-relative tw-w-full tw-h-7 tw-rounded-t-xl"
          style={{
            background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
          }}
        ></div>
      )}

      <DropListItemCreateQuote
        drop={drop}
        quotedPartId={quoteModePartId}
        onSuccessfulQuote={() => setQuoteModePartId(null)}
      />
      <div className="tw-pb-4 sm:tw-pb-4 tw-pt-2 sm:tw-pt-3">
        <div className="tw-relative tw-h-full tw-flex tw-justify-between tw-gap-x-4 md:tw-gap-x-6">
          {showWaveInfo && (
            <div className="tw-absolute tw-z-10 tw-right-14 tw-top-1.5 tw-flex tw-items-center tw-gap-x-2 tw-group">
              {drop.wave.picture && (
                <img
                  src={drop.wave.picture}
                  alt="Drop wave image"
                  className="tw-rounded-full tw-h-6 tw-w-6 tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700 tw-mx-auto tw-object-cover"
                />
              )}
              <Link
                href={`waves/${drop.wave.id}`}
                className="tw-flex tw-items-center tw-gap-x-1 tw-mb-0 tw-pb-0 tw-no-underline tw-text-xs tw-text-iron-400 group-hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
              >
                <span className="tw-max-w-[272px] tw-truncate">
                  {drop.wave.name}
                </span>
                <svg
                  className="tw-size-5 tw-flex-shrink-0 tw-text-iron-400 group-hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-ou"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 17L17 7M17 7H7M17 7V17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          )}
          <div className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col tw-justify-between">
            <DropListItemContent
              drop={drop}
              showFull={showFull}
              voteState={voteState}
              canVote={canVote}
              availableCredit={availableCredit}
              onQuote={onQuote}
            />
            {haveData && <DropListItemData drop={drop} />}
          </div>
        </div>
      </div>
    </div>
  );
}
