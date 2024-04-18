import { DropFull } from "../../../../entities/IDrop";
import { useState } from "react";
import DropListItemData from "./data/DropListItemData";
import DropListItemActions from "./action/DropListItemActions";
import DropWrapper from "../../create/utils/DropWrapper";
import DropListItemContent from "./content/DropListItemContent";
import DropListItemRateWrapper from "./rate/DropListItemRateWrapper";
import DropListItemExpandableWrapper from "./utils/DropListItemExpandableWrapper";
import DropsListItemChallengeBar from "./challenge/DropsListItemChallengeBar";

export enum DropActionExpandable {
  IDLE = "IDLE",
  DISCUSSION = "DISCUSSION",
  QUOTE = "QUOTE",
  RATES = "RATES",
}

export default function DropsListItem({
  drop,
  showFull = false,
  showExternalLink = true,
}: {
  readonly drop: DropFull;
  readonly showFull?: boolean;
  readonly showExternalLink?: boolean;
}) {
  const [rateAction, setRateAction] = useState<DropActionExpandable>(
    DropActionExpandable.IDLE
  );
  const haveData = !!drop.mentioned_users.length || !!drop.metadata.length;

  return (
    <div className="tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-rounded-xl tw-bg-iron-900">
      <DropsListItemChallengeBar
        maxValue={100000}
        current={drop.rep}
        myRate={drop.rep_given_by_input_profile}
      />
      <div className="tw-p-4 sm:tw-p-5">
        <div className="tw-h-full tw-flex tw-justify-between tw-gap-x-4 md:tw-gap-x-6">
          <div className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col tw-justify-between">
            <DropWrapper drop={drop} showExternalLink={showExternalLink}>
              <div className="tw-w-full">
                <DropListItemContent drop={drop} showFull={showFull} />
              </div>
            </DropWrapper>
            {haveData && <DropListItemData drop={drop} />}
            <DropListItemActions
              drop={drop}
              state={rateAction}
              setState={setRateAction}
            />
          </div>
          <DropListItemRateWrapper drop={drop} />
        </div>
      </div>
      <DropListItemExpandableWrapper
        drop={drop}
        state={rateAction}
        setState={setRateAction}
      />
    </div>
  );
}
