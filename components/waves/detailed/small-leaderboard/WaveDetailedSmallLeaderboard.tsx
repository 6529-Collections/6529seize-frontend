import React, { useContext, useMemo } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { AuthContext } from "../../../auth/Auth";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../../hooks/useWaveDropsLeaderboard";
import { WaveDetailedLeaderboardDrop } from "./WaveDetailedLeaderboardDrop";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import { ExtendedDrop } from "../../../../helpers/waves/wave-drops.helpers";

interface WaveDetailedSmallLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveDetailedSmallLeaderboard: React.FC<
  WaveDetailedSmallLeaderboardProps
> = ({ wave, onDropClick }) => {
  const { connectedProfile } = useContext(AuthContext);
  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    haveNewDrops,
  } = useWaveDropsLeaderboard({
    waveId: wave.id,
    connectedProfileHandle: connectedProfile?.profile?.handle,
    reverse: true,
    dropsSortBy: WaveDropsLeaderboardSortBy.RANK,
    sortDirection: WaveDropsLeaderboardSortDirection.DESC,
  });

  const memoizedDrops = useMemo(() => drops, [drops]);

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  return (
    <div className="tw-p-4 tw-max-h-[30rem] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-700 tw-scrollbar-track-iron-900">
      <h2 className="tw-text-iron-50 tw-text-lg tw-font-semibold tw-mb-3">
        Leaderboard
      </h2>

      <div className="tw-mt-2">
        <div className="tw-flex tw-flex-col">
          <ul className="tw-space-y-3 tw-pl-0">
            {memoizedDrops.map((drop) => (
              <WaveDetailedLeaderboardDrop
                drop={drop}
                wave={wave}
                key={drop.id}
                onDropClick={onDropClick}
              />
            ))}
          </ul>
          {isFetchingNextPage && (
            <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
              <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
            </div>
          )}
          <div ref={intersectionElementRef}></div>
        </div>
      </div>
    </div>
  );
};
