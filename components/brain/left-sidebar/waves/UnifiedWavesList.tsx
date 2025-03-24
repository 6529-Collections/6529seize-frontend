import React, { useEffect, useRef } from "react";
import { EnhancedWave } from "../../../../hooks/useWavesList";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";
import BrainLeftSidebarCreateAWaveButton from "../BrainLeftSidebarCreateAWaveButton";

interface UnifiedWavesListProps {
  readonly waves: EnhancedWave[];
  readonly activeWaveId: string | null;
  readonly resetWaveCount: (waveId: string) => void;
  readonly fetchNextPage: () => void;
  readonly hasNextPage: boolean | undefined;
  readonly isFetchingNextPage: boolean;
}

const UnifiedWavesList: React.FC<UnifiedWavesListProps> = ({
  waves,
  activeWaveId,
  resetWaveCount,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}) => {
  // Split waves into recent (pinned) and following (non-pinned)
  const recentWaves = waves.filter((wave) => wave.isPinned);
  const followingWaves = waves.filter((wave) => !wave.isPinned);
  
  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Track if we've triggered a fetch to avoid multiple triggers
  const hasFetchedRef = useRef(false);

  // Reset the fetch flag when dependencies change
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [hasNextPage, isFetchingNextPage]);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    
    // Only observe if we have more pages to load and aren't already fetching
    if (!hasNextPage || isFetchingNextPage) return;
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      // Only fetch if we're intersecting, have more pages, aren't already fetching,
      // and haven't triggered a fetch in this cycle
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage && !hasFetchedRef.current) {
        hasFetchedRef.current = true;
        fetchNextPage();
      }
    };
    
    const observer = new IntersectionObserver(
      handleIntersection,
      { rootMargin: "100px" }
    );
    
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  return (
    <div className="tw-mb-4">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-4">
        {/* Create Wave Button */}
        <div className="tw-px-4 tw-mb-4">
          <BrainLeftSidebarCreateAWaveButton />
        </div>
        
        {/* Scrollable container for all waves */}
        <div className="tw-max-h-[calc(100vh-180px)] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-900">
          {/* Recent Section */}
          {recentWaves.length > 0 && (
            <>
              <div className="tw-px-5 tw-mb-2">
                <p className="tw-text-xs tw-font-semibold tw-text-iron-400 tw-uppercase tw-tracking-wider">
                  Recent
                </p>
              </div>
              <div className="tw-flex tw-flex-col tw-mb-4">
                {recentWaves.map((wave) => (
                  <BrainLeftSidebarWave
                    key={wave.id}
                    wave={wave}
                    resetWaveCount={resetWaveCount}
                    isHighlighted={wave.id === activeWaveId}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Following Section */}
          {followingWaves.length > 0 && (
            <>
              <div className="tw-px-5 tw-mb-2">
                <p className="tw-text-xs tw-font-semibold tw-text-iron-400 tw-uppercase tw-tracking-wider">
                  Following
                </p>
              </div>
              <div className="tw-flex tw-flex-col">
                {followingWaves.map((wave) => (
                  <BrainLeftSidebarWave
                    key={wave.id}
                    wave={wave}
                    resetWaveCount={resetWaveCount}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Loading indicator and intersection trigger */}
          {(hasNextPage || isFetchingNextPage) && (
            <div 
              ref={loadMoreRef}
              className="tw-flex tw-justify-center tw-items-center tw-py-4"
            >
              {isFetchingNextPage && (
                <div className="tw-flex tw-justify-center tw-items-center tw-gap-1">
                  <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse"></div>
                  <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse tw-animation-delay-200"></div>
                  <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse tw-animation-delay-400"></div>
                </div>
              )}
            </div>
          )}
          
          {/* Empty state */}
          {waves.length === 0 && !isFetchingNextPage && (
            <div className="tw-px-5 tw-py-8 tw-text-center tw-text-iron-500">
              <p>No waves to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedWavesList;