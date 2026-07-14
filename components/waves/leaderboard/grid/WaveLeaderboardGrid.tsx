"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import {
  useWaveDropsLeaderboard,
  WAVE_DROPS_LEADERBOARD_MAX_PAGES,
} from "@/hooks/useWaveDropsLeaderboard";
import React, { useMemo } from "react";
import {
  useLeaderboardLeadingItemCount,
  WaveLeaderboardVirtualizedRows,
} from "../WaveLeaderboardVirtualizedRows";
import {
  useWaveLeaderboardVotingModal,
  WaveLeaderboardVotingModal,
} from "../WaveLeaderboardVotingModal";
import { WaveLeaderboardGridItem } from "./WaveLeaderboardGridItem";

export type WaveLeaderboardGridMode = "compact" | "content_only";

interface WaveLeaderboardGridProps {
  readonly wave: ApiWave;
  readonly sort: WaveDropsLeaderboardSort;
  readonly mode: WaveLeaderboardGridMode;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly minPrice?: number | undefined;
  readonly maxPrice?: number | undefined;
  readonly priceCurrency?: string | undefined;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const getDropId = (drop: ExtendedDrop): string => drop.id;

export const WaveLeaderboardGrid: React.FC<WaveLeaderboardGridProps> = ({
  wave,
  sort,
  mode,
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
  const visibleDropIds = useMemo(
    () => new Set(drops.map((drop) => drop.id)),
    [drops]
  );
  const leadingItemCount = useLeaderboardLeadingItemCount({
    pageMetadata,
    visibleItemIds: visibleDropIds,
    windowKey: queryWindowKey,
  });
  const { votingDrop, openVotingModal, closeVotingModal } =
    useWaveLeaderboardVotingModal(drops, scrollContainerRef);

  if (isFetching && drops.length === 0) {
    return (
      <div
        className="tw-@container"
        role="status"
        aria-label="Loading drops"
        aria-busy="true"
      >
        <div className="tw-grid tw-gap-4 @lg:tw-grid-cols-2 @3xl:tw-grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-950"
            >
              <div className="tw-aspect-square tw-min-h-[14rem] tw-animate-pulse tw-bg-iron-900/80 md:tw-min-h-[15rem]" />
              <div className="tw-space-y-2 tw-px-3 tw-py-3">
                <div className="tw-h-4 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                <div className="tw-h-3 tw-w-1/3 tw-animate-pulse tw-rounded tw-bg-iron-800/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (drops.length === 0) {
    return (
      <div className="tw-flex tw-h-32 tw-items-center tw-justify-center tw-text-sm tw-text-iron-500">
        No drops to show
      </div>
    );
  }

  return (
    <>
      <WaveLeaderboardVirtualizedRows
        items={drops}
        getItemId={getDropId}
        leadingItemCount={leadingItemCount}
        windowKey={queryWindowKey}
        layout="grid"
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
          <WaveLeaderboardGridItem
            drop={drop}
            mode={mode}
            isVotingClosed={isVotingClosed}
            isVotingControlsLocked={isVotingControlsLocked}
            winningThreshold={winningThreshold}
            winningThresholdMinDurationMs={winningThresholdMinDurationMs}
            onDropClick={onDropClick}
            onVoteClick={openVotingModal}
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
