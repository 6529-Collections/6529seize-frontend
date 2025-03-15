import React, { useMemo, useState, useEffect } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import {
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../hooks/useWaveDropsLeaderboard";
import { AnimatePresence, motion } from "framer-motion";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import { WaveLeaderboardSortType } from "../../waves/leaderboard/WaveLeaderboard";
import { WaveLeaderboardTime } from "../../waves/leaderboard/WaveLeaderboardTime";
import { WaveLeaderboardHeader } from "../../waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropCreate } from "../../waves/leaderboard/create/WaveDropCreate";
import { WaveLeaderboardDrops } from "../../waves/leaderboard/drops/WaveLeaderboardDrops";
import { useWave } from "../../../hooks/useWave";
import PrimaryButton from "../../utils/button/PrimaryButton";
import MemesArtSubmission from "../../waves/memes/MemesArtSubmission";
import { ContentView, useContentHeight } from "../../../hooks/useContentHeight";

interface MyStreamWaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly setSubmittingArtFromParent?: boolean;
}

// Removed in favor of useWaveViewHeight hook

const MyStreamWaveLeaderboard: React.FC<MyStreamWaveLeaderboardProps> = ({
  wave,
  onDropClick,
  setSubmittingArtFromParent,
}) => {
  const { hasFirstDecisionPassed } = useWaveState(wave);
  const { isMemesWave } = useWave(wave);
  
  // Use the content height hook
  const { heightStyle, ready } = useContentHeight({
    view: ContentView.LEADERBOARD,
    isMemesWave,
    componentId: `wave-leaderboard-${wave.id}`
  });
  
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
    if (setSubmittingArtFromParent) {
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

  return (
    <div className={containerClassName} style={heightStyle}>
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

           {/*  {hasFirstDecisionPassed && (
              <div className="tw-mt-2 tw-mb-4 tw-bg-primary-400/20 tw-px-4 tw-py-3 tw-rounded-lg tw-border tw-border-primary-500/20">
                <div className="tw-flex tw-items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="tw-size-5 tw-text-primary-300 tw-mr-2"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="tw-mb-0 tw-text-sm tw-text-primary-300">
                    <strong>Winners announced!</strong>{" "}
                    <span className="tw-text-iron-200">
                      Check the Winners tab to see the results.
                    </span>
                  </p>
                </div>
              </div>
            )} */}
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
                  onCancel={() => setIsCreatingDrop(false)}
                  onSuccess={() => {
                    setIsCreatingDrop(false);
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
              if (isMemesWave) {
                setIsSubmittingArt(true);
              } else {
                setIsCreatingDrop(true);
              }
            }}
          />
        </div>
      )}

      {/* Art submission takes full area when active in Memes wave */}
      {isMemesWave && isSubmittingArt && (
        <MemesArtSubmission
          onCancel={() => setIsSubmittingArt(false)}
          onSubmit={(artwork) => {
            console.log("Artwork submitted:", artwork);
            // Handle artwork submission here
            setIsSubmittingArt(false);
          }}
        />
      )}
    </div>
  );
};

export default MyStreamWaveLeaderboard;
