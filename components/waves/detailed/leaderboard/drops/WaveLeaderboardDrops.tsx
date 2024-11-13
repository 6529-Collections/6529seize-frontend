import React, { useContext, useMemo } from "react";
import { ApiWave } from "../../../../../generated/models/ApiWave";
import { AuthContext } from "../../../../auth/Auth";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../../../hooks/useWaveDropsLeaderboard";
import { useIntersectionObserver } from "../../../../../hooks/useIntersectionObserver";
import { WaveLeaderboardDrop } from "./WaveLeaderboardDrop";

interface WaveLeaderboardDropsProps {
  readonly wave: ApiWave;
  readonly dropsSortBy: WaveDropsLeaderboardSortBy;
  readonly sortDirection: WaveDropsLeaderboardSortDirection;
  readonly showMyDrops: boolean;
}

export const WaveLeaderboardDrops: React.FC<WaveLeaderboardDropsProps> = ({
  wave,
  dropsSortBy,
  sortDirection,
  showMyDrops,
}) => {
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
    dropsSortBy,
    sortDirection,
    handle: showMyDrops ? connectedProfile?.profile?.handle : undefined,
  });

  const memoizedDrops = useMemo(() => drops, [drops]);

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  return (
    <div className="tw-space-y-4">
      {memoizedDrops.map((drop) => (
        <WaveLeaderboardDrop key={drop.id} drop={drop} wave={wave} />
      ))}{" "}
      {isFetchingNextPage && (
        <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
          <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
        </div>
      )}
      <div ref={intersectionElementRef}></div>
    </div>
  );
};
