"use client";

import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";
import useDeviceInfo from "../../../../hooks/useDeviceInfo";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
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

  return (
    <div>
      <div className="tw-h-full tw-bg-iron-950 tw-py-1">
        <div className="tw-w-full">
          {/* Unified Waves List */}
          <WebUnifiedWavesListWaves
            ref={listRef}
            waves={waves}
            onHover={onHover}
            scrollContainerRef={scrollContainerRef}
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
    </div>
  );
};

export default WebUnifiedWavesList;
