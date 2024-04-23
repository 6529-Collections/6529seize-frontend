import Tippy from "@tippyjs/react";
import { Drop } from "../../../../../entities/IDrop";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import DropListItemActionsItemWrapper from "./DropListItemActionsItemWrapper";
import DropListItemActionsRateTooltip from "./DropListItemActionsRateTooltip";
import RateClapOutlineIcon from "../../../../utils/icons/RateClapOutlineIcon";
import RateClapSolidIcon from "./RateClapSolidIcon";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import { DropDiscussionExpandableState } from "../DropsListItem";

enum RateStatus {
  POSITIVE = "POSITIVE",
  NEUTRAL = "NEUTRAL",
  NEGATIVE = "NEGATIVE",
}

export default function DropListItemActionsRate({
  drop,
  setState,
}: {
  readonly drop: Drop;
  readonly setState: (state: DropDiscussionExpandableState) => void;
}) {
  const userHaveRated = !!drop.context_profile_context?.rating;
  const getRateStatus = (): RateStatus => {
    if (drop.rating > 0) return RateStatus.POSITIVE;
    if (drop.rating < 0) return RateStatus.NEGATIVE;
    return RateStatus.NEUTRAL;
  };

  const getRateColor = (): string => {
    const rateStatus = getRateStatus();
    switch (rateStatus) {
      case RateStatus.POSITIVE:
        return "tw-text-green";
      case RateStatus.NEGATIVE:
        return "tw-text-red";
      case RateStatus.NEUTRAL:
        return "tw-text-iron-300";
      default:
        assertUnreachable(rateStatus);
        return "";
    }
  };

  return (
    <Tippy
      placement={"top"}
      interactive={true}
      content={
        <DropListItemActionsRateTooltip
          current={drop.rating}
          myRates={drop.context_profile_context?.rating ?? null}
        />
      }
    >
      <div className="-tw-mb-1">
        <DropListItemActionsItemWrapper
          state={DropDiscussionExpandableState.RATES}
          setState={setState}
        >
          <>
            {userHaveRated ? <RateClapSolidIcon /> : <RateClapOutlineIcon />}
            <span className="tw-text-iron-400 tw-hidden sm:tw-block tw-transition tw-ease-out tw-duration-300">
              Rates
            </span>
            {!!drop.rating && (
              <div
                className={`${getRateColor()} tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-xs tw-font-medium`}
              >
                {formatNumberWithCommas(drop.rating)}
              </div>
            )}
          </>
        </DropListItemActionsItemWrapper>
      </div>
    </Tippy>
  );
}
