"use client";

import { useEffect, useRef } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useCompetition } from "@/contexts/CompetitionContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import type { ApiCompetitionEntryContext } from "@/generated/models/ApiCompetitionEntryContext";
import {
  competitionCardDrop,
  fetchCompetitionEntryDrop,
} from "@/services/api/competition-entry-drops-api";
import { competitionScope } from "@/services/api/competitions-api";
import { getWaveMin } from "@/services/api/drop-v2-mappers";
import { presentCompetitionEntryDrop } from "@/helpers/competition-entry-drop.helpers";
import { useCompetitionViewer } from "./useCompetitionQueries";

interface CompetitionEntryReference {
  readonly entryId: string;
  readonly dropId: string;
}
interface CardPage {
  readonly contexts: readonly ApiCompetitionEntryContext[];
  readonly updatedAt: number;
}
type PresentedDrop = ReturnType<typeof presentCompetitionEntryDrop>;

export function useCompetitionEntryDrops(
  entries: readonly CompetitionEntryReference[],
  cards?: CardPage
) {
  const { competition, wave } = useCompetition();
  const client = useQueryClient();
  const seeded = useRef<string | null>(null);
  const viewer = useCompetitionViewer();
  const identity = {
    waveId: competition.wave_id,
    competitionId: competition.id,
  };
  const waveMin = getWaveMin(wave, identity.waveId);
  const keyFor = ({ entryId, dropId }: CompetitionEntryReference) => [
    QueryKey.COMPETITION_RESOURCE,
    { ...competitionScope(identity), viewer },
    cards ? "card" : "drop",
    entryId,
    dropId,
  ];
  const seedFor = ({ entryId, dropId }: CompetitionEntryReference) => {
    const context = cards?.contexts.find((item) => item.entry.id === entryId);
    if (!context) return cards && cards.updatedAt > 0 ? null : undefined;
    if (context.entry.competition_id !== competition.id)
      throw new Error("Invalid competition card parent");
    const original = competitionCardDrop(context, waveMin);
    if (original?.id !== dropId) return null;
    return presentCompetitionEntryDrop(
      { ...context, competition, original },
      identity,
      viewer,
      entryId,
      dropId
    );
  };
  const queries = useQueries({
    queries: entries.map((reference) => ({
      queryKey: keyFor(reference),
      initialData: () => seedFor(reference),
      ...(cards ? { initialDataUpdatedAt: cards.updatedAt } : {}),
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const previous = client.getQueryData<PresentedDrop>(keyFor(reference));
        const result = await fetchCompetitionEntryDrop(
          identity,
          viewer,
          reference.entryId,
          reference.dropId,
          signal,
          cards ? { wave: waveMin, original: previous?.drop } : undefined
        );
        // A newer list response may have refreshed content while summaries loaded.
        const latest =
          cards && client.getQueryData<PresentedDrop>(keyFor(reference));
        return presentCompetitionEntryDrop(
          result && latest ? { ...result, original: latest.drop } : result,
          identity,
          viewer,
          reference.entryId,
          reference.dropId
        );
      },
      staleTime: cards ? 60_000 : 15_000,
      refetchInterval: (query: {
        state: { data: PresentedDrop | undefined };
      }) =>
        query.state.data?.entry.status === ApiCompetitionEntryStatus.Winner
          ? false
          : 30_000,
      retry: false,
    })),
  });
  useEffect(() => {
    if (!cards) return;
    const visit = JSON.stringify([identity, viewer, cards.updatedAt, entries]);
    if (seeded.current === visit) return;
    seeded.current = visit;
    for (const reference of entries) {
      const data = seedFor(reference);
      if (cards.updatedAt > 0)
        client.setQueryData(keyFor(reference), data ?? null, {
          updatedAt: cards.updatedAt,
        });
    }
  });
  return queries;
}
