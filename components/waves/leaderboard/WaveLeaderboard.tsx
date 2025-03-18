import React, { useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import WaveLeaderboardRightSidebar from "./sidebar/WaveLeaderboardRightSidebar";
import useCapacitor from "../../../hooks/useCapacitor";
import { WaveDropsLeaderboardSortBy, WaveDropsLeaderboardSortDirection } from "../../../hooks/useWaveDropsLeaderboard";
import { useWaveTimers } from "../../../hooks/useWaveTimers";
import { WaveLeaderboardToggleButton } from "./WaveLeaderboardToggleButton";
import { WaveLeaderboardContent } from "./WaveLeaderboardContent";


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
  const capacitor = useCapacitor();
  const { voting: { isCompleted } } = useWaveTimers(wave);
  const [sort, setSort] = useState<WaveLeaderboardSortType>(
    WaveLeaderboardSortType.RANK
  );

  const [showMyDrops, setShowMyDrops] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
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

  const contentHeight = capacitor.isCapacitor
    ? "tw-h-[calc(100vh-16rem)]"
    : "tw-h-[calc(100vh-6.375rem)]";

  return (
    <>
      <div
        className={`tw-w-full lg:tw-ml-[21.5rem] ${
          isSidebarOpen ? "xl:tw-mr-[20.5rem] 3xl:tw-mr-[28rem]" : ""
        } tw-transition-all tw-duration-300 lg:tw-pl-4 lg:tw-pr-4 xl:tw-pr-0`}
      >
        <WaveLeaderboardContent
          contentHeight={contentHeight}
          wave={wave}
          isCompleted={isCompleted}
          setActiveDrop={setActiveDrop}
          sort={sort}
          setSort={setSort}
          showMyDrops={showMyDrops}
          setShowMyDrops={setShowMyDrops}
          isCreatingDrop={isCreatingDrop}
          setIsCreatingDrop={setIsCreatingDrop}
          sortBy={sortBy}
          sortDirection={sortDirection}
        >
          {children}
        </WaveLeaderboardContent>
      </div>

      <WaveLeaderboardToggleButton
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isCapacitor={capacitor.isCapacitor}
      />

      <div
        className={`tw-transition-transform lg:tw-transform-none tw-duration-300 
        lg:tw-fixed xl:tw-static lg:tw-right-0 lg:tw-top-0 lg:tw-h-full lg:tw-z-10 ${
          capacitor.isCapacitor ? "tw-pt-4" : ""
        }`}
      >
        <WaveLeaderboardRightSidebar
          isOpen={isSidebarOpen}
          wave={wave}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onDropClick={setActiveDrop}
        />
      </div>
    </>
  );
};
