"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
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
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import PrivilegedDropCreator, {
  DropMode,
} from "@/components/waves/PrivilegedDropCreator";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import { getVoteRationaleReplyMarkdown } from "@/helpers/waves/vote-rationale.helpers";

interface MyStreamWaveMyVotesProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

interface VoteRationaleReplyState {
  readonly drop: ExtendedDrop;
  readonly partId: number;
  readonly markdown: string;
  readonly markdownKey: string;
}

const MyStreamWaveMyVotes: React.FC<MyStreamWaveMyVotesProps> = ({
  wave,
  onDropClick,
}) => {
  const [isResettingVotes, setIsResettingVotes] = useState(false);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      sort: WaveDropsLeaderboardSort.MY_REALTIME_VOTE,
      enabled: !isResettingVotes,
    });
  const { isVotingControlsLocked, winningThreshold } = useApprovalWaveStatus({
    wave,
  });

  const { myVotesViewStyle } = useLayout();
  const creditScope =
    (wave as Partial<ApiWave>).voting?.credit_scope ?? ApiWaveCreditScope.Wave;

  const [checkedDrops, setCheckedDrops] = useState<Set<string>>(
    new Set<string>()
  );
  const [voteRationaleReply, setVoteRationaleReply] =
    useState<VoteRationaleReplyState | null>(null);

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
    if (isVotingControlsLocked) {
      return false;
    }

    return !!drops.length && drops.every((drop) => checkedDrops.has(drop.id));
  }, [drops, checkedDrops, isVotingControlsLocked]);

  const handleToggleCheck = (dropId: string) => {
    if (isVotingControlsLocked) {
      return;
    }

    setCheckedDrops((prev) => {
      const next = new Set(prev);
      if (next.has(dropId)) {
        next.delete(dropId);
      } else {
        next.add(dropId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (isVotingControlsLocked) {
      return;
    }

    if (allItemsSelected) {
      setCheckedDrops(new Set<string>());
    } else {
      setCheckedDrops(new Set(drops.map((drop) => drop.id)));
    }
  };

  const removeSelected = (dropId: string) => {
    setCheckedDrops((prev) => {
      const next = new Set(prev);
      next.delete(dropId);
      return next;
    });
  };

  const closeVoteRationaleReply = useCallback(() => {
    setVoteRationaleReply(null);
  }, []);

  const handleExplainVote = useCallback(
    (drop: ExtendedDrop, voteTotal: number, voteChange: number) => {
      const partId = drop.parts.at(0)?.part_id;
      if (partId === undefined) {
        return;
      }

      setVoteRationaleReply({
        drop,
        partId,
        markdown: getVoteRationaleReplyMarkdown({
          voteTotal,
          voteChange,
        }),
        markdownKey: `${drop.id}:${voteTotal}:${voteChange}:${Date.now()}`,
      });
    },
    []
  );

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      void fetchNextPage();
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
          {!isVotingControlsLocked && (
            <MyStreamWaveMyVotesReset
              waveId={wave.id}
              haveDrops={!!drops.length}
              availableVotes={
                creditScope === ApiWaveCreditScope.Wave
                  ? sharedAvailableVotes
                  : null
              }
              selected={checkedDrops}
              allItemsSelected={allItemsSelected}
              isVotingClosed={isVotingControlsLocked}
              onToggleSelectAll={handleToggleSelectAll}
              removeSelected={removeSelected}
              onResettingChange={setIsResettingVotes}
            />
          )}
          <div className="tw-space-y-2">
            {drops.map((drop) => (
              <React.Fragment key={drop.id}>
                <MyStreamWaveMyVote
                  drop={drop}
                  onDropClick={onDropClick}
                  onExplainVote={handleExplainVote}
                  isChecked={
                    !isVotingControlsLocked && checkedDrops.has(drop.id)
                  }
                  isResetting={isResettingVotes}
                  isVotingClosed={isVotingControlsLocked}
                  winningThreshold={winningThreshold}
                  onToggleCheck={handleToggleCheck}
                />
                {voteRationaleReply?.drop.id === drop.id && (
                  <div
                    className="tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-iron-950 tw-px-4 tw-py-3"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <PrivilegedDropCreator
                      activeDrop={{
                        action: ActiveDropAction.REPLY,
                        drop: voteRationaleReply.drop,
                        partId: voteRationaleReply.partId,
                      }}
                      onCancelReplyQuote={closeVoteRationaleReply}
                      onDropAddedToQueue={closeVoteRationaleReply}
                      wave={wave}
                      dropId={null}
                      fixedDropMode={DropMode.CHAT}
                      focusOnInitialActiveDrop
                      initialMarkdown={voteRationaleReply.markdown}
                      initialMarkdownKey={voteRationaleReply.markdownKey}
                    />
                  </div>
                )}
              </React.Fragment>
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
