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
  return {
    ...drop,
    drop_type: isWinner ? ApiDropType.Winner : ApiDropType.Participatory,
    ...(isWinner
      ? {
          winning_context: drop.winning_context ?? {
            place: entry.rank ?? 1,
            decision_time: entry.won_at ?? entry.submitted_at,
            awards: [],
          },
        }
      : {}),
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
