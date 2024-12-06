import React from "react";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import { WaveLeaderboardDropAuthor } from "./WaveLeaderboardDropAuthor";

interface WaveLeaderboardDropHeaderProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropHeader: React.FC<
  WaveLeaderboardDropHeaderProps
> = ({ drop }) => {
  return (
    <div className="tw-flex tw-items-center">
      <WaveLeaderboardDropAuthor drop={drop} />
    </div>
  );
};
