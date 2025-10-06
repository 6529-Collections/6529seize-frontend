import { Tooltip } from "react-tooltip";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { RatingsSectionProps, RatingsData } from "./types";
import VoteBreakdownTooltip from "./tooltips/VoteBreakdownTooltip";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";

interface ParticipationDropRatingsTotalSectionProps
  extends RatingsSectionProps {
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
      <div
        className={`tw-relative tw-inline-flex tw-items-baseline tw-gap-x-1 ${theme.indicator}`}
      >
        <span>
          <span
            className={`tw-text-sm tw-font-semibold tw-text-iron-50 ${theme.text}`}
          >
            {currentRating < 0 && "-"}
            {formatNumberWithCommas(Math.abs(currentRating))}
          </span>{" "}
          <span 
            className="tw-text-sm tw-font-normal tw-text-iron-400 tw-cursor-help"
            data-tooltip-id={`total-rating-${drop.id}`}
          >
            Total {drop.wave.voting_credit_type}
          </span>
          <Tooltip
            id={`total-rating-${drop.id}`}
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          >
            <VoteBreakdownTooltip drop={drop} ratingsData={ratingsData} />
          </Tooltip>
        </span>
        <DropVoteProgressing
          current={currentRating}
          projected={drop.rating_prediction}
        />
      </div>
    </div>
  );
}
