import React, { useContext, useMemo } from "react";
import { WaveWinnersDrop } from "./WaveWinnersDrop";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { NormalizedWinner } from "../../../../helpers/waves/winners-normalizer";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../../hooks/useWaveDropsLeaderboard";
import { AuthContext } from "../../../auth/Auth";

interface WaveWinnersDropsProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly normalizedWinners?: NormalizedWinner[];
  readonly isLoading?: boolean;
  readonly hasInfiniteLoading?: boolean;
}

export const WaveWinnersDrops: React.FC<WaveWinnersDropsProps> = ({
  wave,
  onDropClick,
  normalizedWinners = [],
  isLoading = false,
  hasInfiniteLoading = false,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  
  // For single-decision waves, we might need to handle infinite loading
  const { 
    drops: leaderboardDrops,
    fetchNextPage, 
    hasNextPage, 
    isFetching, 
    isFetchingNextPage 
  } = useWaveDropsLeaderboard({
    waveId: wave.id,
    connectedProfileHandle: connectedProfile?.profile?.handle,
    reverse: false,
    dropsSortBy: WaveDropsLeaderboardSortBy.RANK,
    sortDirection: WaveDropsLeaderboardSortDirection.ASC,
    pollingEnabled: false,
    enabled: hasInfiniteLoading && normalizedWinners.length === 0
  });

  // Choose the drops source based on props
  const drops = useMemo(() => {
    if (hasInfiniteLoading && normalizedWinners.length === 0) {
      return leaderboardDrops;
    }
    return normalizedWinners.map(winner => winner.drop);
  }, [normalizedWinners, hasInfiniteLoading, leaderboardDrops]);

  // Setup infinite scroll observation
  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasInfiniteLoading && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  // Loading state handling
  if (isLoading || (hasInfiniteLoading && isFetching && !drops.length)) {
    return (
      <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
        <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
      </div>
    );
  }

  // Empty state handling
  if (!drops.length) {
    return (
      <div className="tw-text-center tw-py-4 tw-text-iron-400">
        No winners to display
      </div>
    );
  }
  
  return (
    <div className="tw-space-y-3">
      {drops.map((drop) => (
        <WaveWinnersDrop
          key={drop.id}
          drop={drop}
          wave={wave}
          onDropClick={onDropClick}
        />
      ))}
      
      {/* Loading indicator for infinite scroll */}
      {hasInfiniteLoading && isFetchingNextPage && (
        <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
          <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
        </div>
      )}
      
      {/* Intersection observer element for infinite scroll */}
      {hasInfiniteLoading && <div ref={intersectionElementRef}></div>}
    </div>
  );
};
