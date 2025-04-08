import React, { useEffect, useMemo, useRef, useState } from "react";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";
import CommonSwitch from "../../../utils/switch/CommonSwitch";
import { useShowFollowingWaves } from "../../../../hooks/useShowFollowingWaves";
import { useAuth } from "../../../auth/Auth";
import { motion } from "framer-motion";
import { MinimalWave } from "../../../../contexts/wave/MyStreamContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faChevronDown,
  faPaperPlane,
  faWaveSquare,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import SecondaryButton from "../../../utils/button/SecondaryButton";

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

  const CreateButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="tw-relative" ref={buttonRef}>
        <SecondaryButton
          onClicked={() => {
            setIsOpen(!isOpen);
          }}
          size="sm"
        >
          <FontAwesomeIcon icon={faPlus} className="tw-size-3.5" />
          <span className="tw-text-sm tw-font-semibold">Create</span>
        </SecondaryButton>

        {isOpen && (
          <div
            className="tw-absolute tw-left-0 tw-top-full tw-mt-1.5 
                    tw-bg-iron-900 tw-border tw-border-solid tw-border-iron-700 tw-rounded-md 
                    tw-shadow-xl tw-shadow-black/40 tw-py-1 tw-z-20 tw-w-48
                    tw-backdrop-blur-md tw-animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href="/waves?new-dm=true"
              className="tw-flex tw-items-center tw-whitespace-nowrap tw-gap-2.5 tw-px-3 tw-py-2.5 tw-text-sm tw-font-medium tw-no-underline tw-text-iron-300
                       desktop-hover:hover:tw-bg-primary-900/30 desktop-hover:hover:tw-text-primary-300 tw-transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FontAwesomeIcon
                icon={faPaperPlane}
                className="tw-size-3.5 tw-text-primary-400 tw-flex-shrink-0"
              />
              <span>Direct Message</span>
            </Link>
            <Link
              href="/waves?new=true"
              className="tw-flex tw-items-center tw-whitespace-nowrap tw-gap-2.5 tw-px-3 tw-py-2.5 tw-text-sm tw-font-medium tw-no-underline tw-text-iron-300
                       desktop-hover:hover:tw-bg-primary-900/30 desktop-hover:hover:tw-text-primary-300 tw-transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FontAwesomeIcon
                icon={faWaveSquare}
                className="tw-size-3.5 tw-text-primary-400 tw-flex-shrink-0"
              />
              <span>New Wave</span>
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tw-mb-4">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-4">
        {/* Create Wave Button */}
        <div className="tw-px-4 tw-mb-4 tw-flex tw-items-center tw-justify-between tw-gap-2">
          <CreateButton />
          {isConnectedIdentity && (
            <CommonSwitch
              label="Joined"
              isOn={following}
              setIsOn={setFollowing}
            />
          )}
        </div>

        {/* Non-scrollable container for all waves - parent will handle scrolling */}
        <div className="tw-w-full">
          {/* Unified Waves List */}
          {sortedWaves.length > 0 && (
            <div className="tw-flex tw-flex-col">
              {sortedWaves.map((wave) => (
                <div key={wave.id}>
                  <BrainLeftSidebarWave wave={wave} />
                </div>
              ))}
            </div>
          )}

          {/* Loading indicator and intersection trigger */}
          {(hasNextPage || isFetchingNextPage) && (
            <div ref={loadMoreRef}>
              {isFetchingNextPage && (
                <motion.div
                  className="tw-flex tw-justify-center tw-items-center tw-gap-1  tw-py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse"></div>
                  <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse tw-animation-delay-200"></div>
                  <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse tw-animation-delay-400"></div>
                </motion.div>
              )}
            </div>
          )}

          {/* Empty state */}
          {sortedWaves.length === 0 && !isFetchingNextPage && (
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
