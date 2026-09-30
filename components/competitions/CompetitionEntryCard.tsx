"use client";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";

import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import { useCompetitionDropNavigation } from "@/hooks/competitions/useCompetitionDropNavigation";
import { DefaultWaveLeaderboardDrop } from "@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop";
import { CompetitionState } from "./CompetitionState";

export default function CompetitionEntryCard({
  entryId,
  dropId,
  disabled = false,
}: {
  readonly entryId: string;
  readonly dropId: string;
  readonly disabled?: boolean;
}) {
  const { competition } = useCompetition();
  const [query] = useCompetitionEntryDrops([{ entryId, dropId }]);
  const onDropClick = useCompetitionDropNavigation();
  if (!query || query.isPending) return <CompetitionState />;
  if (query.isError)
    return <CompetitionState error retry={() => void query.refetch()} />;
  if (!query.data) return null;
  return (
    <div id={`entry-${entryId}`} data-competition-entry={entryId}>
      <DefaultWaveLeaderboardDrop
        drop={query.data.drop}
        onDropClick={onDropClick}
        winningThreshold={
          competition.type === ApiCompetitionType.Approve
            ? competition.winners.winning_min_threshold
            : null
        }
        winningThresholdMinDurationMs={
          competition.winners.winning_threshold_min_duration_ms
        }
        isVotingClosed={disabled}
        isVotingControlsLocked={
          !isMultiCompetitionEnabled() || !competition.permissions.vote
        }
        mediaContainerHeightClassName="tw-h-96"
      />
    </div>
  );
}
