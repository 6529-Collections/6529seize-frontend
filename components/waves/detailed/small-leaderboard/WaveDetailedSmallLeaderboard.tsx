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
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
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
    <div className="lg:tw-p-4">
      <div className="tw-flex tw-flex-col">
        {memoizedDrops.length === 0 && !isFetching ? (
          <div className="tw-text-iron-400 tw-text-center tw-py-4">
            No drops have been made yet in this wave
          </div>
        ) : (
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
        )}
        {isFetchingNextPage && (
          <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
            <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
          </div>
        )}
        <div ref={intersectionElementRef}></div>
      </div>
    </div>
  );
};
