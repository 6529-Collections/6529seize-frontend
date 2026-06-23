import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Tooltip } from "react-tooltip";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";
import ApprovalDropVoteSummary from "./ApprovalDropVoteSummary";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import {
  WAVE_VOTING_LABELS,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";

interface WaveDropRatingsProps {
  readonly drop: ApiDrop;
  readonly winningThreshold?: number | null | undefined;
}

const getFallbackAvatarLabel = (label: string) => {
  const withoutHexPrefix = label.replace(/^0x/i, "");
  const source = withoutHexPrefix || label;
  return source.slice(0, 2).toUpperCase();
};

const WaveDropRatings: React.FC<WaveDropRatingsProps> = ({
  drop,
  winningThreshold,
}) => {
  const [activeRaterId, setActiveRaterId] = React.useState<string | null>(null);
  const hasWinningThreshold =
    typeof winningThreshold === "number" &&
    Number.isFinite(winningThreshold) &&
    winningThreshold > 0;

  if (hasWinningThreshold) {
    return (
      <ApprovalDropVoteSummary
        drop={drop}
        winningThreshold={winningThreshold}
        variant="final"
      />
    );
  }

  const totalVote = drop.rating;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const hasUserVoted = userVote !== 0;
  const votingLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const totalVoteClass = totalVote < 0 ? "tw-text-rose-400" : "tw-text-iron-50";
  const userVoteClass = userVote < 0 ? "tw-text-rose-400" : "tw-text-iron-50";

  return (
    <div className="tw-mt-1 tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 tw-text-sm tw-leading-5">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-relative tw-inline-flex tw-items-center tw-gap-x-1.5">
          <span className={`tw-font-medium ${totalVoteClass}`}>
            {formatNumberWithCommas(totalVote)}
          </span>
          <DropVoteProgressing
            current={drop.rating}
            projected={drop.rating_prediction}
            compact
          />
        </div>
        <span className="tw-whitespace-nowrap tw-font-normal tw-text-iron-400">
          {votingLabel} {WAVE_VOTE_STATS_LABELS.TOTAL}
        </span>
      </div>

      <div className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap">
        <div className="tw-flex tw-items-center -tw-space-x-1.5">
          {drop.top_raters.map((rater, index) =>
            (() => {
              const raterLabel =
                rater.profile.handle ?? rater.profile.primary_address;
              const raterHref = `/${raterLabel}`;
              const tooltipId = `wave-drop-rater-${drop.id}-${rater.profile.id}`;
              const fallbackAvatarLabel = getFallbackAvatarLabel(raterLabel);
              const raterTooltipLabel = `${raterLabel} • ${formatNumberWithCommas(rater.rating)} ${votingLabel}`;
              const baseZIndex = drop.top_raters.length - index;
              const zIndex =
                activeRaterId === rater.profile.id
                  ? drop.top_raters.length + 1
                  : baseZIndex;

              return (
                <React.Fragment key={rater.profile.id}>
                  <Link
                    href={raterHref}
                    onClick={(event) => event.stopPropagation()}
                    onMouseEnter={() => setActiveRaterId(rater.profile.id)}
                    onMouseLeave={() => setActiveRaterId(null)}
                    onFocus={() => setActiveRaterId(rater.profile.id)}
                    onBlur={() => setActiveRaterId(null)}
                    aria-label={raterTooltipLabel}
                    title={raterTooltipLabel}
                    data-tooltip-id={tooltipId}
                    className="tw-relative tw-block tw-transition-transform hover:tw-scale-110 focus-visible:tw-rounded-md focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
                    style={{ zIndex }}
                  >
                    {rater.profile.pfp ? (
                      <Image
                        src={getScaledImageUri(
                          rater.profile.pfp,
                          ImageScale.W_AUTO_H_50
                        )}
                        alt={`${raterLabel}'s avatar`}
                        width={20}
                        height={20}
                        className="tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800 tw-object-contain tw-ring-1 tw-ring-black"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-800 tw-text-[9px] tw-font-semibold tw-uppercase tw-text-iron-300 tw-ring-1 tw-ring-black"
                      >
                        {fallbackAvatarLabel}
                      </span>
                    )}
                  </Link>
                  <Tooltip
                    id={tooltipId}
                    place="top"
                    offset={8}
                    opacity={1}
                    positionStrategy="fixed"
                    style={TOOLTIP_STYLES}
                  >
                    {raterLabel} • {formatNumberWithCommas(rater.rating)}{" "}
                    {votingLabel}
                  </Tooltip>
                </React.Fragment>
              );
            })()
          )}
        </div>
        <ParticipationDropVoteDetailsTrigger drop={drop} />
      </div>

      {hasUserVoted && (
        <div className="tw-flex tw-items-center tw-gap-1.5">
          <span className="tw-whitespace-nowrap">
            <span className="tw-font-normal tw-text-iron-400">
              {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:{" "}
            </span>
            <span className={`tw-font-medium ${userVoteClass}`}>
              {userVote < 0 && "-"}
              {formatNumberWithCommas(Math.abs(userVote))} {votingLabel}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default WaveDropRatings;
