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
      <WaveLeaderboardDropAuthor drop={drop} />
      <div className="tw-flex tw-items-center tw-gap-6">
        <WaveDetailedDropActionsRate drop={drop} />
        {!!drop.rating && <WaveLeaderboardDropRaters drop={drop} />}
      </div>
    </div>
  );
};
