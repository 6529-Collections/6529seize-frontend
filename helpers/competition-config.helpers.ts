import type { ApiCompetitionDraftInput } from "@/generated/models/ApiCompetitionDraftInput";
import { ApiCompetitionRulesInputTypeEnum } from "@/generated/models/ApiCompetitionRulesInput";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWaveOutcomeType } from "@/generated/models/ApiWaveOutcomeType";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getCreateNewWaveBody } from "@/helpers/waves/create-wave.helpers";
import {
  getCreateWaveDisplayMetadataRequests,
  getApproveWaveDisplayMetadataDraft,
  getWaveCustomRulesFromMetadata,
  getWaveOutcomeVisibilityFromMetadata,
  getWaveSubmissionButtonLabelOverrideFromMetadata,
  getWaveProposalCardConfigFromMetadata,
} from "@/helpers/waves/wave-metadata.helpers";
import {
  CreateWaveOutcomeType,
  CreateWaveOutcomeConfigWinnersCreditValueType,
  type CreateWaveConfig,
} from "@/types/waves.types";

export function competitionFormToDraft(
  config: CreateWaveConfig,
  description: string
): ApiCompetitionDraftInput {
  const body = getCreateNewWaveBody({
    config,
    picture: null,
    drop: {
      title: null,
      parts: [],
      metadata: [],
      mentioned_users: [],
      referenced_nfts: [],
      signature: null,
    },
  });
  return {
    title: config.overview.name,
    description: description.trim() || null,
    participation: body.participation,
    voting: body.voting,
    rules: {
      type:
        config.overview.type === ApiWaveType.Approve
          ? ApiCompetitionRulesInputTypeEnum.Approve
          : ApiCompetitionRulesInputTypeEnum.Rank,
      winning_threshold: body.wave.winning_threshold,
      winning_threshold_min_duration_ms:
        body.wave.winning_threshold_min_duration_ms ?? null,
      max_winners: body.wave.max_winners,
      max_votes_per_identity_to_drop:
        body.wave.max_votes_per_identity_to_drop ?? null,
      time_lock_ms: body.wave.time_lock_ms,
      decisions_strategy: body.wave.decisions_strategy,
    },
    outcomes: body.outcomes,
    presentation: getCreateWaveDisplayMetadataRequests({
      display: config.display,
      waveType: config.overview.type,
      ongoingRanking: config.dates.ongoingRanking ?? false,
    }),
  };
}

export function competitionDraftToForm(
  input: ApiCompetitionDraftInput,
  defaults: CreateWaveConfig,
  wave: ApiWave
): CreateWaveConfig {
  const metadata = input.presentation.map((item, index) => ({
    ...item,
    id: index,
  }));
  const isRank = input.rules.type === ApiCompetitionRulesInputTypeEnum.Rank;
  const strategy = input.rules.decisions_strategy;
  return {
    ...defaults,
    overview: {
      ...defaults.overview,
      type: isRank ? ApiWaveType.Rank : ApiWaveType.Approve,
      typeSelected: true,
      name: input.title,
    },
    groups: {
      canView: wave.visibility.scope.group?.id ?? null,
      admin: wave.wave.admin_group.group?.id ?? null,
      canChat: wave.chat.scope.group?.id ?? null,
      canDrop: input.participation.scope.group_id,
      canVote: input.voting.scope.group_id,
    },
    dates: {
      ...defaults.dates,
      submissionStartDate: input.participation.period?.min ?? Date.now(),
      votingStartDate: input.voting.period?.min ?? Date.now(),
      endDate: input.voting.period?.max ?? null,
      firstDecisionTime:
        strategy?.first_decision_time ?? defaults.dates.firstDecisionTime,
      subsequentDecisions: strategy?.subsequent_decisions ?? [],
      isRolling: strategy?.is_rolling ?? false,
      ongoingRanking: isRank && strategy === null,
    },
    drops: {
      ...defaults.drops,
      noOfApplicationsAllowedPerParticipant:
        input.participation.no_of_applications_allowed_per_participant,
      requiredTypes: input.participation.required_media,
      requiredMetadata: input.participation.required_metadata.map((item) => ({
        key: item.name,
        type: item.type,
      })),
      terms: input.participation.terms,
      signatureRequired: input.participation.signature_required,
      submissionStrategy: input.participation.submission_strategy ?? null,
    },
    voting: {
      ...defaults.voting,
      type: input.voting.credit_type,
      creditScope: input.voting.credit_scope ?? ApiWaveCreditScope.Wave,
      category: input.voting.credit_category,
      profileId: input.voting.creditor_id,
      creditNfts: input.voting.credit_nfts ?? [],
      allowNegativeVotes: !input.voting.forbid_negative_votes,
      maxVotesPerIdentityPerDrop: input.rules.max_votes_per_identity_to_drop,
      timeWeighted: {
        enabled: Boolean(input.rules.time_lock_ms),
        averagingInterval: (input.rules.time_lock_ms ?? 0) / 60_000,
        averagingIntervalUnit: "minutes",
      },
    },
    approval: {
      threshold: input.rules.winning_threshold,
      thresholdTimeMs:
        input.rules.winning_threshold_min_duration_ms === 0
          ? null
          : input.rules.winning_threshold_min_duration_ms,
      maxWinners: input.rules.max_winners,
    },
    outcomes: input.outcomes.map((outcome) => ({
      type: getOutcomeType(outcome.type, outcome.credit),
      title: outcome.description || null,
      credit: outcome.amount ?? null,
      category: outcome.rep_category ?? null,
      winnersConfig: isRank
        ? {
            totalAmount: outcome.amount ?? 0,
            creditValueType:
              outcome.type === ApiWaveOutcomeType.Manual
                ? CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE
                : CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE,
            winners:
              outcome.distribution?.map((item) => ({
                value: item.amount ?? 0,
              })) ?? [],
          }
        : null,
    })),
    display: {
      ...defaults.display,
      approve: getApproveWaveDisplayMetadataDraft(metadata),
      customRules: getWaveCustomRulesFromMetadata(metadata),
      outcomesVisible: getWaveOutcomeVisibilityFromMetadata(metadata),
      submissionButtonLabel:
        getWaveSubmissionButtonLabelOverrideFromMetadata(metadata),
      proposalCards: getWaveProposalCardConfigFromMetadata(null, metadata),
    },
  };
}

function getOutcomeType(
  type: ApiWaveOutcomeType,
  credit: ApiWaveOutcomeCredit | null | undefined
) {
  if (type === ApiWaveOutcomeType.Manual) return CreateWaveOutcomeType.MANUAL;
  return credit === ApiWaveOutcomeCredit.Rep
    ? CreateWaveOutcomeType.REP
    : CreateWaveOutcomeType.NIC;
}
