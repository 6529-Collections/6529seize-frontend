import React from "react";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import Tippy from "@tippyjs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

interface WaveLeaderboardGalleryItemVotesProgressingProps {
  readonly rating: number | null | undefined;
  readonly realtimeRating: number | null | undefined;
}

export default function WaveLeaderboardGalleryItemVotesProgressing({
  rating,
  realtimeRating,
}: WaveLeaderboardGalleryItemVotesProgressingProps): React.ReactElement | null {
  if (typeof rating !== "number" || typeof realtimeRating !== "number") {
    return null;
  }

  const isProgressing = rating !== realtimeRating;

  if (!isProgressing) {
    return null;
  }

  const isPositiveProgressing = rating < realtimeRating;
  const color = isPositiveProgressing
    ? "tw-text-emerald-400 tw-bg-emerald-950/60"
    : "tw-text-rose-400 tw-bg-rose-950/60";

  const tooltipContent = isPositiveProgressing
    ? `Gradually increasing to ${formatNumberWithCommas(
        realtimeRating
      )} over time`
    : `Gradually decreasing to ${formatNumberWithCommas(
        realtimeRating
      )} over time`;

  return (
    <Tippy content={tooltipContent}>
      <span
        className={`tw-text-xs tw-font-medium tw-ml-0.5 tw-px-1.5 tw-py-0.5 tw-rounded-md tw-flex tw-items-center tw-gap-x-1 ${color}`}
        style={{
          animationDuration: "2s",
        }}
      >
        <FontAwesomeIcon
          icon={faArrowRight}
          className="tw-flex-shrink-0 tw-size-3"
        />
        <span>{formatNumberWithCommas(realtimeRating)}</span>
      </span>
    </Tippy>
  );
}
