import Tippy from "@tippyjs/react";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { RatingsSectionProps, RatingsData } from "./types";
import VoteBreakdownTooltip from "./tooltips/VoteBreakdownTooltip";
import DropVoteProgressing from "../../../../drops/view/utils/DropVoteProgressing";

interface ParticipationDropRatingsTotalSectionProps extends RatingsSectionProps {
  readonly ratingsData: RatingsData;
}

export default function ParticipationDropRatingsTotalSection({
  drop,
  theme,
  ratingsData,
}: ParticipationDropRatingsTotalSectionProps) {
  const { currentRating } = ratingsData;

  return (
    <div className="tw-flex tw-items-center tw-gap-x-1">
      <Tippy
        content={<VoteBreakdownTooltip drop={drop} ratingsData={ratingsData} />}
        interactive={true}
        placement="bottom-start"
        appendTo={() => document.body}
        zIndex={1000}
      >
        <span className="tw-text-sm tw-font-medium tw-text-iron-500 tw-cursor-help">
          Total {drop.wave.voting_credit_type}
        </span>
      </Tippy>
      <div className={`tw-relative tw-inline-flex tw-items-center tw-gap-x-1 ${theme.indicator}`}>
        <span
          className={`tw-text-sm tw-font-bold tw-bg-gradient-to-r ${theme.gradient} tw-bg-clip-text tw-text-transparent`}
        >
          {currentRating < 0 && "-"}
          {formatNumberWithCommas(Math.abs(currentRating))}
        </span>
        <DropVoteProgressing current={currentRating} projected={drop.rating_prediction} />
      </div>
    </div>
  );
} 
