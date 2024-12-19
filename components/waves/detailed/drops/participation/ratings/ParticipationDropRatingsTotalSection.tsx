import Tippy from "@tippyjs/react";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import { RatingsSectionProps, RatingsData } from "./types";
import VoteBreakdownTooltip from "./tooltips/VoteBreakdownTooltip";

interface ParticipationDropRatingsTotalSectionProps extends RatingsSectionProps {
  readonly ratingsData: RatingsData;
}

export default function ParticipationDropRatingsTotalSection({
  drop,
  theme,
  ratingsData,
}: ParticipationDropRatingsTotalSectionProps) {
  const { totalRating } = ratingsData;

  return (
    <div className="tw-flex tw-flex-col tw-gap-1.5">
      <Tippy
        content={<VoteBreakdownTooltip drop={drop} ratingsData={ratingsData} />}
        interactive={true}
        placement="bottom-start"
        appendTo={() => document.body}
        zIndex={1000}
      >
        <span className="tw-text-xs tw-font-medium tw-text-iron-500 tw-h-5 tw-flex tw-items-center tw-cursor-help">
          Total {drop.wave.voting_credit_type}
        </span>
      </Tippy>
      <div className={`tw-relative tw-inline-flex ${theme.indicator}`}>
        <span
          className={`tw-text-2xl tw-font-bold tw-bg-gradient-to-r ${theme.gradient} tw-bg-clip-text tw-text-transparent`}
        >
          {totalRating < 0 && "-"}
          {formatNumberWithCommas(Math.abs(totalRating))}
        </span>
      </div>
    </div>
  );
} 
