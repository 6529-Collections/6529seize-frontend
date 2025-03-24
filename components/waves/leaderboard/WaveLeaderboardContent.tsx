import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { WaveLeaderboardTime } from "./WaveLeaderboardTime";
import { WaveLeaderboardHeader } from "./header/WaveleaderboardHeader";
import { WaveLeaderboardDrops } from "./drops/WaveLeaderboardDrops";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { WaveWinners } from "../winners/WaveWinners";
import { WaveDropsLeaderboardSortBy, WaveDropsLeaderboardSortDirection } from "../../../hooks/useWaveDropsLeaderboard";
import { WaveLeaderboardSortType } from "./WaveLeaderboard";
import { WaveLeaderboardCreateDropSection } from "./WaveLeaderboardCreateDropSection";

interface WaveLeaderboardContentProps {
  readonly children: React.ReactNode;
  readonly contentHeight: string;
  readonly wave: ApiWave;
  readonly isCompleted: boolean;
  readonly setActiveDrop: (drop: ExtendedDrop) => void;
  
  // Sorting state
  readonly sort: WaveLeaderboardSortType;
  readonly setSort: (sort: WaveLeaderboardSortType) => void;
  
  // Filtering state
  readonly showMyDrops: boolean;
  readonly setShowMyDrops: (show: boolean) => void;
  
  // Drop creation state
  readonly isCreatingDrop: boolean;
  readonly setIsCreatingDrop: (isCreating: boolean) => void;
  
  // Sort configuration
  readonly sortBy: Record<WaveLeaderboardSortType, WaveDropsLeaderboardSortBy>;
  readonly sortDirection: Record<WaveLeaderboardSortType, WaveDropsLeaderboardSortDirection>;
}

export const WaveLeaderboardContent: React.FC<WaveLeaderboardContentProps> = ({
  children,
  contentHeight,
  wave,
  isCompleted,
  setActiveDrop,
  sort,
  setSort,
  showMyDrops,
  setShowMyDrops,
  isCreatingDrop,
  setIsCreatingDrop,
  sortBy,
  sortDirection,
}) => {
  return (
    <div
      className={`tw-w-full no-scrollbar tw-overflow-y-auto ${contentHeight} tw-pb-6 tw-px-2 lg:tw-px-0 lg:tw-mt-3`}
    >
      {children}

      {isCompleted ? (
        <div className="tw-pb-4 lg:tw-pb-0">
          <WaveWinners wave={wave} onDropClick={setActiveDrop} />
        </div>
      ) : (
        <>
          <WaveLeaderboardTime wave={wave} />
          <WaveLeaderboardHeader
            wave={wave}
            sort={sort}
            setSort={setSort}
            showMyDrops={showMyDrops}
            setShowMyDrops={setShowMyDrops}
            onCreateDrop={() => setIsCreatingDrop(true)}
          />

          <WaveLeaderboardCreateDropSection
            wave={wave}
            isCreatingDrop={isCreatingDrop}
            onCancel={() => setIsCreatingDrop(false)}
            onSuccess={() => setIsCreatingDrop(false)}
          />
          <WaveLeaderboardDrops
            wave={wave}
            dropsSortBy={sortBy[sort]}
            sortDirection={sortDirection[sort]}
            showMyDrops={showMyDrops}
            onCreateDrop={() => setIsCreatingDrop(true)}
          />
        </>
      )}
    </div>
  );
};
