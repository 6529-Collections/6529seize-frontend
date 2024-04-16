import Tippy from "@tippyjs/react";
import { DropFull } from "../../../../../entities/IDrop";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { RepActionExpandable } from "../DropsListItem";
import DropListItemActionsItemWrapper from "./DropListItemActionsItemWrapper";
import DropListItemActionsRepTooltip from "./DropListItemActionsRepTooltip";
import RepClapOutlineIcon from "../../../../utils/icons/RepClapOutlineIcon";
import RepClapSolidIcon from "./RepClapSolidIcon";

enum RepStatus {
  POSITIVE = "POSITIVE",
  NEUTRAL = "NEUTRAL",
  NEGATIVE = "NEGATIVE",
}

export default function DropListItemActionsRep({
  drop,
  setState,
}: {
  readonly drop: DropFull;
  readonly setState: (state: RepActionExpandable) => void;
}) {
  const userHaveVoted = !!drop.rep_given_by_input_profile;
  const getRepStatus = (): RepStatus => {
    if (drop.rep > 0) return RepStatus.POSITIVE;
    if (drop.rep < 0) return RepStatus.NEGATIVE;
    return RepStatus.NEUTRAL;
  };

  const getRepColor = (): string => {
    switch (getRepStatus()) {
      case RepStatus.POSITIVE:
        return "tw-text-green";
      case RepStatus.NEGATIVE:
        return "tw-text-red";
      case RepStatus.NEUTRAL:
        return "tw-text-iron-300";
    }
  };

  return (
    <Tippy
      placement={"top"}
      interactive={true}
      content={
        <DropListItemActionsRepTooltip
          current={drop.rep}
          myVotes={drop.rep_given_by_input_profile}
        />
      }
    >
      <div>
        <DropListItemActionsItemWrapper
          state={RepActionExpandable.REP}
          setState={setState}
        >
          <>
            {userHaveVoted ? <RepClapSolidIcon /> : <RepClapOutlineIcon />}
            <span className="tw-text-iron-400 tw-hidden sm:tw-block tw-transition tw-ease-out tw-duration-300">
              Rep
            </span>
            {!!drop.rep && (
              <div
                className={`${getRepColor()} tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-xs tw-font-medium`}
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
