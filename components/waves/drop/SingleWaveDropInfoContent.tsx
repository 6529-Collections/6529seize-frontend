import React from "react";
import { ExtendedDrop, getDropRank } from "../../../helpers/waves/drop.helpers";
import { ApiDropType } from "../../../generated/models/ObjectSerializer";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { SingleWaveDropContent } from "./SingleWaveDropContent";

interface SingleWaveDropInfoContentProps {
  readonly drop: ExtendedDrop | undefined;
}

export const SingleWaveDropInfoContent: React.FC<
  SingleWaveDropInfoContentProps
> = ({ drop }) => {
  const rank = drop ? getDropRank(drop) : null;
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-2">
      <div className="tw-px-6">
        {rank && <SingleWaveDropPosition rank={rank} />}
      </div>

      <div className="tw-flex-1 tw-w-full">
        <div className="tw-px-6">
          {drop && <SingleWaveDropContent drop={drop} />}
        </div>
      </div>
    </div>
  );
};
