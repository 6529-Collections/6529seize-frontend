import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import Tippy from "@tippyjs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

interface MyStreamWaveMyVoteVotesProgressProps {
  readonly rating: number | null | undefined;
  readonly realtimeRating: number | null | undefined;
}

const MyStreamWaveMyVoteVotesProgress: React.FC<MyStreamWaveMyVoteVotesProgressProps> = ({
  rating,
  realtimeRating,
}) => {
  if (typeof rating !== "number" || typeof realtimeRating !== "number") {
    return null;
  }

  const isProgressing = rating !== realtimeRating;
  
  if (!isProgressing) {
    return null;
  }

  const isPositiveProgressing = rating < realtimeRating;
  const color = isPositiveProgressing
    ? "tw-text-emerald-400 tw-bg-emerald-950/40"
    : "tw-text-rose-400 tw-bg-rose-950/40";

  const tooltipContent = isPositiveProgressing
    ? `Gradually increasing to ${formatNumberWithCommas(realtimeRating)} over time`
    : `Gradually decreasing to ${formatNumberWithCommas(realtimeRating)} over time`;

  return (
    <Tippy content={tooltipContent}>
      <span
        className="tw-text-emerald-400 tw-bg-emerald-950/80 tw-text-xs tw-font-medium tw-animate-pulse tw-ml-0.5 tw-px-1.5 tw-py-0.5 tw-rounded-md tw-flex tw-items-center tw-gap-x-1"
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
};

export default MyStreamWaveMyVoteVotesProgress;
