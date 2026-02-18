"use client";

import React, { useState, useMemo } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import MyStreamWaveMyVote from "./MyStreamWaveMyVote";
import { useLayout } from "../layout/LayoutContext";
import { WaveLeaderboardLoadingBar } from "@/components/waves/leaderboard/drops/WaveLeaderboardLoadingBar";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import MyStreamWaveMyVotesReset from "./MyStreamWaveMyVotesReset";

interface MyStreamWaveMyVotesProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MyStreamWaveMyVotes: React.FC<MyStreamWaveMyVotesProps> = ({
  wave,
  onDropClick,
}) => {
  const [pausePolling, setPausePolling] = useState(false);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      sort: WaveDropsLeaderboardSort.MY_REALTIME_VOTE,
      pausePolling,
    });

  const { myVotesViewStyle } = useLayout();

  // State to track checked drops
  const [checkedDrops, setCheckedDrops] = useState<Set<string>>(new Set());

  const sharedAvailableVotes = useMemo(() => {
    const dropWithContext = drops.find((drop) => drop.context_profile_context);
    if (!dropWithContext) {
      return null;
    }

    const currentVoteValue =
      dropWithContext.context_profile_context?.rating ?? 0;
    const maxRating = dropWithContext.context_profile_context?.max_rating;

    if (typeof maxRating !== "number") {
      return null;
    }

    return Math.max(0, maxRating - currentVoteValue);
  }, [drops]);

  // Check if all items are selected
  const allItemsSelected = useMemo(() => {
    return !!drops.length && drops.every((drop) => checkedDrops.has(drop.id));
  }, [drops, checkedDrops]);

  const handleToggleCheck = (dropId: string) => {
    setCheckedDrops((prev) => {
      if (prev.has(dropId)) {
        prev.delete(dropId);
      } else {
        prev.add(dropId);
      }
      return new Set(prev);
    });
  };

  const handleToggleSelectAll = () => {
    if (allItemsSelected) {
      // If all items are selected, deselect all
      setCheckedDrops(new Set());
    } else {
      // Otherwise, select all
      setCheckedDrops(new Set(drops.map((drop) => drop.id)));
    }
  };

  const removeSelected = (dropId: string) => {
    setCheckedDrops((prev) => {
      prev.delete(dropId);
      return new Set(prev);
    });
  };

  const intersectionElementRef = useIntersectionObserver(async () => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      await fetchNextPage();
    }
  });

  return (
    <div
      className="tw-space-y-4 tw-overflow-y-auto tw-px-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-px-4 lg:tw-space-y-6"
      style={myVotesViewStyle}
    >
      {drops.length === 0 && !isFetching ? (
        <div className="tw-mt-10">
          <p className="tw-text-center tw-text-sm tw-text-iron-500">
            You haven&apos;t voted on any submissions in this wave yet.
          </p>
        </div>
      ) : (
        <div className="tw-mt-4 tw-space-y-4">
          <MyStreamWaveMyVotesReset
            haveDrops={!!drops.length}
            availableVotes={sharedAvailableVotes}
            selected={checkedDrops}
            onToggleSelectAll={handleToggleSelectAll}
            allItemsSelected={allItemsSelected}
            removeSelected={removeSelected}
            setPausePolling={setPausePolling}
          />
          <div className="tw-space-y-2">
            {drops.map((drop) => (
              <MyStreamWaveMyVote
                key={drop.id}
                drop={drop}
                onDropClick={onDropClick}
                isChecked={checkedDrops.has(drop.id)}
                onToggleCheck={handleToggleCheck}
                isResetting={pausePolling}
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
