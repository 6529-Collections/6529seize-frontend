"use client";

import { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesList";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
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
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
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
}) => {
  const { isApp } = useDeviceInfo();
  // Refs to the scroll container and sentinel
  const listRef = useRef<WebUnifiedWavesListWavesHandle>(null);

  // Track if we've triggered a fetch to avoid multiple triggers
  const hasFetchedRef = useRef(false);

  // Reset the fetch flag when dependencies change
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [hasNextPage, isFetchingNextPage]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const node = listRef.current?.sentinelRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;

    const cb = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        hasNextPage &&
        !isFetchingNextPage &&
        !hasFetchedRef.current
      ) {
        hasFetchedRef.current = true;
        fetchNextPage();
      }
    };

    const observer = new IntersectionObserver(cb, {
      root: listRef.current?.sentinelRef.current?.parentElement,
      rootMargin: "100px",
    });

    observer.observe(node);

    return () => {
      observer.unobserve(node);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const haveWaves = waves.length > 0;
  const isEmpty = !isFetching && !haveWaves;
  const isInitialLoad = isFetching && !haveWaves;

  return (
    <div className="tw-mb-4 tw-pt-5 tw-bg-iron-950">
      {/* Title row with + button */}
      <div className="tw-flex tw-items-center tw-justify-between tw-px-4">
        <h2 className="tw-text-lg tw-font-semibold tw-text-iron-50 tw-mb-0">Waves</h2>
        {!isApp && (
          <Link
            href="/waves?create=wave"
            className="tw-group tw-text-iron-300 desktop-hover:hover:tw-text-white tw-size-8 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-gradient-to-br tw-from-iron-800 tw-to-iron-900 tw-border tw-border-solid tw-border-transparent tw-transition-colors tw-duration-200 desktop-hover:hover:tw-from-iron-750 desktop-hover:hover:tw-to-iron-850 desktop-hover:hover:tw-border-iron-650"
            aria-label="Create a new wave">
            <PlusIcon className="tw-size-4 tw-flex-shrink-0" />
          </Link>
        )}
      </div>
      
      <div className="tw-h-full tw-bg-iron-950 tw-py-4">
        <div className="tw-flex-1">
        {isInitialLoad ? (
          <UnifiedWavesListLoader isFetchingNextPage={false} />
        ) : isEmpty ? (
          <UnifiedWavesListEmpty
            sortedWaves={waves}
            isFetching={isFetching}
            isFetchingNextPage={isFetchingNextPage}
            emptyMessage="No waves to display"
          />
        ) : (
          <WebUnifiedWavesListWaves
            ref={listRef}
            waves={waves}
            onHover={onHover}
            scrollContainerRef={scrollContainerRef}
          />
        )}
          {isFetchingNextPage && <UnifiedWavesListLoader isFetchingNextPage={true} />}
        </div>
      </div>
    </div>
  );
};

export default WebUnifiedWavesList;