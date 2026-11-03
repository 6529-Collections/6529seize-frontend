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
): ApiWave & { competition: ApiCompetition } {
  return {
    ...wave,
    competition,
    name: competition.title,
    pauses: [],
    voting: {
      ...wave.voting,
      credit_type: competition.voting
        .credit_type as ApiWave["voting"]["credit_type"],
      credit_scope: competition.voting
        .credit_scope as ApiWave["voting"]["credit_scope"],
      credit_category: competition.voting.credit_category,
      credit_nfts: competition.voting
        .credit_nfts as ApiWave["voting"]["credit_nfts"],
      creditor:
        wave.voting.creditor?.id === competition.voting.credit_creditor
          ? wave.voting.creditor
          : null,
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
      signature_required: competition.participation.signature_required,
      terms: competition.participation.terms,
      required_metadata: competition.participation
        .required_metadata as ApiWave["participation"]["required_metadata"],
      required_media: competition.participation
        .required_media as unknown as ApiWave["participation"]["required_media"],
      submission_strategy:
        competition.participation.submission_type === "IDENTITY"
          ? ({
              type: competition.participation.submission_type,
              config: {
                who_can_be_submitted:
                  competition.participation.identity_submission_strategy,
                duplicates:
                  competition.participation.identity_submission_duplicates,
              },
            } as NonNullable<ApiWave["participation"]["submission_strategy"]>)
          : null,
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

/** Explicit native context takes precedence over wave identity for presentation. */
export function presentationCompetition(
  wave: ApiWave | null | undefined
): ApiCompetition | null {
  if (!wave || !("competition" in wave)) return null;
  const competition = wave.competition as ApiCompetition;
  return competition.wave_id === wave.id ? competition : null;
}
