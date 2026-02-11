"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { AnimatePresence, motion } from "framer-motion";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveLeaderboardTime } from "@/components/waves/leaderboard/WaveLeaderboardTime";
import { WaveLeaderboardHeader } from "@/components/waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropCreate } from "@/components/waves/leaderboard/create/WaveDropCreate";
import { WaveLeaderboardDrops } from "@/components/waves/leaderboard/drops/WaveLeaderboardDrops";
import { WaveLeaderboardGallery } from "@/components/waves/leaderboard/gallery/WaveLeaderboardGallery";
import { WaveLeaderboardGrid } from "@/components/waves/leaderboard/grid/WaveLeaderboardGrid";
import {
  isLeaderboardViewMode,
  type LeaderboardViewMode,
} from "@/components/waves/leaderboard/types";
import { useWave } from "@/hooks/useWave";
import { useLayout } from "./layout/LayoutContext";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import useLocalPreference from "@/hooks/useLocalPreference";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";

interface MyStreamWaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MyStreamWaveLeaderboard: React.FC<MyStreamWaveLeaderboardProps> = ({
  wave,
  onDropClick,
}) => {
  const { isMemesWave } = useWave(wave);
  const { leaderboardViewStyle } = useLayout(); // Get pre-calculated style from context

  // Track mount status
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw-flex-grow tw-px-2 sm:tw-px-4`;
  }, []);

  const [isCreatingDrop, setIsCreatingDrop] = useState(false);

  // Generate a unique preference key for this wave
  const viewPreferenceKey = `waveViewMode_${wave.id}`;

  // Determine the default view mode based on wave type
  const defaultViewMode: LeaderboardViewMode = isMemesWave ? "grid" : "list";

  // Use our custom hook to manage view mode preference
  const [viewMode, setViewMode] = useLocalPreference<LeaderboardViewMode>(
    viewPreferenceKey,
    defaultViewMode,
    isLeaderboardViewMode
  );

  // Use our custom hook for sort preference too
  const sortPreferenceKey = `waveSortMode_${wave.id}`;
  const [sort, setSort] = useLocalPreference<WaveDropsLeaderboardSort>(
    sortPreferenceKey,
    WaveDropsLeaderboardSort.RANK,
    (value) => Object.values(WaveDropsLeaderboardSort).includes(value)
  );

  const effectiveViewMode = useMemo<LeaderboardViewMode>(() => {
    if (!isMemesWave) {
      return viewMode;
    }
    // Preserve existing meme wave behavior (list/grid only).
    if (viewMode === "grid_content_only") {
      return "grid";
    }
    return viewMode;
  }, [isMemesWave, viewMode]);

  let leaderboardContent: React.ReactNode;
  if (effectiveViewMode === "list") {
    leaderboardContent = (
      <WaveLeaderboardDrops
        wave={wave}
        sort={sort}
        onCreateDrop={() => {
          if (mountedRef.current) {
            setIsCreatingDrop(true);
          }
        }}
      />
    );
  } else if (!isMemesWave) {
    leaderboardContent = (
      <WaveLeaderboardGrid
        wave={wave}
        sort={sort}
        mode={effectiveViewMode === "grid" ? "compact" : "content_only"}
        onDropClick={onDropClick}
      />
    );
  } else {
    leaderboardContent = (
      <WaveLeaderboardGallery
        wave={wave}
        sort={sort}
        onDropClick={onDropClick}
      />
    );
  }

  return (
    <div className={containerClassName} style={leaderboardViewStyle}>
      {/* Main content container */}
      <div className="tw-pt-2 md:tw-pt-4">
        <WaveLeaderboardTime wave={wave} />
      </div>

      {/* Sticky tabs/filters section */}
      <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-black">
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
          onSortChange={(s) => setSort(s)}
        />
      </div>

      {/* Content section */}
      <div className="tw-mt-2">
        <AnimatePresence>
          {isCreatingDrop && !isMemesWave && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
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

        {leaderboardContent}
      </div>
    </div>
  );
};

export default MyStreamWaveLeaderboard;
