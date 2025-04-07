import React, { useContext, useState, useMemo } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { AuthContext } from "../../../auth/Auth";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "../../../../hooks/useWaveDropsLeaderboard";
import MyStreamWaveMyVote from "./MyStreamWaveMyVote";
import { useLayout } from "../layout/LayoutContext";
import { WaveLeaderboardLoadingBar } from "../../../waves/leaderboard/drops/WaveLeaderboardLoadingBar";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import SecondaryButton from "../../../utils/button/SecondaryButton";

interface MyStreamWaveMyVotesProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MyStreamWaveMyVotes: React.FC<MyStreamWaveMyVotesProps> = ({
  wave,
  onDropClick,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      sort: WaveDropsLeaderboardSort.MY_REALTIME_VOTE,
    });

  const { myVotesViewStyle } = useLayout();

  // State to track checked drops
  const [checkedDrops, setCheckedDrops] = useState<Record<string, boolean>>({});

  // State for reset progress
  const [isResetting, setIsResetting] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);

  // Check if at least one checkbox is selected
  const hasCheckedItems = useMemo(() => {
    return Object.values(checkedDrops).some((isChecked) => isChecked);
  }, [checkedDrops]);

  // Check if all items are selected
  const allItemsSelected = useMemo(() => {
    return drops.length > 0 && drops.every((drop) => checkedDrops[drop.id]);
  }, [drops, checkedDrops]);

  // Count total selected items
  const selectedCount = useMemo(() => {
    return Object.values(checkedDrops).filter(Boolean).length;
  }, [checkedDrops]);

  const handleToggleCheck = (dropId: string) => {
    setCheckedDrops((prev) => ({
      ...prev,
      [dropId]: !prev[dropId],
    }));
  };

  const handleToggleSelectAll = () => {
    if (allItemsSelected) {
      // If all items are selected, deselect all
      setCheckedDrops({});
    } else {
      // Otherwise, select all
      const allChecked = drops.reduce((acc, drop) => {
        acc[drop.id] = true;
        return acc;
      }, {} as Record<string, boolean>);

      setCheckedDrops(allChecked);
    }
  };

  const handleResetAll = async () => {
    if (!hasCheckedItems || isResetting) return;

    setIsResetting(true);
    setResetProgress(0);

    // Get all selected drop IDs
    const selectedDropIds = Object.entries(checkedDrops)
      .filter(([_, isChecked]) => isChecked)
      .map(([dropId, _]) => dropId);

    // Simulate reset process with delay
    let completed = 0;

    for (const dropId of selectedDropIds) {
      // Simulate API call for each drop (replace with actual reset logic)
      await new Promise((resolve) =>
        setTimeout(resolve, 200 + Math.random() * 300)
      );

      completed++;
      setResetProgress(completed);

      // Update the checked state for this drop
      setCheckedDrops((prev) => ({
        ...prev,
        [dropId]: false,
      }));
    }

    // Finish resetting
    setTimeout(() => {
      setIsResetting(false);
      setResetProgress(0);
    }, 500);
  };

  const intersectionElementRef = useIntersectionObserver(() => {
    console.log("intersectionElementRef");
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  return (
    <div
      className="tw-space-y-4 lg:tw-space-y-6 tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-pl-0 lg:tw-pr-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300"
      style={myVotesViewStyle}
    >
      {drops.length === 0 && !isFetching ? (
        <div className="tw-mt-10">
          <p className="tw-text-iron-500 tw-text-sm tw-text-center">
            You haven't voted on any submissions in this wave yet.
          </p>
        </div>
      ) : (
        <div className="tw-space-y-4 tw-mt-2">
          {drops.length > 0 && (
            <div className="tw-pl-1">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                <SecondaryButton
                  onClicked={handleToggleSelectAll}
                  size="sm"
                  disabled={isResetting}
                >
                  {allItemsSelected ? "Deselect All" : "Select All"}
                </SecondaryButton>
                <SecondaryButton
                  onClicked={handleResetAll}
                  size="sm"
                  disabled={!hasCheckedItems || isResetting}
                >
                  {isResetting ? "Resetting..." : "Reset Votes"}
                </SecondaryButton>
              </div>

              {isResetting && (
                <div className="tw-mt-3 tw-px-0.5">
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-1 tw-text-xs tw-text-iron-400">
                    <span>Resetting votes...</span>
                    <span className="tw-font-medium">
                      {resetProgress} / {selectedCount}
                    </span>
                  </div>
                  <div className="tw-h-1 tw-w-full tw-bg-iron-800 tw-rounded-full tw-overflow-hidden">
                    <div
                      className="tw-h-full tw-bg-primary-500 tw-rounded-full tw-transition-all tw-duration-200 tw-ease-out"
                      style={{
                        width: `${(resetProgress / selectedCount) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="tw-space-y-2">
            {drops.map((drop) => (
              <MyStreamWaveMyVote
                key={drop.id}
                drop={drop}
                onDropClick={onDropClick}
                isChecked={!!checkedDrops[drop.id]}
                onToggleCheck={handleToggleCheck}
              />
            ))}
            {isFetchingNextPage && <WaveLeaderboardLoadingBar />}
            <div ref={intersectionElementRef}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyStreamWaveMyVotes;
