import React, { useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { WaveLeaderboardTime } from "./WaveLeaderboardTime";
import { WaveLeaderboardHeader } from "./header/WaveleaderboardHeader";
import { WaveLeaderboardDrops } from "./drops/WaveLeaderboardDrops";
import {
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../../hooks/useWaveDropsLeaderboard";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import WaveLeaderboardRightSidebar from "./sidebar/WaveLeaderboardRightSidebar";
import { WaveDropCreate } from "./create/WaveDropCreate";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

interface WaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly children: React.ReactNode;
  readonly setActiveDrop: (drop: ExtendedDrop) => void;
}

export enum WaveLeaderboardSortType {
  RANK = "RANK",
  RECENT = "RECENT",
}

export const WaveLeaderboard: React.FC<WaveLeaderboardProps> = ({
  wave,
  children,
  setActiveDrop,
}) => {
  const [sort, setSort] = useState<WaveLeaderboardSortType>(
    WaveLeaderboardSortType.RANK
  );

  const [showMyDrops, setShowMyDrops] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreatingDrop, setIsCreatingDrop] = useState(false);

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
    <>
      <div
        className={`tw-w-full lg:tw-ml-[21.5rem] ${
          isSidebarOpen ? "xl:tw-mr-[20.5rem] 3xl:tw-mr-[28rem]" : ""
        } tw-transition-all tw-duration-300 lg:tw-pl-4 lg:tw-pr-4 xl:tw-pr-0`}
      >
        <div className="tw-w-full no-scrollbar tw-overflow-y-auto tw-h-[calc(100vh-102px)] tw-pb-6 tw-px-2 lg:tw-px-0 lg:tw-mt-3">
          {children}

          <WaveLeaderboardTime wave={wave} />
          <WaveLeaderboardHeader
            wave={wave}
            sort={sort}
            setSort={setSort}
            showMyDrops={showMyDrops}
            setShowMyDrops={setShowMyDrops}
            onCreateDrop={() => setIsCreatingDrop(true)}
          />

          <AnimatePresence>
            {isCreatingDrop && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <WaveDropCreate
                  wave={wave}
                  onCancel={() => setIsCreatingDrop(false)}
                  onSuccess={() => {
                    setIsCreatingDrop(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <WaveLeaderboardDrops
            wave={wave}
            dropsSortBy={sortBy[sort]}
            sortDirection={sortDirection[sort]}
            showMyDrops={showMyDrops}
            setActiveDrop={setActiveDrop}
            onCreateDrop={() => setIsCreatingDrop(true)}
          />
        </div>
      </div>

      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="tw-fixed tw-right-0 tw-top-[6.25rem] tw-border-0 tw-z-50 tw-text-iron-500 desktop-hover:hover:tw-text-primary-400 tw-transition-all tw-duration-300 tw-ease-in-out tw-bg-iron-700 tw-rounded-r-none tw-rounded-l-lg tw-size-8 tw-flex tw-items-center tw-justify-center tw-shadow-lg desktop-hover:hover:tw-shadow-primary-400/202 lg:tw-hidden"
      >
        {isSidebarOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            aria-hidden="true"
            stroke="currentColor"
            className="tw-w-5 tw-h-5 tw-text-iron-300 tw-flex-shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="tw-w-5 tw-h-5 tw-text-iron-300 tw-flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        )}
      </button>

      <div
        className={`${
          !isSidebarOpen && "tw-translate-x-full lg:tw-translate-x-0"
        } tw-transition-transform lg:tw-transform-none tw-duration-300 
        lg:tw-fixed xl:tw-static lg:tw-right-0 lg:tw-top-0 lg:tw-h-full lg:tw-z-10`}
      >
        <WaveLeaderboardRightSidebar
          isOpen={isSidebarOpen}
          wave={wave}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>
    </>
  );
};
