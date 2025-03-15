import React, { useMemo, useState, useEffect, useRef } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import {
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../hooks/useWaveDropsLeaderboard";
import { AnimatePresence, motion } from "framer-motion";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWaveState } from "../../../hooks/useWaveState";
import { WaveLeaderboardSortType } from "../../waves/leaderboard/WaveLeaderboard";
import { WaveLeaderboardTime } from "../../waves/leaderboard/WaveLeaderboardTime";
import { WaveLeaderboardHeader } from "../../waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropCreate } from "../../waves/leaderboard/create/WaveDropCreate";
import { WaveLeaderboardDrops } from "../../waves/leaderboard/drops/WaveLeaderboardDrops";
import { useWave } from "../../../hooks/useWave";
import PrimaryButton from "../../utils/button/PrimaryButton";
import MemesArtSubmission from "../../waves/memes/MemesArtSubmission";

interface MyStreamWaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly setSubmittingArtFromParent?: boolean;
  // Stable measurements from parent
  readonly tabsHeight?: number;
}

const MyStreamWaveLeaderboard: React.FC<MyStreamWaveLeaderboardProps> = ({
  wave,
  onDropClick,
  setSubmittingArtFromParent,
  tabsHeight,
}) => {
  const { hasFirstDecisionPassed } = useWaveState(wave);
  const { isMemesWave } = useWave(wave);
  
  // Track mount status
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Log when stable tabsHeight value is received
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && tabsHeight !== undefined) {
      console.log(`[MyStreamWaveLeaderboard] Using tabs height: ${tabsHeight}px for wave ${wave.id}`);
    }
  }, [tabsHeight, wave.id]);
  
  const containerClassName = useMemo(() => {
    return `lg:tw-pt-2 tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw-flex-grow lg:tw-pr-2`;
  }, []);

  const [sort, setSort] = useState<WaveLeaderboardSortType>(
    WaveLeaderboardSortType.RANK
  );
  const [showMyDrops, setShowMyDrops] = useState(false);
  const [isCreatingDrop, setIsCreatingDrop] = useState(false);
  const [isSubmittingArt, setIsSubmittingArt] = useState(false);

  // Effect to handle parent component triggering art submission
  useEffect(() => {
    if (setSubmittingArtFromParent && mountedRef.current) {
      setIsSubmittingArt(true);
    }
  }, [setSubmittingArtFromParent]);

  const sortBy: Record<WaveLeaderboardSortType, WaveDropsLeaderboardSortBy> = {
    [WaveLeaderboardSortType.RANK]: WaveDropsLeaderboardSortBy.RANK,
    [WaveLeaderboardSortType.RECENT]: WaveDropsLeaderboardSortBy.CREATION_TIME,
  };

  const sortDirection: Record<
    WaveLeaderboardSortType,
    WaveDropsLeaderboardSortDirection
  > = {
    [WaveLeaderboardSortType.RANK]: WaveDropsLeaderboardSortDirection.DESC,
    [WaveLeaderboardSortType.RECENT]: WaveDropsLeaderboardSortDirection.ASC,
  };

  // Calculate height styles - prefer tabs-based subtraction when available
  const heightStyle = tabsHeight !== undefined 
    ? { 
        height: `calc(100% - ${tabsHeight}px)`,
        maxHeight: `calc(100% - ${tabsHeight}px)`
      }
    : {};

  return (
    <div 
      className={containerClassName} 
      style={heightStyle}
      data-tabs-height={tabsHeight}
    >
      {/* Main content container */}
      <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
        {/* Title and button now moved to parent component */}

        {/* Time section - hide during art submission */}
        {!(isMemesWave && isSubmittingArt) && (
          <WaveLeaderboardTime wave={wave} />
        )}

        {/* Header and Winners banner only shown when not in art submission mode */}
        {!(isMemesWave && isSubmittingArt) && (
          <>
            {!isMemesWave && (
              <WaveLeaderboardHeader
                wave={wave}
                sort={sort}
                setSort={setSort}
                showMyDrops={showMyDrops}
                setShowMyDrops={setShowMyDrops}
                onCreateDrop={() => {
                  if (isMemesWave) {
                    setIsSubmittingArt(true);
                  } else {
                    setIsCreatingDrop(true);
                  }
                }}
              />
            )}

           {/* Winners announcement banner removed as requested */}
          </>
        )}
      </div>

      {/* Regular flow for expanding drop creation for non-Memes waves */}
      {!(isMemesWave && isSubmittingArt) && (
        <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
          <AnimatePresence>
            {isCreatingDrop && !isMemesWave && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <WaveDropCreate
                  wave={wave!}
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

          {/* Regular leaderboard drops (only shown when not in art submission mode) */}
          <WaveLeaderboardDrops
            wave={wave}
            dropsSortBy={sortBy[sort]}
            sortDirection={sortDirection[sort]}
            showMyDrops={showMyDrops}
            onCreateDrop={() => {
              if (mountedRef.current) {
                if (isMemesWave) {
                  setIsSubmittingArt(true);
                } else {
                  setIsCreatingDrop(true);
                }
              }
            }}
          />
        </div>
      )}

      {/* Art submission takes full area when active in Memes wave */}
      {isMemesWave && isSubmittingArt && (
        <MemesArtSubmission
          onCancel={() => {
            if (mountedRef.current) {
              setIsSubmittingArt(false);
            }
          }}
          onSubmit={(artwork) => {
            console.log("Artwork submitted:", artwork);
            // Handle artwork submission here
            if (mountedRef.current) {
              setIsSubmittingArt(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default MyStreamWaveLeaderboard;
