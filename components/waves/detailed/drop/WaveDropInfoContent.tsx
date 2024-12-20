import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveDropPosition } from "./WaveDropPosition";
import { WaveDropContent } from "./WaveDropContent";
import { ApiDropType } from "../../../../generated/models/ObjectSerializer";

interface WaveDropInfoContentProps {
  readonly drop: ExtendedDrop | undefined;
}

export const WaveDropInfoContent: React.FC<WaveDropInfoContentProps> = ({
  drop,
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-2">
      <div className="tw-px-6">
        {drop?.drop_type === ApiDropType.Participatory && (
          <WaveDropPosition rank={drop.rank} />
        )}
      </div>

      <div className="tw-flex-1 tw-w-full">
        <div className="tw-px-6">
          {drop && <WaveDropContent drop={drop} />}
        </div>
      </div>
    </div>
  );
}; 
