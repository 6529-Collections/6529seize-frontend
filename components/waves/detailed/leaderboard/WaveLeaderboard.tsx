import React, { useMemo, useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { WaveLeaderboardTime } from "./WaveLeaderboardTime";
import { WaveLeaderboardHeader } from "./header/WaveleaderboardHeader";
import { WaveLeaderboardDrops } from "./drops/WaveLeaderboardDrops";
import {
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../../hooks/useWaveDropsLeaderboard";

interface WaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly children: React.ReactNode;
}

export enum WaveLeaderboardSortType {
  RANK = "RANK",
  RECENT = "RECENT",
}

export const WaveLeaderboard: React.FC<WaveLeaderboardProps> = ({
  wave,
  children,
}) => {
  const [sort, setSort] = useState<WaveLeaderboardSortType>(
    WaveLeaderboardSortType.RANK
  );

  const sortBy: Record<WaveLeaderboardSortType, WaveDropsLeaderboardSortBy> = {
    [WaveLeaderboardSortType.RANK]: WaveDropsLeaderboardSortBy.RANK,
    [WaveLeaderboardSortType.RECENT]: WaveDropsLeaderboardSortBy.CREATION_TIME,
  };

  const sortDirection: Record<
    WaveLeaderboardSortType,
    WaveDropsLeaderboardSortDirection
  > = {
    [WaveLeaderboardSortType.RANK]: WaveDropsLeaderboardSortDirection.DESC,
    [WaveLeaderboardSortType.RECENT]: WaveDropsLeaderboardSortDirection.ASC,
  };

  return (
    <div className="tw-w-full tw-ml-[21.5rem] no-scrollbar tw-overflow-y-auto tw-h-[calc(100vh-102px)] tw-pb-6">
      {children}

      <WaveLeaderboardTime wave={wave} />
      <WaveLeaderboardHeader wave={wave} sort={sort} setSort={setSort} />
      <WaveLeaderboardDrops
        wave={wave}
        dropsSortBy={sortBy[sort]}
        sortDirection={sortDirection[sort]}
      />
    </div>
  );
};
