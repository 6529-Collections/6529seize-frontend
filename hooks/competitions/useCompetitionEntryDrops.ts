"use client";

import { useQueries } from "@tanstack/react-query";
import { useCompetition } from "@/contexts/CompetitionContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { fetchDropV2ById } from "@/services/api/wave-drops-v2-api";
import {
  competitionScope,
  fetchDropCompetitionContext,
} from "@/services/api/competitions-api";
import { applyCompetitionDropSummary } from "./useCompetitionDrop";
import { useCompetitionViewer } from "./useCompetitionQueries";

interface CompetitionEntryReference {
  readonly entryId: string;
  readonly dropId: string;
}

export function useCompetitionEntryDrops(
  entries: readonly CompetitionEntryReference[]
) {
  const { competition } = useCompetition();
  const viewer = useCompetitionViewer();
  const identity = {
    waveId: competition.wave_id,
    competitionId: competition.id,
  };
  return useQueries({
    queries: entries.map(({ entryId, dropId }) => ({
      queryKey: [
        QueryKey.COMPETITION_RESOURCE,
        { ...competitionScope(identity), viewer },
        "drop",
        entryId,
        dropId,
      ],
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const context = await fetchDropCompetitionContext(
          identity.waveId,
          dropId,
          signal
        );
        if (!context.entry || !context.competition) return null;
        if (
          context.entry.id !== entryId ||
          context.competition.id !== identity.competitionId
        ) {
          throw new Error("Invalid competition entry");
        }
        if (
          ![
            ApiCompetitionEntryStatus.Active,
            ApiCompetitionEntryStatus.Winner,
          ].includes(context.entry.status)
        )
          return null;
        // Native competition drops are immutable; hydrate the original rich
        // content only after checking membership and visibility in this scope.
        const original = await fetchDropV2ById(dropId, signal, {
          includeFullMetadata: true,
        });
        if (original.wave.id !== identity.waveId)
          throw new Error("Invalid competition parent");
        const drop = applyCompetitionDropSummary(
          {
            ...original,
            type: DropSize.FULL,
            stableKey: `${identity.competitionId}:${entryId}`,
            stableHash: `${identity.competitionId}:${entryId}`,
          },
          context
        );
        drop.wave = {
          ...drop.wave,
          authenticated_user_eligible_to_vote:
            context.competition.permissions.vote,
          forbid_negative_votes:
            context.competition.voting.forbid_negative_votes,
        };
        if (context.entry.status === ApiCompetitionEntryStatus.Winner) {
          drop.drop_type = ApiDropType.Winner;
          drop.winning_context = {
            place: context.entry.rank ?? 1,
            decision_time: context.entry.won_at ?? context.entry.submitted_at,
            awards: [],
          };
        }
        return { entry: context.entry, drop };
      },
      staleTime: 15_000,
      refetchInterval: 30_000,
      retry: false,
    })),
  });
}
