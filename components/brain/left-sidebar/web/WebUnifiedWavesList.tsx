"use client";

import { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesList";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
    <div className="tw-mb-4">
      {/* Title row with + button */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-3 tw-px-1">
        <h2 className="tw-text-lg tw-font-semibold tw-text-iron-50">Waves</h2>
        {!isApp && (
          <Link
            href="/waves?create=wave"
            className="tw-flex tw-items-center tw-justify-center tw-size-8 tw-rounded-lg tw-bg-iron-800 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-primary-400 tw-transition-all tw-duration-200 tw-no-underline"
            aria-label="Create a new wave">
            <FontAwesomeIcon icon={faPlus} className="tw-size-4" />
          </Link>
        )}
      </div>
      
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-4">
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