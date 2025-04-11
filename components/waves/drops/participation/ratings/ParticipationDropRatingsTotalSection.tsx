import Tippy from "@tippyjs/react";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { RatingsSectionProps, RatingsData } from "./types";
import VoteBreakdownTooltip from "./tooltips/VoteBreakdownTooltip";
import DropVoteProgressing from "../../../../drops/view/utils/DropVoteProgressing";

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
      <Tippy
        content={<VoteBreakdownTooltip drop={drop} ratingsData={ratingsData} />}
        interactive={true}
        placement="bottom-start"
        appendTo={() => document.body}
        zIndex={1000}
      ></Tippy>
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
          <span className="tw-text-sm tw-font-normal tw-text-iron-400 tw-cursor-help">
            Total {drop.wave.voting_credit_type}
          </span>
        </span>
        <DropVoteProgressing
          current={currentRating}
          projected={drop.rating_prediction}
        />
      </div>
    </div>
  );
}
