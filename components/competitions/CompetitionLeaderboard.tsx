"use client";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";

import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";

import { useEffect, useMemo, useState } from "react";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionResource } from "@/hooks/competitions/useCompetitionQueries";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import { useCompetitionDropNavigation } from "@/hooks/competitions/useCompetitionDropNavigation";
import { competitionPresentationWave } from "@/helpers/competition-presentation.helpers";
import { WaveLeaderboardHeader } from "@/components/waves/leaderboard/header/WaveleaderboardHeader";
import { WaveLeaderboardTime } from "@/components/waves/leaderboard/WaveLeaderboardTime";
import { DefaultWaveLeaderboardDrop } from "@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop";
import { WaveLeaderboardGridItem } from "@/components/waves/leaderboard/grid/WaveLeaderboardGridItem";
import WaveApprovalStatusBar from "@/components/waves/approval/WaveApprovalStatusBar";
import type { LeaderboardViewMode } from "@/components/waves/leaderboard/types";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { CompetitionState } from "./CompetitionState";
import { CompetitionLoadMore } from "./CompetitionLoadMore";
import { Time } from "@/helpers/time";
import CompetitionMySubmissions from "./CompetitionMySubmissions";
import WaveLeaderboardError from "@/components/waves/leaderboard/WaveLeaderboardError";

const sorts: Partial<Record<WaveDropsLeaderboardSort, string>> = {
  RANK: "rating",
  REALTIME_VOTE: "real_time_rating",
  RATING_PREDICTION: "real_time_rating",
  TREND: "trend",
  CREATED_AT: "submitted_at",
};

export default function CompetitionLeaderboard({
  onCreateDrop,
}: {
  readonly onCreateDrop?: (() => void) | undefined;
}) {
  const { competition, wave } = useCompetition();
  const identity = { waveId: wave.id, competitionId: competition.id };
  const [viewMode, setViewMode] = useState<LeaderboardViewMode>("list");
  const [sort, setSort] = useState(WaveDropsLeaderboardSort.RANK);
  const query = useCompetitionResource(identity, "leaderboard", {
    sort: sorts[sort] ?? "rating",
  });
  const entries = query.data?.pages.flatMap((page) => page.data) ?? [];
  const drops = useCompetitionEntryDrops(
    entries.map((entry) => ({ entryId: entry.entry_id, dropId: entry.drop_id }))
  );
  const presentation = useMemo(
    () => competitionPresentationWave(wave, competition),
    [wave, competition]
  );
  const isApprove = competition.type === ApiCompetitionType.Approve;
  const winners = useCompetitionResource(
    identity,
    "winners",
    { limit: "100" },
    isApprove
  );
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = winners;
  useEffect(() => {
    if (isApprove && hasNextPage && !isFetchingNextPage && !isError)
      void fetchNextPage();
  }, [isApprove, hasNextPage, isFetchingNextPage, fetchNextPage, isError]);
  const approvedCount =
    winners.data?.pages.reduce((count, page) => count + page.data.length, 0) ??
    null;
  const end = competition.voting.ends_at;
  const maxReached =
    competition.winners.max_winners !== null &&
    approvedCount !== null &&
    approvedCount >= competition.winners.max_winners;
  const ended =
    (end !== null && end <= Time.currentMillis()) ||
    competition.lifecycle !== ApiCompetitionLifecycle.Published;
  const onDropClick = useCompetitionDropNavigation();
  let closeStatus: "max_reached" | "ended" | null = null;
  if (ended) closeStatus = "ended";
  if (maxReached) closeStatus = "max_reached";
  let content;
  if (query.isPending) content = <CompetitionState />;
  else if (query.isError && !entries.length) {
    content = (
      <WaveLeaderboardError
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  } else {
    content = (
      <>
        {query.isError && (
          <WaveLeaderboardError
            hasEntries
            retrying={query.isFetching}
            onRetry={() => {
              void query.refetch();
            }}
          />
        )}
        {!entries.length && <CompetitionState empty />}
        <div
          className={
            viewMode === "list"
              ? "tw-space-y-4"
              : "tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2"
          }
        >
          {drops.map((dropQuery, index) => {
            const entry = entries[index]!;
            if (dropQuery.isPending)
              return <CompetitionState key={entry.entry_id} />;
            if (dropQuery.isError)
              return (
                <CompetitionState
                  key={entry.entry_id}
                  error
                  retry={() => void dropQuery.refetch()}
                />
              );
            if (!dropQuery.data) return null;
            const props = {
              drop: dropQuery.data.drop,
              onDropClick,
              winningThreshold: isApprove
                ? competition.winners.winning_min_threshold
                : null,
              winningThresholdMinDurationMs:
                competition.winners.winning_threshold_min_duration_ms,
              isVotingClosed: ended || maxReached,
              isVotingControlsLocked:
                !isMultiCompetitionEnabled() || !competition.permissions.vote,
            };
            return (
              <div key={entry.entry_id} data-competition-entry={entry.entry_id}>
                {viewMode === "list" ? (
                  <DefaultWaveLeaderboardDrop
                    {...props}
                    mediaContainerHeightClassName="tw-h-96"
                  />
                ) : (
                  <WaveLeaderboardGridItem
                    {...props}
                    mode={viewMode === "grid" ? "compact" : "content_only"}
                  />
                )}
              </div>
            );
          })}
        </div>
        <CompetitionLoadMore query={query} />
      </>
    );
  }
  return (
    <div className="tw-space-y-4">
      {isApprove ? (
        <WaveApprovalStatusBar
          wave={presentation}
          approvedCount={winners.hasNextPage ? null : approvedCount}
          closeStatus={closeStatus}
          isApprovalCountError={winners.isError}
          retryApprovalCount={() => void winners.refetch()}
        />
      ) : (
        <WaveLeaderboardTime wave={presentation} />
      )}
      <WaveLeaderboardHeader
        wave={presentation}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sort={sort}
        onSortChange={setSort}
        onCreateDrop={onCreateDrop}
        additionalActions={<CompetitionMySubmissions />}
      />
      {content}
    </div>
  );
}
