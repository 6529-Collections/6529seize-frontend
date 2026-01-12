"use client";

import React, { useContext, useMemo, useCallback } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { AuthContext } from "@/components/auth/Auth";
import { useWaveDropsLeaderboard } from "@/hooks/useWaveDropsLeaderboard";
import { WaveSmallLeaderboardDrop } from "./WaveSmallLeaderboardDrop";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";

interface WaveSmallLeaderboardProps {
  readonly wave: ApiWave;
}

export const WaveSmallLeaderboard: React.FC<WaveSmallLeaderboardProps> = ({
  wave,
}) => {
  const waveChatScroll = useWaveChatScrollOptional();
  const { connectedProfile } = useContext(AuthContext);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.handle ?? null,
    });

  const memoizedDrops = useMemo(() => drops, [drops]);

  const handleDropClick = useCallback(
    (serialNo: number) => {
      waveChatScroll?.requestScrollToSerialNo({
        waveId: wave.id,
        serialNo,
      });
    },
    [waveChatScroll, wave.id]
  );

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
                onDropClick={() => handleDropClick(drop.serial_no)}
              />
            ))}
          </ul>
        )}
        {isFetchingNextPage && (
          <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
            <div className="tw-h-full tw-w-full tw-animate-loading-bar tw-bg-indigo-400"></div>
          </div>
        )}
        <div ref={intersectionElementRef}></div>
      </div>
    </div>
  );
};
