import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveLeaderboardDropAuthor } from "./WaveLeaderboardDropAuthor";

interface WaveLeaderboardDropHeaderProps {
  readonly drop: ExtendedDrop;
  readonly showAvatar?: boolean | undefined;
}

export const WaveLeaderboardDropHeader: React.FC<
  WaveLeaderboardDropHeaderProps
> = ({ drop, showAvatar = true }) => {
  return (
    <div className="tw-flex tw-min-w-0 tw-items-center">
      <WaveLeaderboardDropAuthor drop={drop} showAvatar={showAvatar} />
    </div>
  );
};
