import React, { useContext, useMemo } from "react";
import { WaveWinnersDrop } from "./WaveWinnersDrop";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../../../hooks/useWaveDropsLeaderboard";
import { AuthContext } from "../../../../auth/Auth";
import { useIntersectionObserver } from "../../../../../hooks/useIntersectionObserver";
import { ApiWave } from "../../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";

interface WaveWinnersDropsProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinnersDrops: React.FC<WaveWinnersDropsProps> = ({
  wave,
  onDropClick,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      reverse: false,
      dropsSortBy: WaveDropsLeaderboardSortBy.RANK,
      sortDirection: WaveDropsLeaderboardSortDirection.ASC,
      pollingEnabled: false,
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
        <WaveWinnersDrop
          key={drop.id}
          drop={drop}
          wave={wave}
          onDropClick={onDropClick}
        />
      ))}
      {isFetchingNextPage && (
        <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
          <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
        </div>
      )}
      <div ref={intersectionElementRef}></div>
    </div>
  );
};
