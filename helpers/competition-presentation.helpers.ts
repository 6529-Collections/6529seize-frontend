import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiCompetitionOutcome } from "@/generated/models/ApiCompetitionOutcome";
import type { ApiCompetitionAward } from "@/generated/models/ApiCompetitionAward";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveOutcome } from "@/generated/models/ApiWaveOutcome";
import type { ApiWaveDecisionAward } from "@/generated/models/ApiWaveDecisionAward";
import type { ApiWaveDecisionsStrategy } from "@/generated/models/ApiWaveDecisionsStrategy";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

// Presentation only: keep the real wave ID. Reads and writes still use the
// explicit competition identity, never this projection's legacy wave endpoints.
export function competitionPresentationWave(
  wave: ApiWave,
  competition: ApiCompetition
): ApiWave {
  return {
    ...wave,
    name: competition.title,
    pauses: [],
    voting: {
      ...wave.voting,
      credit_type: competition.voting
        .credit_type as ApiWave["voting"]["credit_type"],
      credit_scope: competition.voting
        .credit_scope as ApiWave["voting"]["credit_scope"],
      period: {
        min: competition.voting.starts_at,
        max: competition.voting.ends_at,
      },
      authenticated_user_eligible: competition.permissions.vote,
      forbid_negative_votes: competition.voting.forbid_negative_votes,
      signature_required: competition.voting.signature_required,
    },
    participation: {
      ...wave.participation,
      period: {
        min: competition.participation.starts_at,
        max: competition.participation.ends_at,
      },
      authenticated_user_eligible: competition.permissions.submit,
      no_of_applications_allowed_per_participant:
        competition.participation.max_entries_per_participant,
    },
    wave: {
      ...wave.wave,
      type:
        competition.type === ApiCompetitionType.Approve
          ? ApiWaveType.Approve
          : ApiWaveType.Rank,
      winning_threshold: competition.winners.winning_min_threshold,
      winning_threshold_min_duration_ms:
        competition.winners.winning_threshold_min_duration_ms,
      max_winners: competition.winners.max_winners,
      time_lock_ms: competition.decisions.time_lock_ms,
      decisions_strategy: competition.decisions
        .strategy as ApiWaveDecisionsStrategy | null,
      next_decision_time: competition.decisions.next_decision_time,
      no_of_decisions_done: null,
      no_of_decisions_left: null,
      total_no_of_decisions: null,
    },
  };
}

export function competitionAward(
  award: ApiCompetitionAward
): ApiWaveDecisionAward {
  return {
    type: award.type as ApiWaveDecisionAward["type"],
    description: award.description,
    ...(award.credit
      ? { credit: award.credit as NonNullable<ApiWaveDecisionAward["credit"]> }
      : {}),
    ...(award.rep_category ? { rep_category: award.rep_category } : {}),
    ...(award.amount !== null ? { amount: award.amount } : {}),
  };
}

export function competitionOutcome(
  outcome: ApiCompetitionOutcome
): ApiWaveOutcome {
  return {
    index: outcome.position,
    type: outcome.type as ApiWaveOutcome["type"],
    description: outcome.description,
    ...(outcome.subtype
      ? { subtype: outcome.subtype as NonNullable<ApiWaveOutcome["subtype"]> }
      : {}),
    ...(outcome.credit
      ? { credit: outcome.credit as NonNullable<ApiWaveOutcome["credit"]> }
      : {}),
    ...(outcome.rep_category ? { rep_category: outcome.rep_category } : {}),
    ...(outcome.amount !== null ? { amount: outcome.amount } : {}),
  };
}
