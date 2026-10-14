import React from "react";
import type { ApiWaveVoter } from "@/generated/models/ApiWaveVoter";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import Link from "next/link";
import Image from "next/image";
import type { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { getWaveRightPanelProfileIdentifier } from "@/helpers/waves/wave-right-panel.helpers";

interface WaveLeaderboardRightSidebarVoterProps {
  readonly voter: Pick<
    ApiWaveVoter,
    "absolute_votes_summed" | "positive_votes_summed" | "negative_votes_summed"
  > & {
    readonly voter: Pick<
      ApiWaveVoter["voter"],
      "id" | "handle" | "pfp" | "primary_address"
    >;
  };
  readonly position: number;
  readonly creditType: ApiWaveCreditType;
}

export const WaveLeaderboardRightSidebarVoter: React.FC<
  WaveLeaderboardRightSidebarVoterProps
> = ({ voter, position, creditType }) => {
  const hasPositiveVotes = !!voter.positive_votes_summed;
  const hasNegativeVotes = !!voter.negative_votes_summed;
  const voterProfile =
    getWaveRightPanelProfileIdentifier([
      voter.voter.handle,
      voter.voter.primary_address,
      voter.voter.id,
    ]) ?? voter.voter.id.trim();

  return (
    <div className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-900 tw-py-3">
      <span
        className={`tw-w-5 tw-flex-shrink-0 tw-text-xs tw-font-medium tw-tabular-nums ${position <= 3 ? "tw-text-iron-300" : "tw-text-iron-400"}`}
      >
        {position}
      </span>
      <div className="tw-relative tw-flex tw-min-h-11 tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center">
        <Link
          href={`/${voterProfile}`}
          className="tw-group tw-flex tw-min-h-6 tw-min-w-0 tw-items-center tw-rounded-sm tw-pl-10 tw-no-underline tw-transition-opacity tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-opacity-80"
        >
          {voter.voter.pfp ? (
            <Image
              src={resolveIpfsUrlSync(voter.voter.pfp)}
              alt=""
              width={28}
              height={28}
              className="tw-absolute tw-left-0 tw-top-1/2 tw-size-7 -tw-translate-y-1/2 tw-rounded-full tw-bg-iron-800 tw-object-cover tw-ring-1 tw-ring-inset tw-ring-white/10"
            />
          ) : (
            <div className="tw-absolute tw-left-0 tw-top-1/2 tw-size-7 -tw-translate-y-1/2 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/10" />
          )}
          <UserProfileTooltipWrapper user={voterProfile}>
            <span className="tw-block tw-min-w-0 tw-truncate tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-100 desktop-hover:group-hover:tw-underline">
              {voterProfile}
            </span>
          </UserProfileTooltipWrapper>
        </Link>
        <span className="tw-ml-10 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-0.5 tw-text-xs tw-font-medium tw-tabular-nums tw-leading-5">
          {hasPositiveVotes && (
            <span className="tw-break-all tw-text-green">
              +{formatNumberWithCommas(voter.positive_votes_summed)}
            </span>
          )}
          {hasNegativeVotes && (
            <span className="tw-break-all tw-text-red">
              -{formatNumberWithCommas(voter.negative_votes_summed)}
            </span>
          )}
        </span>
      </div>
      <div className="tw-flex tw-max-w-[45%] tw-flex-shrink-0 tw-flex-wrap tw-items-baseline tw-justify-end tw-gap-x-1.5 tw-text-right">
        <span className="tw-break-all tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-100">
          {formatNumberWithCommas(voter.absolute_votes_summed)}
        </span>
        <span className="tw-text-xs tw-leading-5 tw-text-iron-400">
          {WAVE_VOTING_LABELS[creditType]} {WAVE_VOTE_STATS_LABELS.TOTAL}
        </span>
      </div>
    </div>
  );
};
