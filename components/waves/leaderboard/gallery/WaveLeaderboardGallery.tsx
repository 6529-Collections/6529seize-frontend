"use client";

import React, { useMemo } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveLeaderboardGalleryItem } from "./WaveLeaderboardGalleryItem";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { useWaveDropsLeaderboard } from "@/hooks/useWaveDropsLeaderboard";

interface WaveLeaderboardGalleryProps {
  readonly wave: ApiWave;
  readonly sort: WaveDropsLeaderboardSort;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly curatedByGroupId?: string | undefined;
}

export const WaveLeaderboardGallery: React.FC<WaveLeaderboardGalleryProps> = ({
  wave,
  sort,
  onDropClick,
  curatedByGroupId,
}) => {
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      sort,
      curatedByGroupId,
    });

  // Track when sort changes to signal animation
  const [animationKey, setAnimationKey] = React.useState(0);
  const [previousSort, setPreviousSort] = React.useState(sort);

  React.useEffect(() => {
    if (previousSort !== sort) {
      setPreviousSort(sort);
      setAnimationKey((prev) => prev + 1);
    }
  }, [sort, previousSort]);

  // Always use art-focused mode in grid view

  // Filter drops to only include those with media
  const dropsWithMedia = useMemo(() => {
    return drops.filter((drop) => (drop.parts[0]?.media.length ?? 0) > 0) || [];
  }, [drops]);

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
    <div className="tw-@container">
      <div className="tw-grid tw-gap-x-4 tw-gap-y-8 @lg:tw-grid-cols-2 @3xl:tw-grid-cols-3">
        {dropsWithMedia.map((drop) => (
          <WaveLeaderboardGalleryItem
            key={drop.id}
            drop={drop}
            onDropClick={onDropClick}
            activeSort={sort}
            animationKey={animationKey}
          />
        ))}

        {hasNextPage && (
          <div className="tw-col-span-full tw-mb-2 tw-mt-4 tw-flex tw-justify-center">
            <button
              onClick={() => fetchNextPage()}
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
