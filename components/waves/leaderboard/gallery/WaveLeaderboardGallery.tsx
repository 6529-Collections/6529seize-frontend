"use client";

import React, { useContext, useMemo } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { AuthContext } from "../../../auth/Auth";
import { WaveLeaderboardGalleryItem } from "./WaveLeaderboardGalleryItem";
import {
  WaveDropsLeaderboardSort,
  useWaveDropsLeaderboard,
} from "../../../../hooks/useWaveDropsLeaderboard";

interface WaveLeaderboardGalleryProps {
  readonly wave: ApiWave;
  readonly sort: WaveDropsLeaderboardSort;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardGallery: React.FC<WaveLeaderboardGalleryProps> = ({
  wave,
  sort,
  onDropClick,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.handle ?? null,
      sort,
    });

  // Track when sort changes to signal animation
  const [animationKey, setAnimationKey] = React.useState(0);
  const [previousSort, setPreviousSort] = React.useState(sort);

  React.useEffect(() => {
    if (previousSort !== sort) {
      setPreviousSort(sort);
      setAnimationKey(prev => prev + 1);
    }
  }, [sort, previousSort]);

  // Always use art-focused mode in grid view

  // Filter drops to only include those with media
  const dropsWithMedia = useMemo(() => {
    return drops?.filter(
      (drop) => drop.parts?.[0]?.media?.length > 0
    ) || [];
  }, [drops]);

  if (isFetching && dropsWithMedia.length === 0) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-32">
        <div className="tw-text-iron-500 tw-text-sm">Loading drops...</div>
      </div>
    );
  }

  if (dropsWithMedia.length === 0) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-32 tw-text-iron-500 tw-text-sm">
        No drops to show
      </div>
    );
  }

  return (
    <div className="tw-@container">
      <div className="tw-grid @lg:tw-grid-cols-2 @3xl:tw-grid-cols-3 tw-gap-x-4 tw-gap-y-8">
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
          <div className="tw-col-span-full tw-flex tw-justify-center tw-mt-4 tw-mb-2">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-transition tw-bg-iron-900 tw-text-iron-400 tw-border tw-border-solid tw-border-iron-800 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300">
              {isFetchingNextPage ? "Loading more..." : "Load more drops"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
