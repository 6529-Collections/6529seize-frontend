import React, { useEffect, useRef } from "react";
import BrainLeftSidebarCreateADirectMessageButton from "../BrainLeftSidebarCreateADirectMessageButton";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { UnifiedWavesListLoader } from "./UnifiedWavesListLoader";
import UnifiedWavesListEmpty from "./UnifiedWavesListEmpty";
import UnifiedWavesListWaves, { UnifiedWavesListWavesHandle } from "./UnifiedWavesListWaves";
import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";

interface UnifiedWavesListProps {
  readonly waves: MinimalWave[];
  readonly activeWaveId: string | null;
  readonly fetchNextPage: () => void;
  readonly hasNextPage: boolean | undefined;
  readonly isFetchingNextPage: boolean;
  readonly onHover: (waveId: string) => void;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const UnifiedWavesList: React.FC<UnifiedWavesListProps> = ({
  waves,
  activeWaveId,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onHover,
  scrollContainerRef,
}) => {
  
  // Refs to the scroll container and sentinel
  const listRef = useRef<UnifiedWavesListWavesHandle>(null);

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

    const obs = new IntersectionObserver(cb, {
      root: listRef.current?.containerRef.current,
      rootMargin: "100px",
    });

    obs.observe(node);

    return () => obs.disconnect();
  }, [listRef.current?.sentinelRef.current, hasNextPage, isFetchingNextPage]);

  return (
    <div className="tw-mb-4">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-4">
        <div className="tw-px-4 tw-mb-4 tw-flex tw-items-center tw-justify-between tw-gap-2">
          <div className="tw-flex tw-items-center tw-gap-x-3 lg:tw-gap-x-2 tw-w-full">
            <div className="tw-flex-1">
              <BrainLeftSidebarCreateADirectMessageButton />
            </div>
            <div className="tw-flex-1">
              <Link
                href="/waves?new=true"
                className="tw-no-underline tw-ring-1 tw-ring-inset tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-700 tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-py-2 tw-px-4 tw-text-xs tw-bg-iron-800 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-transition-all tw-duration-300"
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  className="tw-size-3.5 -tw-ml-1.5 tw-flex-shrink-0"
                />
                <span className="tw-text-xs tw-font-semibold">Wave</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="tw-w-full">
          {/* Unified Waves List */}
          <UnifiedWavesListWaves ref={listRef} waves={waves} onHover={onHover} scrollContainerRef={scrollContainerRef} />

          {/* Loading indicator and intersection trigger */}
          <UnifiedWavesListLoader isFetchingNextPage={isFetchingNextPage} />

          {/* Empty state */}
          <UnifiedWavesListEmpty
            sortedWaves={waves}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </div>
    </div>
  );
};

export default UnifiedWavesList;
