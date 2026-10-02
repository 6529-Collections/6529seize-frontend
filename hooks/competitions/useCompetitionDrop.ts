"use client";

import { useQuery } from "@tanstack/react-query";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiDropCompetitionContext } from "@/generated/models/ApiDropCompetitionContext";
import type { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import type { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { fetchDropCompetitionContext } from "@/services/api/competitions-api";
import { useCompetitionViewer } from "./useCompetitionQueries";

function winnerContext(
  drop: ExtendedDrop,
  entry: NonNullable<ApiDropCompetitionContext["entry"]>
) {
  if (drop.winning_context) return drop.winning_context;
  if (
    entry.rank === null ||
    !Number.isSafeInteger(entry.rank) ||
    entry.rank < 1 ||
    entry.won_at === null ||
    !Number.isFinite(entry.won_at)
  )
    return null;
  return { place: entry.rank, decision_time: entry.won_at, awards: [] };
}

export function applyCompetitionDropSummary(
  drop: ExtendedDrop,
  context: ApiDropCompetitionContext | undefined
): ExtendedDrop {
  const competition = context?.competition;
  const entry = context?.entry;
  const summary = context?.vote_summary;
  if (
    !competition ||
    !entry ||
    !summary ||
    entry.drop_id !== drop.id ||
    entry.wave_id !== drop.wave.id ||
    entry.competition_id !== competition.id ||
    competition.wave_id !== drop.wave.id
  )
    return drop;
  const isWinner = entry.status === ApiCompetitionEntryStatus.Winner;
  if (!isWinner && entry.status !== ApiCompetitionEntryStatus.Active)
    return drop;
  const winningContext = isWinner ? winnerContext(drop, entry) : null;
  if (isWinner && !winningContext) return drop;
  const result = {
    ...drop,
    drop_type: isWinner ? ApiDropType.Winner : ApiDropType.Participatory,
    ...(winningContext ? { winning_context: winningContext } : {}),
    competition_id: competition.id,
    competition_title: competition.title,
    rating: summary.rating,
    realtime_rating: summary.realtime_rating,
    rating_prediction: summary.rating_prediction,
    raters_count: summary.raters_count,
    rank: summary.rank,
    over_threshold_since_ms: summary.over_threshold_since_ms ?? null,
    top_raters: summary.top_raters,
    context_profile_context: drop.context_profile_context
      ? { ...drop.context_profile_context, rating: summary.user_vote }
      : null,
    wave: {
      ...drop.wave,
      voting_credit_type: competition.voting.credit_type as ApiWaveCreditType,
      voting_credit_scope: competition.voting
        .credit_scope as ApiWaveCreditScope,
      voting_period_start: competition.voting.starts_at,
      voting_period_end: competition.voting.ends_at,
    },
  };
  if (!isWinner) delete result.winning_context;
  return result;
}

export function useCompetitionDrop(drop: ExtendedDrop) {
  const viewer = useCompetitionViewer();
  const context = useQuery({
    queryKey: [
      QueryKey.COMPETITION_DROP_CONTEXT,
      { wave_id: drop.wave.id, drop_id: drop.id, viewer },
    ],
    queryFn: ({ signal }) =>
      fetchDropCompetitionContext(drop.wave.id, drop.id, signal),
    enabled: !drop.id.startsWith("temp-"),
    retry: false,
    staleTime: 15_000,
    refetchInterval: (query) =>
      query.state.data?.competition ? 15_000 : false,
  });
  return applyCompetitionDropSummary(drop, context.data);
}
