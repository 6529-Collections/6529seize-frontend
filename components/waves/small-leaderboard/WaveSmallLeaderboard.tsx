"use client";

import React, { useMemo } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveDropsLeaderboard } from "@/hooks/useWaveDropsLeaderboard";
import { WaveSmallLeaderboardDrop } from "./WaveSmallLeaderboardDrop";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface WaveSmallLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveSmallLeaderboard: React.FC<WaveSmallLeaderboardProps> = ({
  wave,
  onDropClick,
}) => {
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
    });

  const memoizedDrops = useMemo(() => drops, [drops]);

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  return (
    <div className="tw-p-4">
      <div className="tw-flex tw-flex-col">
        {memoizedDrops.length === 0 && !isFetching ? (
          <div className="tw-py-4 tw-text-center tw-text-iron-400">
            No drops have been made yet in this wave
          </div>
        ) : (
          <ul className="tw-space-y-3 tw-pl-0">
            {memoizedDrops.map((drop) => (
              <WaveSmallLeaderboardDrop
                drop={drop}
                wave={wave}
                key={drop.id}
                onDropClick={onDropClick}
              />
            ))}
          </ul>
        )}
        {isFetchingNextPage && (
          <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
            <div className="tw-size-full tw-animate-loading-bar tw-bg-indigo-400"></div>
          </div>
        )}
        <div ref={intersectionElementRef}></div>
      </div>
    </div>
  );
};
