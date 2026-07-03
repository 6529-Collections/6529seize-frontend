"use client";

import React, { useMemo } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveLeaderboardGalleryItem } from "./WaveLeaderboardGalleryItem";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { useWaveDropsLeaderboard } from "@/hooks/useWaveDropsLeaderboard";

interface WaveLeaderboardGalleryProps {
  readonly wave: ApiWave;
  readonly sort: WaveDropsLeaderboardSort;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly minPrice?: number | undefined;
  readonly maxPrice?: number | undefined;
  readonly priceCurrency?: string | undefined;
}

const SORT_ANIMATION_KEYS: Record<WaveDropsLeaderboardSort, number> = {
  RANK: 1,
  PRICE: 2,
  REALTIME_VOTE: 3,
  RATING_PREDICTION: 4,
  TREND: 5,
  MY_REALTIME_VOTE: 6,
  CREATED_AT: 7,
};

export const WaveLeaderboardGallery: React.FC<WaveLeaderboardGalleryProps> = ({
  wave,
  sort,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  onDropClick,
  minPrice,
  maxPrice,
  priceCurrency,
}) => {
  const winningThreshold =
    wave.wave.type === ApiWaveType.Approve ? wave.wave.winning_threshold : null;
  const winningThresholdMinDurationMs =
    wave.wave.type === ApiWaveType.Approve
      ? wave.wave.winning_threshold_min_duration_ms
      : null;
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      sort,
      minPrice,
      maxPrice,
      priceCurrency,
    });

  const [initialSort] = React.useState(sort);
  const animationKey = sort === initialSort ? 0 : SORT_ANIMATION_KEYS[sort];

  // Always use art-focused mode in grid view

  // Filter drops to only include those with media
  const dropsWithMedia = useMemo(() => {
    return drops.filter((drop) => (drop.parts[0]?.media.length ?? 0) > 0);
  }, [drops]);

  const handleLoadMore = React.useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  if (isFetching && dropsWithMedia.length === 0) {
    return (
      <div className="tw-flex tw-h-32 tw-items-center tw-justify-center">
        <div className="tw-text-sm tw-text-iron-500">Loading drops...</div>
      </div>
    );
  }

  if (dropsWithMedia.length === 0) {
    return (
      <div className="tw-flex tw-h-32 tw-items-center tw-justify-center tw-text-sm tw-text-iron-500">
        No drops to show
      </div>
    );
  }

  return (
    <div className="tw-w-full tw-min-w-0 tw-@container">
      <div className="tw-grid tw-w-full tw-min-w-0 tw-items-stretch tw-gap-x-4 tw-gap-y-8 @lg:tw-grid-cols-2 @3xl:tw-grid-cols-3">
        {dropsWithMedia.map((drop) => (
          <WaveLeaderboardGalleryItem
            key={drop.id}
            drop={drop}
            onDropClick={onDropClick}
            activeSort={sort}
            animationKey={animationKey}
            isVotingClosed={isVotingClosed}
            isVotingControlsLocked={isVotingControlsLocked}
            winningThreshold={winningThreshold}
            winningThresholdMinDurationMs={winningThresholdMinDurationMs}
          />
        ))}

        {hasNextPage && (
          <div className="tw-col-span-full tw-mb-2 tw-mt-4 tw-flex tw-justify-center">
            <button
              onClick={handleLoadMore}
              disabled={isFetchingNextPage}
              className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-text-iron-400 tw-transition desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300"
            >
              {isFetchingNextPage ? "Loading more..." : "Load more drops"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
