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

  // Check if at least one checkbox is selected
  const hasCheckedItems = useMemo(() => {
    return Object.values(checkedDrops).some((isChecked) => isChecked);
  }, [checkedDrops]);

  // Check if all items are selected
  const allItemsSelected = useMemo(() => {
    return drops.length > 0 && drops.every((drop) => checkedDrops[drop.id]);
  }, [drops, checkedDrops]);

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

  const handleResetAll = () => {
    setCheckedDrops({});
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
            <div className="tw-flex tw-items-center tw-gap-4 tw-pl-1">
              <SecondaryButton onClicked={handleToggleSelectAll} size="sm">
                {allItemsSelected ? "Deselect All" : "Select All"}
              </SecondaryButton>
              {hasCheckedItems && (
                <SecondaryButton onClicked={handleResetAll} size="sm">
                  Reset Votes
                </SecondaryButton>
              )}
            </div>
          )}
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
      )}
    </div>
  );
};

export default MyStreamWaveMyVotes;
