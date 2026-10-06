"use client";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";

import { useEffect } from "react";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionResource } from "@/hooks/competitions/useCompetitionQueries";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import { useCompetitionDropNavigation } from "@/hooks/competitions/useCompetitionDropNavigation";
import {
  competitionAward,
  competitionPresentationWave,
} from "@/helpers/competition-presentation.helpers";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { WaveWinnersDrops } from "@/components/waves/winners/drops/WaveWinnersDrops";
import { WaveWinnersPodium } from "@/components/waves/winners/podium/WaveWinnersPodium";
import { WaveWinnersTimeline } from "@/components/waves/winners/WaveWinnersTimeline";
import { getWaveOutcomeVisibilityFromMetadata } from "@/helpers/waves/wave-metadata.helpers";
import { CompetitionState } from "./CompetitionState";
import { CompetitionLoadMore } from "./CompetitionLoadMore";

export default function CompetitionWinners() {
  const { competition, wave } = useCompetition();
  const identity = { waveId: wave.id, competitionId: competition.id };
  const query = useCompetitionResource(identity, "winners");
  const awards = useCompetitionResource(identity, "awards");
  const entries = query.data?.pages.flatMap((page) => page.data) ?? [];
  const drops = useCompetitionEntryDrops(
    entries.map((entry) => ({ entryId: entry.id, dropId: entry.drop_id }))
  );
  const onDropClick = useCompetitionDropNavigation();
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = awards;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isError]);
  if (
    query.isPending ||
    awards.isPending ||
    drops.some((drop) => drop.isPending)
  )
    return <CompetitionState />;
  if (query.isError || awards.isError || drops.some((drop) => drop.isError))
    return (
      <CompetitionState
        error
        retry={() => {
          void query.refetch();
          void awards.refetch();
          drops.forEach((drop) => void drop.refetch());
        }}
      />
    );
  const presentation = competitionPresentationWave(wave, competition);
  const outcomesVisible = getWaveOutcomeVisibilityFromMetadata(
    (competition.presentation ?? []).map((item, id) => ({ ...item, id }))
  );
  const allAwards = awards.data.pages.flatMap((page) => page.data);
  const groups = new Map<string, ApiWaveDecision>();
  const winners: ApiWaveDecisionWinner[] = [];
  for (const result of drops) {
    if (!result.data) continue;
    const { entry, drop } = result.data;
    const winnerAwards = allAwards
      .filter(
        (award) =>
          award.entry_id === entry.id && award.decision_id === entry.decision_id
      )
      .map(competitionAward);
    const winner = {
      place: entry.rank ?? 1,
      awards: winnerAwards,
      drop: {
        ...drop,
        winning_context: {
          place: entry.rank ?? 1,
          decision_time: entry.won_at ?? entry.submitted_at,
          awards: winnerAwards,
        },
      },
    };
    winners.push(winner);
    const groupId = entry.decision_id ?? entry.id;
    const group = groups.get(groupId) ?? {
      decision_time: entry.won_at ?? entry.submitted_at,
      winners: [],
    };
    group.winners.push(winner);
    groups.set(groupId, group);
  }
  const isApprove = competition.type === ApiCompetitionType.Approve;
  const strategy = presentation.wave.decisions_strategy;
  const multiDecision =
    !!strategy &&
    (strategy.is_rolling || strategy.subsequent_decisions.length > 0);
  let content;
  if (isApprove) {
    content = (
      <WaveWinnersDrops
        wave={presentation}
        onDropClick={onDropClick}
        winners={winners}
        isApprovalWave
        emptyMessage="No drops approved yet"
        outcomesVisible={outcomesVisible}
      />
    );
  } else if (multiDecision) {
    content = (
      <WaveWinnersTimeline
        wave={presentation}
        onDropClick={onDropClick}
        decisionPoints={[...groups.values()]}
        isLoading={false}
        outcomesVisible={outcomesVisible}
      />
    );
  } else {
    content = (
      <>
        <WaveWinnersPodium
          isLoading={false}
          winners={winners}
          onDropClick={onDropClick}
          outcomesVisible={outcomesVisible}
        />
        <WaveWinnersDrops
          wave={presentation}
          winners={winners}
          onDropClick={onDropClick}
          outcomesVisible={outcomesVisible}
        />
      </>
    );
  }
  return (
    <div className="tw-space-y-4">
      {content}
      <CompetitionLoadMore query={query} />
    </div>
  );
}
