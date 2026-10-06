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

interface WebUnifiedWavesListProps {
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
    !isSearching && (isCollapsed || collection !== "pinned") && hasNextPage,
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
        {!isSearching && (
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
