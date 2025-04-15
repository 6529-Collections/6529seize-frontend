import Tippy from "@tippyjs/react";
import Link from "next/link";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../helpers/image.helpers";
import { RatingsSectionProps, RatingsData } from "./types";

interface ParticipationDropRatingsVoterSectionProps
  extends RatingsSectionProps {
  readonly ratingsData: RatingsData;
}

export default function ParticipationDropRatingsVoterSection({
  drop,
  theme,
  ratingsData,
}: ParticipationDropRatingsVoterSectionProps) {
  const { hasRaters } = ratingsData;

  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      {hasRaters && (
        <div className="tw-flex tw-items-center -tw-space-x-1.5">
          {drop.top_raters.slice(0, 5).map((rater, index) => (
            <Tippy
              key={rater.profile.id}
              content={
                <span className="tw-text-sm tw-font-medium">
                  {rater.profile.handle} •{" "}
                  {formatNumberWithCommas(rater.rating)}{" "}
                  {drop.wave.voting_credit_type}
                </span>
              }
              interactive={true}
              delay={[0, 0]}
              hideOnClick={false}
              appendTo={() => document.body}
              zIndex={1000}
            >
              <div
                className="tw-relative tw-transition-transform hover:tw-scale-110 hover:tw-z-10"
                style={{ zIndex: drop.top_raters.length - index }}
              >
                {rater.profile.pfp && (
                  <Link href={`/${rater.profile.handle}`}>
                    <img
                      src={getScaledImageUri(
                        rater.profile.pfp,
                        ImageScale.W_AUTO_H_50
                      )}
                      alt={`${rater.profile.handle}'s avatar`}
                      className={`tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-object-cover ${theme.ring} tw-bg-iron-900`}
                    />
                  </Link>
                )}
              </div>
            </Tippy>
          ))}
          {drop.raters_count > 5 && (
            <div
              className={`tw-relative tw-h-5 tw-w-5 tw-flex tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-900 tw-ring-1 ${theme.ring} ${theme.text} tw-text-[10px] tw-font-medium hover:tw-scale-110 tw-transition-transform`}
            >
              +{drop.raters_count - 5}
            </div>
          )}
        </div>
      )}

      <span>
        <span
          className={`tw-text-sm tw-font-semibold tw-text-iron-50 ${theme.text}`}
        >
          {drop.raters_count}
        </span>{" "}
        <span className="tw-text-sm tw-font-normal tw-text-iron-500">
          Voters
        </span>
      </span>
    </div>
  );
}
