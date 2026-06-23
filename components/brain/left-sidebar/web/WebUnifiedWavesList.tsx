"use client";

import React, { useRef } from "react";
import { useInfiniteScroll } from "../../../../hooks/useInfiniteScroll";
import UnifiedWavesListEmpty from "../waves/UnifiedWavesListEmpty";
import { UnifiedWavesListLoader } from "../waves/UnifiedWavesListLoader";
import WebUnifiedWavesListWaves from "./WebUnifiedWavesListWaves";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useAuth } from "@/components/auth/Auth";

interface WebUnifiedWavesListProps {
  readonly waves: MinimalWave[];
  readonly fetchNextPage: () => void;
  readonly hasNextPage: boolean | undefined;
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onHover: (waveId: string) => void;
  readonly scrollContainerRef: React.RefObject<HTMLElement | null>;
  readonly isCollapsed?: boolean | undefined;
  readonly showProfileFeedShortcut?: boolean | undefined;
}

const WebUnifiedWavesList: React.FC<WebUnifiedWavesListProps> = (props) => {
  const {
    waves,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    onHover,
    scrollContainerRef,
    isCollapsed = false,
    showProfileFeedShortcut = true,
  } = props;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [following] = useShowFollowingWaves();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const isJoinedFilterActive =
    following && !!connectedProfile?.handle && !activeProfileProxy;

  // Use the custom hook for infinite scroll
  useInfiniteScroll(
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    scrollContainerRef,
    sentinelRef,
    "100px"
  );

  return (
    <div className="tw-h-full tw-bg-black tw-py-4">
      <div className="tw-w-full">
        {/* Unified Waves List */}
        <WebUnifiedWavesListWaves
          waves={waves}
          onHover={onHover}
          scrollContainerRef={scrollContainerRef}
          isCollapsed={isCollapsed}
          showProfileFeedShortcut={showProfileFeedShortcut}
          sentinelRef={sentinelRef}
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
          emptyMessage={
            isJoinedFilterActive
              ? t(DEFAULT_LOCALE, "waves.sidebar.joinedEmptyMessage")
              : undefined
          }
        />
      </div>
    </div>
  );
};

export default WebUnifiedWavesList;
