"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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
  const identity = useMemo(
    () => ({
      waveId: competition.wave_id,
      competitionId: competition.id,
    }),
    [competition.wave_id, competition.id]
  );
  const waveMin = useMemo(
    () => getWaveMin(wave, identity.waveId),
    [wave, identity.waveId]
  );
  const cardMode = Boolean(cards);
  const keyFor = useCallback(
    ({ entryId, dropId }: CompetitionEntryReference) => [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      cardMode ? "card" : "drop",
      entryId,
      dropId,
    ],
    [identity, viewer, cardMode]
  );
  const seedFor = useCallback(
    ({ entryId, dropId }: CompetitionEntryReference) => {
      try {
        const context = cards?.contexts.find(
          (item) => item.entry.id === entryId
        );
        if (!context) return cards && cards.updatedAt > 0 ? null : undefined;
        if (context.entry.competition_id !== competition.id) return null;
        const original = competitionCardDrop(context, waveMin);
        if (original?.id !== dropId) return null;
        return presentCompetitionEntryDrop(
          { ...context, competition, original },
          identity,
          viewer,
          entryId,
          dropId
        );
      } catch {
        // Invalid embedded content must not crash rendering or cross parent scopes.
        return null;
      }
    },
    [cards, competition, waveMin, identity, viewer]
  );
  const visit = useMemo(
    () => JSON.stringify([identity, viewer, cards?.updatedAt, entries]),
    [identity, viewer, cards?.updatedAt, entries]
  );
  const projections = useMemo(
    () =>
      entries.map((reference) => ({
        reference,
        key: keyFor(reference),
        data: seedFor(reference),
      })),
    [entries, keyFor, seedFor]
  );
  const queries = useQueries({
    queries: projections.map(({ reference, key, data }) => ({
      queryKey: key,
      initialData: () => data,
      ...(cards ? { initialDataUpdatedAt: cards.updatedAt } : {}),
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const previous = client.getQueryData<PresentedDrop>(key);
        const result = await fetchCompetitionEntryDrop(
          identity,
          viewer,
          reference.entryId,
          reference.dropId,
          signal,
          cards ? { wave: waveMin, original: previous?.drop } : undefined
        );
        // A newer list response may have refreshed content while summaries loaded.
        const latest = cards && client.getQueryData<PresentedDrop>(key);
        if (cards && latest === null) return null;
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
    if (seeded.current === visit) return;
    seeded.current = visit;
    for (const { key, data } of projections) {
      const current = client.getQueryState(key);
      if (current && current.dataUpdatedAt > cards.updatedAt) continue;
      if (cards.updatedAt > 0)
        client.setQueryData(key, data ?? null, {
          updatedAt: cards.updatedAt,
        });
    }
  }, [cards, visit, client, projections]);
  return queries;
}
