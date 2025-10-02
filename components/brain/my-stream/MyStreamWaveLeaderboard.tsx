"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { AnimatePresence, motion } from "framer-motion";
import { ApiWave } from "@/generated/models/ApiWave";
import { WaveLeaderboardTime } from "@/components/waves/leaderboard/WaveLeaderboardTime";
import { WaveLeaderboardHeader } from "@/components/waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropCreate } from "@/components/waves/leaderboard/create/WaveDropCreate";
import { WaveLeaderboardDrops } from "@/components/waves/leaderboard/drops/WaveLeaderboardDrops";
import { WaveLeaderboardGallery } from "@/components/waves/leaderboard/gallery/WaveLeaderboardGallery";
import { useWave } from "@/hooks/useWave";
import { useLayout } from "./layout/LayoutContext";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import useLocalPreference from "@/hooks/useLocalPreference";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import { createBreakpoint } from "react-use";

interface MyStreamWaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const useBreakpoint = createBreakpoint({ MD: 768, S: 0 });

const MyStreamWaveLeaderboard: React.FC<MyStreamWaveLeaderboardProps> = ({
  wave,
  onDropClick,
}) => {
  const { isMemesWave } = useWave(wave);
  const { leaderboardViewStyle } = useLayout(); // Get pre-calculated style from context
  const breakpoint = useBreakpoint();

  // Track mount status
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw-flex-grow lg:tw-pr-2`;
  }, []);

  const [isCreatingDrop, setIsCreatingDrop] = useState(false);

  // Generate a unique preference key for this wave
  const viewPreferenceKey = `waveViewMode_${wave.id ?? "default"}`;

  // Determine the default view mode based on wave type
  const defaultViewMode = isMemesWave ? "grid" : "list";

  // Use our custom hook to manage view mode preference
  const [viewMode, setViewMode] = useLocalPreference<"list" | "grid">(
    viewPreferenceKey,
    defaultViewMode,
    (value) => value === "list" || value === "grid"
  );

  // Use our custom hook for sort preference too
  const sortPreferenceKey = `waveSortMode_${wave.id ?? "default"}`;
  const [sort, setSort] = useLocalPreference<WaveDropsLeaderboardSort>(
    sortPreferenceKey,
    WaveDropsLeaderboardSort.RANK,
    (value) => Object.values(WaveDropsLeaderboardSort).includes(value)
  );

  // MOBILE OPTIMIZATION: Force list view on small screens while preserving user preference
  // On mobile (S breakpoint): always show list view regardless of user choice
  // On desktop (MD breakpoint): respect user's chosen view mode
  const effectiveViewMode: "list" | "grid" = useMemo(() => {
    if (breakpoint === "S") {
      // Mobile: always list view (but don't overwrite user preference)
      return "list";
    }
    // Desktop: use user's preference
    return viewMode;
  }, [breakpoint, viewMode]);

  return (
    <div className={containerClassName} style={leaderboardViewStyle}>
      {/* Main content container */}
      <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 lg:tw-pt-2">
        {/* Time section */}
        <WaveLeaderboardTime wave={wave} />
      </div>

      {/* Sticky tabs/filters section */}
      <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-iron-950 tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
        <WaveLeaderboardHeader
          wave={wave}
          viewMode={effectiveViewMode}
          sort={sort}
          onViewModeChange={(mode) => setViewMode(mode)}
          onCreateDrop={() => {
            if (mountedRef.current) {
              setIsCreatingDrop(true);
            }
          }}
          onSortChange={(sort) => setSort(sort)}
        />
      </div>

      {/* Content section */}
      <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-mt-2">
        <AnimatePresence>
          {isCreatingDrop && !isMemesWave && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}>
              <WaveDropCreate
                wave={wave}
                onCancel={() => {
                  if (mountedRef.current) {
                    setIsCreatingDrop(false);
                  }
                }}
                onSuccess={() => {
                  if (mountedRef.current) {
                    setIsCreatingDrop(false);
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isMemesWave && isCreatingDrop && (
          <MemesArtSubmissionModal
            isOpen={isCreatingDrop}
            wave={wave}
            onClose={() => setIsCreatingDrop(false)}
          />
        )}

        {effectiveViewMode === "list" ? (
          <WaveLeaderboardDrops
            wave={wave}
            sort={sort}
            onCreateDrop={() => {
              if (mountedRef.current) {
                setIsCreatingDrop(true);
              }
            }}
          />
        ) : (
          <WaveLeaderboardGallery
            wave={wave}
            sort={sort}
            onDropClick={onDropClick}
          />
        )}
      </div>
    </div>
  );
};

export default MyStreamWaveLeaderboard;
