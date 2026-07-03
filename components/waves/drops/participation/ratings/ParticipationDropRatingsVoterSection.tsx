import { Tooltip } from "react-tooltip";
import Link from "next/link";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import type { RatingsSectionProps, RatingsData } from "./types";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import ParticipationDropVoteDetailsTrigger from "./ParticipationDropVoteDetailsTrigger";

interface ParticipationDropRatingsVoterSectionProps extends RatingsSectionProps {
  readonly ratingsData: RatingsData;
}

export default function ParticipationDropRatingsVoterSection({
  drop,
  ratingsData,
}: ParticipationDropRatingsVoterSectionProps) {
  const { hasRaters } = ratingsData;

  return (
    <div className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-sm tw-leading-5">
      {hasRaters && (
        <div className="tw-flex tw-items-center -tw-space-x-1.5">
          {drop.top_raters.slice(0, 5).map((rater, index) => {
            if (!rater.profile.pfp) {
              return null;
            }

            const raterLabel =
              rater.profile.handle ?? rater.profile.primary_address;

            return (
              <div key={rater.profile.id}>
                <div
                  className="tw-relative tw-transition-transform hover:tw-z-10 hover:tw-scale-110"
                  style={{ zIndex: drop.top_raters.length - index }}
                  data-tooltip-id={`participation-rater-${rater.profile.id}`}
                >
                  <Link href={`/${raterLabel}`}>
                    {/* Voter avatars can come from arbitrary remote hosts, so this stays unoptimized. */}
                    <img
                      src={getScaledImageUri(
                        rater.profile.pfp,
                        ImageScale.W_AUTO_H_50
                      )}
                      alt={`${raterLabel}'s avatar`}
                      className="tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800 tw-object-contain tw-ring-1 tw-ring-black"
                    />
                  </Link>
                </div>
                <Tooltip
                  id={`participation-rater-${rater.profile.id}`}
                  place="top"
                  offset={8}
                  opacity={1}
                  positionStrategy="fixed"
                  style={TOOLTIP_STYLES}
                >
                  {raterLabel} • {formatNumberWithCommas(rater.rating)}{" "}
                  {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}
                </Tooltip>
              </div>
            );
          })}
          {drop.raters_count > 5 && (
            <div className="tw-relative tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-900 tw-text-[10px] tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-white/10 tw-transition-transform hover:tw-scale-110">
              +{drop.raters_count - 5}
            </div>
          )}
        </div>
      )}

      <ParticipationDropVoteDetailsTrigger drop={drop} />
    </div>
  );
}
