import Tippy from "@tippyjs/react";
import { DropFull } from "../../../../../entities/IDrop";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { DropActionExpandable } from "../DropsListItem";
import DropListItemActionsItemWrapper from "./DropListItemActionsItemWrapper";
import DropListItemActionsRateTooltip from "./DropListItemActionsRateTooltip";
import RateClapOutlineIcon from "../../../../utils/icons/RateClapOutlineIcon";
import RateClapSolidIcon from "./RateClapSolidIcon";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";

enum RateStatus {
  POSITIVE = "POSITIVE",
  NEUTRAL = "NEUTRAL",
  NEGATIVE = "NEGATIVE",
}

export default function DropListItemActionsRate({
  drop,
  setState,
}: {
  readonly drop: DropFull;
  readonly setState: (state: DropActionExpandable) => void;
}) {
  const userHaveRated = !!drop.rep_given_by_input_profile;
  const getRateStatus = (): RateStatus => {
    if (drop.rep > 0) return RateStatus.POSITIVE;
    if (drop.rep < 0) return RateStatus.NEGATIVE;
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
          current={drop.rep}
          myRates={drop.rep_given_by_input_profile}
        />
      }
    >
      <div>
        <DropListItemActionsItemWrapper
          state={DropActionExpandable.RATES}
          setState={setState}
        >
          <>
            {userHaveRated ? <RateClapSolidIcon /> : <RateClapOutlineIcon />}
            <span className="tw-text-iron-400 tw-hidden sm:tw-block tw-transition tw-ease-out tw-duration-300">
              Rates
            </span>
            {!!drop.rep && (
              <div
                className={`${getRateColor()} tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-xs tw-font-medium`}
              >
                {formatNumberWithCommas(drop.rep)}
              </div>
            )}
          </>
        </DropListItemActionsItemWrapper>
      </div>
    </Tippy>
  );
}
