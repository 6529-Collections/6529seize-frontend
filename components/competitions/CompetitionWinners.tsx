"use client";
import { useMemo } from "react";
import { ApiCompetitionCapability } from "@/generated/models/ApiCompetitionCapability";
import { useWaveProposalCardPresentation } from "@/hooks/waves/useWaveProposalCardPresentation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";

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
  const locale = useBrowserLocale();
  const proposalCardPresentation = useWaveProposalCardPresentation(wave.id);
  const contentPresentation = competition.capabilities.includes(
    ApiCompetitionCapability.Quorum
  )
    ? "quorumCompact"
    : proposalCardPresentation;
  const identity = { waveId: wave.id, competitionId: competition.id };
  const query = useCompetitionResource(identity, "winners", {
    direction: "DESC",
    limit: "10",
    include: "cards",
  });
  const entries = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data]
  );
  const references = useMemo(
    () =>
      entries.map((entry) => ({ entryId: entry.id, dropId: entry.drop_id })),
    [entries]
  );
  const cards = useMemo(
    () => ({
      contexts: query.data?.pages.flatMap((page) => page.cards ?? []) ?? [],
      updatedAt: query.dataUpdatedAt,
    }),
    [query.data, query.dataUpdatedAt]
  );
  const drops = useCompetitionEntryDrops(references, cards);
  const onDropClick = useCompetitionDropNavigation();
  if (query.isPending) return <CompetitionState />;
  const haveDrops = drops.some((drop) => drop.data);
  const loadingDrops = drops.some((drop) => drop.isPending);
  const failed = query.isError || drops.some((drop) => drop.isError);
  const retry = () => {
    void query.refetch();
    drops.filter((drop) => drop.isError).forEach((drop) => void drop.refetch());
  };
  if (loadingDrops && !haveDrops) return <CompetitionState />;
  if (failed && !haveDrops) return <CompetitionState error retry={retry} />;
  const presentation = competitionPresentationWave(wave, competition);
  const outcomesVisible = getWaveOutcomeVisibilityFromMetadata(
    (competition.presentation ?? []).map((item, id) => ({ ...item, id }))
  );
  const groups = new Map<string, ApiWaveDecision>();
  const winners: ApiWaveDecisionWinner[] = [];
  for (const result of drops) {
    if (!result.data) continue;
    const { entry, drop } = result.data;
    const winnerAwards = result.data.awards
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
        emptyMessage={t(locale, "competitions.noApprovedEntries")}
        outcomesVisible={outcomesVisible}
        contentPresentation={contentPresentation}
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
        contentPresentation={contentPresentation}
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
          contentPresentation={contentPresentation}
        />
      </>
    );
  }
  return (
    <div className="tw-space-y-4">
      {content}
      {loadingDrops && <CompetitionState />}
      {failed && <CompetitionState error retry={retry} />}
      <CompetitionLoadMore query={query} />
    </div>
  );
}
