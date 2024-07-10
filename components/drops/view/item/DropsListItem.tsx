import { useContext, useEffect, useState } from "react";
import DropListItemData from "./data/DropListItemData";
import DropListItemContent from "./content/DropListItemContent";
import DropListItemRateWrapper from "./rate/DropListItemRateWrapper";
import DropsListItemChallengeBar from "./challenge/DropsListItemChallengeBar";
import DropListItemCreateQuote from "./quote/DropListItemCreateQuote";
import { Drop } from "../../../../generated/models/Drop";
import { getRandomColorWithSeed } from "../../../../helpers/Helpers";
import DropListItemExternalLink from "./utils/DropListItemExternalLink";
import Link from "next/link";
import { AuthContext } from "../../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { ProfileAvailableDropRateResponse } from "../../../../entities/IProfile";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";

export enum DropVoteState {
  NOT_LOGGED_IN = "NOT_LOGGED_IN",
  NO_PROFILE = "NO_PROFILE",
  PROXY = "PROXY",
  AUTHOR = "AUTHOR",
  CANT_VOTE = "CANT_VOTE",
  NO_CREDIT = "NO_CREDIT",
  CAN_VOTE = "CAN_VOTE",
}

export default function DropsListItem({
  drop,
  showFull = false,
  showExternalLink = true,
  isWaveDescriptionDrop = false,
  showWaveInfo = true,
  availableCredit,
}: {
  readonly drop: Drop;
  readonly showFull?: boolean;
  readonly showExternalLink?: boolean;
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
    if (!!availableCredit && !drop.context_profile_context?.rating) {
      return DropVoteState.NO_CREDIT;
    }

    return DropVoteState.CAN_VOTE;
  };

  const getMaxAbsoluteCredit = (): number => {
    const voteState = getVoteState();
    if (voteState !== DropVoteState.CAN_VOTE) {
      return 0;
    }
    const currentRating = Math.abs(drop.context_profile_context?.rating ?? 0);
    return (availableCredit ?? 0) + currentRating;
  };

  const [voteState, setVoteState] = useState<DropVoteState>(getVoteState());
  const [maxAbsoluteCredit, setMaxAbsoluteCredit] = useState<number>(
    getMaxAbsoluteCredit()
  );

  useEffect(() => {
    setVoteState(getVoteState());
    setMaxAbsoluteCredit(getMaxAbsoluteCredit());
  }, [connectedProfile, activeProfileProxy, drop, availableCredit]);

  const [quoteModePartId, setQuoteModePartId] = useState<number | null>(null);
  const haveData = !!drop.mentioned_users.length || !!drop.metadata.length;

  const banner1 =
    drop.author.banner1_color ?? getRandomColorWithSeed(drop.author.handle);
  const banner2 =
    drop.author.banner2_color ?? getRandomColorWithSeed(drop.author.handle);

  const onQuote = (dropPartId: number) => {
    if (dropPartId === quoteModePartId) {
      setQuoteModePartId(null);
    } else {
      setQuoteModePartId(dropPartId);
    }
  };

  return (
    <div className="tw-relative tw-bg-iron-900 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800">
      {/* {isWaveDescriptionDrop ? (
        <div
          className="tw-relative tw-w-full tw-h-7 tw-rounded-t-xl"
          style={{
            background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
          }}
        ></div>
      ) : (
        <DropsListItemChallengeBar
          maxValue={100000}
          current={drop.rating}
          myRate={drop.context_profile_context?.rating ?? null}
        />
      )} */}
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
      <div className="tw-px-4 sm:tw-px-5 tw-pb-4 sm:tw-pb-5 tw-pt-2 sm:tw-pt-3">
        <div className="tw-relative tw-h-full tw-flex tw-justify-between tw-gap-x-4 md:tw-gap-x-6">
          {showWaveInfo && (
            <div className="tw-absolute tw-z-10 tw-right-0 tw-top-1 tw-flex tw-items-center tw-gap-x-2">
              {drop.wave.picture && (
                <img
                  src={drop.wave.picture}
                  alt=""
                  className="tw-rounded-full tw-h-6 tw-w-6 tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700 tw-mx-auto tw-object-cover"
                />
              )}
              <Link
                href={`waves/${drop.wave.id}`}
                className="tw-mb-0 tw-pb-0 tw-no-underline tw-text-xs tw-text-iron-400 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
              >
                {drop.wave.name}
              </Link>
            </div>
          )}
          <div className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col tw-justify-between">
            <DropListItemContent
              drop={drop}
              showFull={showFull}
              onQuote={onQuote}
            />
            {haveData && <DropListItemData drop={drop} />}
          </div>
          <div className="tw-flex tw-flex-col tw-items-center tw-min-h-full">
            {/* {showExternalLink && (
              <DropListItemExternalLink
                drop={drop}
                isWaveDescriptionDrop={isWaveDescriptionDrop}
              />
            )} */}
            <div className="tw-flex-grow tw-flex tw-flex-col tw-justify-center tw-items-center">
              <DropListItemRateWrapper
                drop={drop}
                voteState={voteState}
                maxAbsoluteCredit={maxAbsoluteCredit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
