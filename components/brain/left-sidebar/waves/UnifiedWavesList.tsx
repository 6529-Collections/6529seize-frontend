"use client";

import { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesList";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React, { useEffect, useEffectEvent, useRef } from "react";
import UnifiedWavesListEmpty from "./UnifiedWavesListEmpty";
import { UnifiedWavesListLoader } from "./UnifiedWavesListLoader";
import UnifiedWavesListWaves, {
  UnifiedWavesListWavesHandle,
} from "./UnifiedWavesListWaves";

interface UnifiedWavesListProps {
  readonly waves: MinimalWave[];
  readonly fetchNextPage: () => void;
  readonly hasNextPage: boolean | undefined;
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onHover: (waveId: string) => void;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const UnifiedWavesList: React.FC<UnifiedWavesListProps> = ({
  waves,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  onHover,
  scrollContainerRef,
}) => {
  const { isApp } = useDeviceInfo();
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
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const cb = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        hasNextPage &&
        !isFetchingNextPage &&
        !hasFetchedRef.current
      ) {
        triggerFetchNextPage();
      }
    };

    const obs = new IntersectionObserver(cb, {
      root: listRef.current?.containerRef.current,
      rootMargin: "100px",
    });

    obs.observe(sentinel);

    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage]);

  return (
    <div className="tw-mb-4">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-4">
        {!isApp && (
          <div className="tw-px-4 tw-mb-4 tw-w-full">
            <Link
              href="/waves?create=wave"
              className="tw-no-underline tw-ring-1 tw-ring-inset tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-700 tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-py-2 tw-px-4 tw-text-xs tw-bg-iron-800 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-transition-all tw-duration-300">
              <FontAwesomeIcon
                icon={faPlus}
                className="tw-size-3.5 -tw-ml-1.5 tw-flex-shrink-0"
              />
              <span className="tw-text-xs tw-font-semibold">Create Wave</span>
            </Link>
          </div>
        )}

        <div className="tw-w-full">
          {/* Unified Waves List */}
          <UnifiedWavesListWaves
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

export default UnifiedWavesList;
