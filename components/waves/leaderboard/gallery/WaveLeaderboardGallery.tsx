"use client";

import React, { useMemo } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveLeaderboardGalleryItem } from "./WaveLeaderboardGalleryItem";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import {
  useWaveDropsLeaderboard,
  WAVE_DROPS_LEADERBOARD_MAX_PAGES,
} from "@/hooks/useWaveDropsLeaderboard";
import {
  useLeaderboardLeadingItemCount,
  WaveLeaderboardVirtualizedRows,
} from "../WaveLeaderboardVirtualizedRows";
import {
  useWaveLeaderboardVotingModal,
  WaveLeaderboardVotingModal,
} from "../WaveLeaderboardVotingModal";

interface WaveLeaderboardGalleryProps {
  readonly wave: ApiWave;
  readonly sort: WaveDropsLeaderboardSort;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly minPrice?: number | undefined;
  readonly maxPrice?: number | undefined;
  readonly priceCurrency?: string | undefined;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const getDropId = (drop: ExtendedDrop): string => drop.id;

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
  scrollContainerRef,
}) => {
  const winningThreshold =
    wave.wave.type === ApiWaveType.Approve ? wave.wave.winning_threshold : null;
  const winningThresholdMinDurationMs =
    wave.wave.type === ApiWaveType.Approve
      ? wave.wave.winning_threshold_min_duration_ms
      : null;
  const {
    drops,
    pageMetadata,
    queryWindowKey,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isFetchNextPageError,
    isFetchPreviousPageError,
  } = useWaveDropsLeaderboard({
    waveId: wave.id,
    sort,
    maxPages: WAVE_DROPS_LEADERBOARD_MAX_PAGES,
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

  const visibleDropIds = useMemo(
    () => new Set(dropsWithMedia.map((drop) => drop.id)),
    [dropsWithMedia]
  );
  const leadingItemCount = useLeaderboardLeadingItemCount({
    pageMetadata,
    visibleItemIds: visibleDropIds,
    windowKey: queryWindowKey,
  });
  const { votingDrop, openVotingModal, closeVotingModal } =
    useWaveLeaderboardVotingModal(dropsWithMedia, scrollContainerRef);

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
    <>
      <WaveLeaderboardVirtualizedRows
        items={dropsWithMedia}
        getItemId={getDropId}
        leadingItemCount={leadingItemCount}
        windowKey={queryWindowKey}
        layout="gallery"
        scrollContainerRef={scrollContainerRef}
        fetchNextPage={fetchNextPage}
        fetchPreviousPage={fetchPreviousPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        isFetchingNextPage={isFetchingNextPage}
        isFetchingPreviousPage={isFetchingPreviousPage}
        isFetchNextPageError={isFetchNextPageError}
        isFetchPreviousPageError={isFetchPreviousPageError}
        renderItem={(drop) => (
          <WaveLeaderboardGalleryItem
            drop={drop}
            onDropClick={onDropClick}
            onVoteClick={openVotingModal}
            activeSort={sort}
            animationKey={animationKey}
            isVotingClosed={isVotingClosed}
            isVotingControlsLocked={isVotingControlsLocked}
            winningThreshold={winningThreshold}
            winningThresholdMinDurationMs={winningThresholdMinDurationMs}
          />
        )}
      />
      <WaveLeaderboardVotingModal
        drop={votingDrop}
        onClose={closeVotingModal}
      />
    </>
  );
};
