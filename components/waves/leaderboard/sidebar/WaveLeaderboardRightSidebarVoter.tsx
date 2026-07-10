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
  readonly voter: ApiWaveVoter;
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
    <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-overflow-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-px-1 tw-py-2.5">
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-flex tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-[0.625rem] tw-font-semibold tw-text-iron-500">
          {position}
        </span>
        <Link
          href={`/${voterProfile}`}
          className="tw-group tw-flex tw-min-w-0 tw-max-w-full tw-flex-1 tw-items-center tw-gap-2 tw-no-underline tw-transition-all tw-duration-300 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-underline desktop-hover:hover:tw-opacity-80"
        >
          {voter.voter.pfp ? (
            <Image
              src={resolveIpfsUrlSync(voter.voter.pfp)}
              alt=""
              width={24}
              height={24}
              className="tw-size-6 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-object-cover tw-ring-1 tw-ring-inset tw-ring-white/10"
            />
          ) : (
            <div className="tw-size-6 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/10" />
          )}
          <UserProfileTooltipWrapper user={voterProfile}>
            <span className="tw-block tw-min-w-0 tw-truncate tw-text-sm tw-font-medium tw-text-iron-200 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-opacity-80">
              {voterProfile}
            </span>
          </UserProfileTooltipWrapper>
        </Link>
      </div>
      <div className="tw-mt-1.5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
        <span className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
          {formatNumberWithCommas(voter.absolute_votes_summed)}{" "}
          {WAVE_VOTING_LABELS[creditType]} {WAVE_VOTE_STATS_LABELS.TOTAL}
        </span>
        <span className="tw-ml-auto tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-tabular-nums">
          {hasPositiveVotes && (
            <span className="tw-whitespace-nowrap tw-text-emerald-400">
              +{formatNumberWithCommas(voter.positive_votes_summed)}
            </span>
          )}
          {hasNegativeVotes && (
            <span className="tw-whitespace-nowrap tw-text-rose-400">
              -{formatNumberWithCommas(voter.negative_votes_summed)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
