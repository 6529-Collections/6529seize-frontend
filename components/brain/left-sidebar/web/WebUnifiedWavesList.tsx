"use client";

import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";
import React, { useRef } from "react";
import { useInfiniteScroll } from "../../../../hooks/useInfiniteScroll";
import UnifiedWavesListEmpty from "../waves/UnifiedWavesListEmpty";
import { UnifiedWavesListLoader } from "../waves/UnifiedWavesListLoader";
import WebUnifiedWavesListWaves, {
  WebUnifiedWavesListWavesHandle,
} from "./WebUnifiedWavesListWaves";

interface WebUnifiedWavesListProps {
  readonly waves: MinimalWave[];
  readonly activeWaveId: string | null;
  readonly fetchNextPage: () => void;
  readonly hasNextPage: boolean | undefined;
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onHover: (waveId: string) => void;
  readonly scrollContainerRef: React.RefObject<HTMLElement | null>;
  readonly isCollapsed?: boolean;
}

const WebUnifiedWavesList: React.FC<WebUnifiedWavesListProps> = ({
  waves,
  activeWaveId,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  onHover,
  scrollContainerRef,
  isCollapsed = false,
}) => {
  // Refs to the scroll container and sentinel
  const listRef = useRef<WebUnifiedWavesListWavesHandle>(null);

  // Use the custom hook for infinite scroll
  useInfiniteScroll(
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    scrollContainerRef,
    listRef.current?.sentinelRef || { current: null },
    "100px"
  );

  return (
    <div className="tw-h-full tw-py-4 tw-bg-black">
      <div className="tw-w-full">
        {/* Unified Waves List */}
        <WebUnifiedWavesListWaves
          ref={listRef}
          waves={waves}
          onHover={onHover}
          scrollContainerRef={scrollContainerRef}
          isCollapsed={isCollapsed}
        />

        {/* Loading indicator and intersection trigger */}
        <UnifiedWavesListLoader
          isFetching={isFetching && waves.length === 0}
          isFetchingNextPage={isFetchingNextPage}
        />

        {/* Empty state */}
        <UnifiedWavesListEmpty
          sortedWaves={waves}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
        />
      </div>
    </div>
  );
};

export default WebUnifiedWavesList;
