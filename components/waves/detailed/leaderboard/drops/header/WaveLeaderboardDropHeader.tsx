import React from "react";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import { WaveLeaderboardDropAuthor } from "./WaveLeaderboardDropAuthor";
import { WaveLeaderboardDropRaters } from "./WaveleaderboardDropRaters";
import WaveDetailedDropActionsRate from "../../../drops/WaveDetailedDropActionsRate";

interface WaveLeaderboardDropHeaderProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropHeader: React.FC<
  WaveLeaderboardDropHeaderProps
> = ({ drop }) => {
  return (
    <div className="tw-flex tw-justify-between tw-items-start tw-mb-2">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <WaveLeaderboardDropAuthor drop={drop} />
        <div className="tw-flex tw-gap-x-2 tw-items-center">
          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
            15m
          </p>
        </div>
      </div>
      <div className="tw-flex tw-items-center tw-gap-6">
        <WaveDetailedDropActionsRate drop={drop} />
        {!!drop.rating && <WaveLeaderboardDropRaters drop={drop} />}
      </div>
    </div>
  );
};
