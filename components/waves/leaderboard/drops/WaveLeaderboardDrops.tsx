"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
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
import { WaveLeaderboardDrop } from "./WaveLeaderboardDrop";
import { WaveLeaderboardEmptyState } from "./WaveLeaderboardEmptyState";
import { WaveLeaderboardLoading } from "./WaveLeaderboardLoading";

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
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const getDropId = (drop: ExtendedDrop): string => drop.id;

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
  scrollContainerRef,
}) => {
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
    refetch,
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

  const handleSourceDropDeleted = React.useCallback(() => {
    void refetch();
  }, [refetch]);

  if (isFetching && drops.length === 0) {
    return <WaveLeaderboardLoading />;
  }

  if (drops.length === 0) {
    return (
      <WaveLeaderboardEmptyState onCreateDrop={onCreateDrop} wave={wave} />
    );
  }

  return (
    <>
      <WaveLeaderboardVirtualizedRows
        items={drops}
        getItemId={getDropId}
        leadingItemCount={leadingItemCount}
        windowKey={queryWindowKey}
        layout="list"
        scrollContainerRef={scrollContainerRef}
        fetchNextPage={fetchNextPage}
        fetchPreviousPage={fetchPreviousPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        isFetchingNextPage={isFetchingNextPage}
        isFetchingPreviousPage={isFetchingPreviousPage}
        isFetchNextPageError={isFetchNextPageError}
        isFetchPreviousPageError={isFetchPreviousPageError}
        autoLoadNext
        renderItem={(drop) => (
          <WaveLeaderboardDrop
            drop={drop}
            wave={wave}
            onDropClick={onDropClick}
            onVoteClick={openVotingModal}
            onSourceDropDeleted={handleSourceDropDeleted}
            isVotingClosed={isVotingClosed}
            isVotingControlsLocked={isVotingControlsLocked}
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
