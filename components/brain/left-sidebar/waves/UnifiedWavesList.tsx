"use client";
import { useWaveSidebarSearch } from "@/hooks/useWaveSidebarSearch";
import { useWaveDiscoveryViewer } from "@/hooks/useWaveDiscoveryViewer";
import { useWaveSidebarCollection } from "@/hooks/useWaveSidebarCollection";

import useDeviceInfo from "@/hooks/useDeviceInfo";
import useCreateModalState from "@/hooks/useCreateModalState";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useEffectEvent, useRef } from "react";
import UnifiedWavesListEmpty from "./UnifiedWavesListEmpty";
import { UnifiedWavesListLoader } from "./UnifiedWavesListLoader";
import type { UnifiedWavesListWavesHandle } from "./UnifiedWavesListWaves";
import UnifiedWavesListWaves from "./UnifiedWavesListWaves";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";

interface UnifiedWavesListProps {
  readonly waves: MinimalWave[];
  readonly fetchNextPage: () => void;
  readonly hasNextPage: boolean | undefined;
  readonly isFetching: boolean;
  readonly isPinnedWavesLoading?: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onHover: (waveId: string) => void;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const UnifiedWavesList: React.FC<UnifiedWavesListProps> = ({
  waves,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isPinnedWavesLoading = false,
  isFetchingNextPage,
  onHover,
  scrollContainerRef,
}) => {
  const { isApp } = useDeviceInfo();
  const { openWave } = useCreateModalState();
  const locale = useBrowserLocale();
  const [savedCollection] = useWaveSidebarCollection();
  const { canUseCollections, key } = useWaveDiscoveryViewer();
  const [search] = useWaveSidebarSearch(key ?? "guest");
  const isSearching = Boolean(search.trim());
  const collection = canUseCollections ? savedCollection : "all";
  const collectionFetching =
    isFetching || (collection === "pinned" && isPinnedWavesLoading);
  const [following] = useShowFollowingWaves();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const isJoinedFilterActive =
    following && !!connectedProfile?.handle && !activeProfileProxy;
  // Refs to the scroll container and sentinel
  const listRef = useRef<UnifiedWavesListWavesHandle>(null);

  // Track if we've triggered a fetch to avoid multiple triggers
  const hasFetchedRef = useRef(false);

  const triggerFetchNextPage = useEffectEvent(() => {
    hasFetchedRef.current = true;
    fetchNextPage();
  });

  // Reset the fetch flag when dependencies change
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [hasNextPage, isFetchingNextPage]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const sentinel = listRef.current?.sentinelRef.current;
    if (
      !sentinel ||
      isSearching ||
      collection === "pinned" ||
      !hasNextPage ||
      isFetchingNextPage
    )
      return;

    const cb = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry?.isIntersecting &&
        hasNextPage &&
        !isFetchingNextPage &&
        !hasFetchedRef.current
      ) {
        triggerFetchNextPage();
      }
    };

    const obs = new IntersectionObserver(cb, {
      root: listRef.current?.containerRef.current ?? null,
      rootMargin: "100px",
    });

    obs.observe(sentinel);

    return () => obs.disconnect();
  }, [collection, isSearching, hasNextPage, isFetchingNextPage]);

  return (
    <div className="tw-mb-4">
      <div
        className={
          isApp
            ? "tw-h-full tw-bg-transparent tw-py-1 [--wave-sidebar-background:#0d0d0e]"
            : "tw-h-full tw-rounded-xl tw-bg-iron-950 tw-py-4 tw-ring-1 tw-ring-inset tw-ring-iron-800 [--wave-sidebar-background:theme(colors.iron.950)]"
        }
      >
        {!isApp && (
          <div className="tw-mb-4 tw-w-full tw-px-4">
            <Button onClick={openWave} variant="primary" size="sm" fullWidth>
              <FontAwesomeIcon
                icon={faPlus}
                className="tw-size-3.5 tw-flex-shrink-0"
              />
              <span>Create Wave</span>
            </Button>
          </div>
        )}

        <div className="tw-w-full">
          {/* Unified Waves List */}
          <UnifiedWavesListWaves
            ref={listRef}
            isLoading={collectionFetching || isFetchingNextPage}
            waves={waves}
            onHover={onHover}
            scrollContainerRef={scrollContainerRef}
          />

          {/* Loading indicator and intersection trigger */}
          <UnifiedWavesListLoader
            isFetching={
              !isSearching && collectionFetching && waves.length === 0
            }
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
    </div>
  );
};

export default UnifiedWavesList;
