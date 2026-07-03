"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { useWaveDropsLeaderboard } from "@/hooks/useWaveDropsLeaderboard";
import React from "react";
import { WaveLeaderboardDrop } from "./WaveLeaderboardDrop";
import { WaveLeaderboardEmptyState } from "./WaveLeaderboardEmptyState";
import { WaveLeaderboardLoading } from "./WaveLeaderboardLoading";
import { WaveLeaderboardLoadingBar } from "./WaveLeaderboardLoadingBar";

interface WaveLeaderboardDropsProps {
  readonly wave: ApiWave;
  readonly sort: WaveDropsLeaderboardSort;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly onCreateDrop?: (() => void) | undefined;
  readonly minPrice?: number | undefined;
  readonly maxPrice?: number | undefined;
  readonly priceCurrency?: string | undefined;
}

export const WaveLeaderboardDrops: React.FC<WaveLeaderboardDropsProps> = ({
  wave,
  sort,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  onDropClick,
  onCreateDrop,
  minPrice,
  maxPrice,
  priceCurrency,
}) => {
  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useWaveDropsLeaderboard({
    waveId: wave.id,
    sort,
    minPrice,
    maxPrice,
    priceCurrency,
  });

  const handleSourceDropDeleted = React.useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleIntersection = React.useCallback(() => {
    if (!hasNextPage || isFetching || isFetchingNextPage) {
      return;
    }

    fetchNextPage().catch(() => undefined);
  }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]);
  const intersectionElementRef = useIntersectionObserver(handleIntersection);

  if (isFetching && drops.length === 0) {
    return <WaveLeaderboardLoading />;
  }

  if (drops.length === 0) {
    return (
      <WaveLeaderboardEmptyState onCreateDrop={onCreateDrop} wave={wave} />
    );
  }

  return (
    <div className="tw-space-y-4">
      {drops.map((drop) => (
        <WaveLeaderboardDrop
          key={drop.id}
          drop={drop}
          wave={wave}
          onDropClick={onDropClick}
          onSourceDropDeleted={handleSourceDropDeleted}
          isVotingClosed={isVotingClosed}
          isVotingControlsLocked={isVotingControlsLocked}
        />
      ))}
      {isFetchingNextPage && <WaveLeaderboardLoadingBar />}
      <div ref={intersectionElementRef}></div>
    </div>
  );
};
