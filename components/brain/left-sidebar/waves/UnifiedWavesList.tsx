import React, { useEffect, useMemo, useRef } from "react";
import BrainLeftSidebarCreateADirectMessageButton from "../BrainLeftSidebarCreateADirectMessageButton";
import CommonSwitch from "../../../utils/switch/CommonSwitch";
import { useShowFollowingWaves } from "../../../../hooks/useShowFollowingWaves";
import { useAuth } from "../../../auth/Auth";
import { MinimalWave } from "../../../../contexts/wave/MyStreamContext";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { UnifiedWavesListLoader } from "./UnifiedWavesListLoader";
import UnifiedWavesListEmpty from "./UnifiedWavesListEmpty";
import UnifiedWavesListWaves from "./UnifiedWavesListWaves";

interface UnifiedWavesListProps {
  readonly waves: MinimalWave[];
  readonly activeWaveId: string | null;
  readonly fetchNextPage: () => void;
  readonly hasNextPage: boolean | undefined;
  readonly isFetchingNextPage: boolean;
}

const UnifiedWavesList: React.FC<UnifiedWavesListProps> = ({
  waves,
  activeWaveId,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}) => {
  // No longer splitting waves into separate categories

  const [following, setFollowing] = useShowFollowingWaves();
  const { connectedProfile, activeProfileProxy } = useAuth();

  const isConnectedIdentity = useMemo(() => {
    return !!connectedProfile?.profile?.handle && !activeProfileProxy;
  }, [connectedProfile?.profile?.handle, activeProfileProxy]);

  // Sort waves to prioritize the active wave (if present)
  const sortedWaves = useMemo(() => {
    if (!activeWaveId) return waves;

    return waves.reduce<MinimalWave[]>((acc, wave) => {
      if (wave.id === activeWaveId) {
        // Place active wave at the beginning
        acc.unshift(wave);
      } else {
        // Place all other waves at the end
        acc.push(wave);
      }
      return acc;
    }, []);
  }, [waves, activeWaveId]);

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

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: "100px",
    });

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
        <div className="tw-px-4 tw-mb-4 tw-flex tw-items-center tw-justify-between tw-gap-2">
          <BrainLeftSidebarCreateADirectMessageButton />
          <Link
            href="/waves?new=true"
            className="tw-no-underline tw-ring-1 tw-ring-inset tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-700 tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-py-2 tw-px-4 tw-text-xs tw-bg-iron-800 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-transition-all tw-duration-300"
          >
            <FontAwesomeIcon
              icon={faPlus}
              className="tw-size-3 -tw-ml-1.5 tw-flex-shrink-0"
            />
            <span className="tw-text-xs tw-font-semibold">Wave</span>
          </Link>
          {isConnectedIdentity && (
            <CommonSwitch
              label="Joined"
              isOn={following}
              setIsOn={setFollowing}
            />
          )}
        </div>

        <div className="tw-w-full">
          {/* Unified Waves List */}
          <UnifiedWavesListWaves waves={sortedWaves} />

          {/* Loading indicator and intersection trigger */}
          <UnifiedWavesListLoader
            loadMoreRef={loadMoreRef}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={!!hasNextPage}
          />

          {/* Empty state */}
          <UnifiedWavesListEmpty
            sortedWaves={sortedWaves}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </div>
    </div>
  );
};

export default UnifiedWavesList;
