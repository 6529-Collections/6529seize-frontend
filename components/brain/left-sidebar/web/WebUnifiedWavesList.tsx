"use client";
import { useWaveSidebarSearch } from "@/hooks/useWaveSidebarSearch";
import { useWaveDiscoveryViewer } from "@/hooks/useWaveDiscoveryViewer";
import { useWaveSidebarCollection } from "@/hooks/useWaveSidebarCollection";

import React, { useRef } from "react";
import { useInfiniteScroll } from "../../../../hooks/useInfiniteScroll";
import UnifiedWavesListEmpty from "../waves/UnifiedWavesListEmpty";
import { UnifiedWavesListLoader } from "../waves/UnifiedWavesListLoader";
import WebUnifiedWavesListWaves from "./WebUnifiedWavesListWaves";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useAuth } from "@/components/auth/Auth";
import { JoinedWavesListRecovery } from "../waves/JoinedWavesListRecovery";

interface WebUnifiedWavesListProps {
  readonly hasLoadingError?: boolean | undefined;
  readonly retryLoading?: (() => void) | undefined;
  readonly waves: MinimalWave[];
  readonly fetchNextPage: () => void;
  readonly hasNextPage: boolean | undefined;
  readonly isFetching: boolean;
  readonly isPinnedWavesLoading?: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onHover: (waveId: string) => void;
  readonly scrollContainerRef: React.RefObject<HTMLElement | null>;
  readonly isCollapsed?: boolean | undefined;
  readonly showProfileFeedShortcut?: boolean | undefined;
}

const WebUnifiedWavesList: React.FC<WebUnifiedWavesListProps> = (props) => {
  const {
    waves,
    hasLoadingError = false,
    retryLoading,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isPinnedWavesLoading = false,
    isFetchingNextPage,
    onHover,
    scrollContainerRef,
    isCollapsed = false,
    showProfileFeedShortcut = true,
  } = props;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const locale = useBrowserLocale();
  const [savedCollection] = useWaveSidebarCollection();
  const { canUseCollections, key } = useWaveDiscoveryViewer();
  const [search] = useWaveSidebarSearch(key ?? "guest");
  const isSearching = !isCollapsed && Boolean(search.trim());
  const collection = canUseCollections ? savedCollection : "all";
  const collectionFetching =
    isFetching || (collection === "pinned" && isPinnedWavesLoading);
  const [following] = useShowFollowingWaves();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const isJoinedFilterActive =
    following && !!connectedProfile?.handle && !activeProfileProxy;

  // Use the custom hook for infinite scroll
  useInfiniteScroll(
    !hasLoadingError &&
      !isSearching &&
      (isCollapsed || collection !== "pinned") &&
      hasNextPage,
    collectionFetching || isFetchingNextPage,
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
          isLoading={collectionFetching || isFetchingNextPage}
          waves={waves}
          onHover={onHover}
          scrollContainerRef={scrollContainerRef}
          isCollapsed={isCollapsed}
          showProfileFeedShortcut={showProfileFeedShortcut}
          sentinelRef={sentinelRef}
        />

        {/* Loading indicator and intersection trigger */}
        <UnifiedWavesListLoader
          isFetching={!isSearching && collectionFetching && waves.length === 0}
          isFetchingNextPage={!isSearching && isFetchingNextPage}
        />

        {/* Empty state */}
        {!isSearching && !isCollapsed && collection === "joined" && (
          <JoinedWavesListRecovery
            hasError={hasLoadingError}
            hasNextPage={hasNextPage === true}
            isFetching={collectionFetching || isFetchingNextPage}
            onLoadMore={fetchNextPage}
            onRetry={retryLoading ?? fetchNextPage}
          />
        )}
        {!isSearching && !hasLoadingError && (
          <UnifiedWavesListEmpty
            sortedWaves={waves}
            isFetching={collectionFetching}
            isFetchingNextPage={isFetchingNextPage}
            emptyMessage={
              isJoinedFilterActive
                ? t(locale, "waves.sidebar.joinedEmptyMessage")
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
};

export default WebUnifiedWavesList;
