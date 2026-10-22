"use client";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";

import { isCompetitionAccessError } from "@/helpers/competition.helpers";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import { useCompetitionDropNavigation } from "@/hooks/competitions/useCompetitionDropNavigation";
import { useWaveLeaderboardRendererSet } from "@/components/waves/leaderboard/leaderboardRendererRegistry";
import { competitionPresentationWave } from "@/helpers/competition-presentation.helpers";
import { CompetitionState } from "./CompetitionState";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

export default function CompetitionEntryCard({
  entryId,
  dropId,
  disabled = false,
  onOpenDrop,
}: {
  readonly entryId: string;
  readonly dropId: string;
  readonly disabled?: boolean;
  readonly onOpenDrop?: (() => void) | undefined;
}) {
  const { competition, wave } = useCompetition();
  const { LeaderboardDrop } = useWaveLeaderboardRendererSet(
    wave.id,
    competition.capabilities
  );
  const [query] = useCompetitionEntryDrops([{ entryId, dropId }]);
  const onDropClick = useCompetitionDropNavigation();
  if (!query || query.isPending) return <CompetitionState />;
  if (query.isError && (!query.data || isCompetitionAccessError(query.error)))
    return <CompetitionState error retry={() => void query.refetch()} />;
  if (!query.data) return null;
  const openDrop = (drop: ExtendedDrop) => {
    onDropClick(drop);
    onOpenDrop?.();
  };
  return (
    <div id={`entry-${entryId}`} data-competition-entry={entryId}>
      <LeaderboardDrop
        drop={query.data.drop}
        onDropClick={openDrop}
        onDropContentClick={openDrop}
        onOpenDrop={onOpenDrop}
        wave={competitionPresentationWave(wave, competition)}
        winningThreshold={
          competition.type === ApiCompetitionType.Approve
            ? competition.winners.winning_min_threshold
            : null
        }
        winningThresholdMinDurationMs={
          competition.winners.winning_threshold_min_duration_ms
        }
        isVotingClosed={disabled}
        isVotingControlsLocked={!competition.permissions.vote}
      />
    </div>
  );
}
