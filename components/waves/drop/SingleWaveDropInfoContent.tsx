import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiDropType } from "../../../generated/models/ObjectSerializer";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { SingleWaveDropContent } from "./SingleWaveDropContent";

interface SingleWaveDropInfoContentProps {
  readonly drop: ExtendedDrop | undefined;
}

export const SingleWaveDropInfoContent: React.FC<SingleWaveDropInfoContentProps> = ({
  drop,
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-2">
      <div className="tw-px-6">
        {drop?.drop_type === ApiDropType.Participatory && (
          <SingleWaveDropPosition rank={drop.rank} />
        )}
      </div>

      <div className="tw-flex-1 tw-w-full">
        <div className="tw-px-6">
          {drop && <SingleWaveDropContent drop={drop} />}
        </div>
      </div>
    </div>
  );
}; 