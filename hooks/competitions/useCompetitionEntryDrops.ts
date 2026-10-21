"use client";

import { useQueries } from "@tanstack/react-query";
import { useCompetition } from "@/contexts/CompetitionContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { fetchCompetitionEntryDrop } from "@/services/api/competition-entry-drops-api";
import { competitionScope } from "@/services/api/competitions-api";
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
        const result = await fetchCompetitionEntryDrop(
          identity,
          viewer,
          entryId,
          dropId,
          signal
        );
        if (!result) return null;
        const {
          original,
          entry,
          competition: currentCompetition,
          vote_summary,
          awards,
        } = result;
        const context = {
          entry,
          competition: currentCompetition,
          vote_summary,
        };
        if (
          ![
            ApiCompetitionEntryStatus.Active,
            ApiCompetitionEntryStatus.Winner,
          ].includes(entry.status)
        )
          return null;
        const drop = applyCompetitionDropSummary(
          {
            ...original,
            type: DropSize.FULL,
            stableKey: `${identity.competitionId}:${entryId}`,
            stableHash: `${identity.competitionId}:${entryId}`,
            competition_context: {
              viewer,
              waveId: identity.waveId,
              dropId,
              data: context,
            },
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
        return { entry: context.entry, drop, awards };
      },
      staleTime: 15_000,
      refetchInterval: competition.permissions.vote ? 30_000 : false,
      retry: false,
    })),
  });
}
