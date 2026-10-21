import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { QueryKey } from "../query-keys";
import type { ApiCompetitionCreditBudget } from "@/generated/models/ApiCompetitionCreditBudget";
import type { ApiDropCompetitionContext } from "@/generated/models/ApiDropCompetitionContext";
import type { ApiCompetitionEntry } from "@/generated/models/ApiCompetitionEntry";
import type { ApiCompetitionMyVotePage } from "@/generated/models/ApiCompetitionMyVotePage";
import type { ApiDropsLeaderboardPage } from "@/generated/models/ApiDropsLeaderboardPage";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiDropWithoutWaveV2View } from "@/services/api/drop-v2-view.types";
import type { ApiWaveV3 } from "@/generated/models/ApiWaveV3";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";

interface VoteResult {
  readonly waveId: string;
  readonly competitionId: string;
  readonly entryId: string;
  readonly dropId: string;
  readonly viewer: string | null;
  readonly budget: ApiCompetitionCreditBudget;
  readonly isCurrentViewer: () => boolean;
}

function updateOwnVote<T extends ApiDropWithoutWaveV2View>(
  drop: T,
  budget: ApiCompetitionCreditBudget,
  currentVote: number
): T {
  const context = drop.context_profile_context;
  const submission = drop.submission_context;
  const votingContext = submission?.voting.context_profile_context;
  return {
    ...drop,
    ...(context
      ? { context_profile_context: { ...context, rating: currentVote } }
      : {}),
    ...(submission && votingContext
      ? {
          submission_context: {
            ...submission,
            voting: {
              ...submission.voting,
              context_profile_context: {
                ...votingContext,
                current: currentVote,
                min: budget.min_vote ?? votingContext.min,
                max: budget.max_vote ?? votingContext.max,
              },
            },
          },
        }
      : {}),
  };
}

export async function updateCompetitionVoteInCache(
  client: QueryClient,
  result: VoteResult
) {
  const { waveId, competitionId, entryId, dropId, viewer, budget } = result;
  const currentVote = budget.current_vote;
  if (
    budget.competition_id !== competitionId ||
    budget.entry_id !== entryId ||
    currentVote === null
  )
    return;
  const scope = { wave_id: waveId, competition_id: competitionId, viewer };
  const creditKey = [QueryKey.COMPETITION_CREDITS, scope];
  const contextKey = [
    QueryKey.COMPETITION_DROP_CONTEXT,
    { wave_id: waveId, drop_id: dropId, viewer },
  ];
  const resourceKey = [QueryKey.COMPETITION_RESOURCE, scope];
  const isLegacyPrimary =
    client.getQueryData<ApiWaveV3>([
      QueryKey.COMPETITION_HUB,
      { wave_id: waveId, viewer },
    ])?.legacy_primary_competition_id === competitionId;
  // A read started before the save must not overwrite the confirmed result.
  await Promise.all(
    [
      creditKey,
      contextKey,
      resourceKey,
      ...(isLegacyPrimary && result.isCurrentViewer()
        ? [[QueryKey.DROPS_LEADERBOARD, { waveId }]]
        : []),
    ].map((queryKey) => client.cancelQueries({ queryKey }))
  );
  client.setQueryData(
    [QueryKey.COMPETITION_CREDITS, { ...scope, entry_id: entryId }],
    budget
  );
  client.setQueriesData<ApiCompetitionCreditBudget>(
    { queryKey: creditKey },
    (old) =>
      old?.entry_id === null && budget.credit_scope === ApiWaveCreditScope.Wave
        ? {
            ...old,
            available: budget.available,
            spent: budget.spent,
            remaining: budget.remaining,
          }
        : old
  );
  const updateContext = (old: ApiDropCompetitionContext) =>
    old.entry?.id === entryId && old.vote_summary
      ? {
          ...old,
          vote_summary: { ...old.vote_summary, user_vote: currentVote },
        }
      : old;
  client.setQueriesData<ApiDropCompetitionContext>(
    { queryKey: contextKey },
    (old) => (old ? updateContext(old) : old)
  );
  client.setQueriesData<{ entry: ApiCompetitionEntry; drop: ExtendedDrop }>(
    { queryKey: [...resourceKey, "drop", entryId, dropId] },
    (old) => {
      if (!old) return old;
      const known = old.drop.competition_context;
      return {
        ...old,
        drop: {
          ...updateOwnVote(old.drop, budget, currentVote),
          ...(known?.viewer === viewer
            ? {
                competition_context: {
                  ...known,
                  data: updateContext(known.data),
                },
              }
            : {}),
        },
      };
    }
  );
  client.setQueriesData<InfiniteData<ApiCompetitionMyVotePage>>(
    { queryKey: [...resourceKey, "votes/me"] },
    (old) =>
      old && {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.map((vote) =>
            vote.entry_id === entryId
              ? {
                  ...vote,
                  value: currentVote,
                  // Per-entry spend is ABS(value); budget.spent covers the scope.
                  credit_spent: Math.abs(currentVote),
                }
              : vote
          ),
        })),
      }
  );
  // Cancellation can outlive the viewer; this shared cache has no viewer key.
  if (isLegacyPrimary && result.isCurrentViewer()) {
    client.setQueriesData<InfiniteData<ApiDropsLeaderboardPage>>(
      { queryKey: [QueryKey.DROPS_LEADERBOARD, { waveId }] },
      (old) =>
        old && {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            drops: page.drops.map((drop) =>
              drop.id === dropId
                ? updateOwnVote(drop, budget, currentVote)
                : drop
            ),
          })),
        }
    );
  }
}
