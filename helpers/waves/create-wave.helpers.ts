import type { ApiCreateNewWave } from "@/generated/models/ApiCreateNewWave";
import type { ApiCreateWaveDropRequest } from "@/generated/models/ApiCreateWaveDropRequest";
import { MEMES_CONTRACT } from "@/constants/constants";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeSubType } from "@/generated/models/ApiWaveOutcomeSubType";
import { ApiWaveOutcomeType } from "@/generated/models/ApiWaveOutcomeType";
import { ApiWaveParticipationIdentitySubmissionAllowDuplicates } from "@/generated/models/ApiWaveParticipationIdentitySubmissionAllowDuplicates";
import type { ApiWaveParticipationSubmissionStrategy } from "@/generated/models/ApiWaveParticipationSubmissionStrategy";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { normalizeWaveCustomRules } from "@/helpers/waves/wave-metadata.helpers";
import type {
  CreateWaveConfig,
  CreateWaveDatesConfig,
  TimeWeightedVotingSettings,
} from "@/types/waves.types";
import { CreateWaveOutcomeType, CreateWaveStep } from "@/types/waves.types";
import { assertUnreachable } from "../AllowlistToolHelpers";
import type { ApiCreateWaveOutcome } from "@/generated/models/ApiCreateWaveOutcome";

/**
 * Converts time-weighted voting settings to milliseconds, ensuring it's within acceptable range
 * @param timeWeighted The time-weighted voting configuration
 * @returns The time lock in milliseconds, constrained within acceptable range
 */
const getTimeWeightedLockMs = (
  timeWeighted: TimeWeightedVotingSettings
): number => {
  // Constants
  const MIN_MINUTES = 5;
  const MAX_HOURS = 24;
  const MINUTE_IN_MS = 60 * 1000;
  const HOUR_IN_MS = 60 * MINUTE_IN_MS;
  const MIN_MS = MIN_MINUTES * MINUTE_IN_MS;
  const MAX_MS = MAX_HOURS * HOUR_IN_MS;

  // Calculate milliseconds based on unit
  let ms: number;
  if (timeWeighted.averagingIntervalUnit === "minutes") {
    ms = timeWeighted.averagingInterval * MINUTE_IN_MS;
  } else {
    ms = timeWeighted.averagingInterval * HOUR_IN_MS;
  }

  // Enforce minimum and maximum constraints
  return Math.max(MIN_MS, Math.min(MAX_MS, ms));
};

const getCreateWaveTimeLockMs = ({
  config,
  endDate,
}: {
  readonly config: CreateWaveConfig;
  readonly endDate: number | null;
}): number | null => {
  if (
    config.overview.type === ApiWaveType.Chat ||
    !config.voting.timeWeighted.enabled
  ) {
    return null;
  }

  const timeLockMs = getTimeWeightedLockMs(config.voting.timeWeighted);

  if (config.overview.type !== ApiWaveType.Approve || endDate === null) {
    return timeLockMs;
  }

  const waveDurationMs = Math.max(
    0,
    endDate - config.dates.submissionStartDate
  );

  if (timeLockMs > waveDurationMs) {
    throw new Error(
      CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION
    );
  }

  return timeLockMs;
};

const isPositiveFiniteNumber = (
  value: number | null | undefined
): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isPositiveWholeNumber = (
  value: number | null | undefined
): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export const getCreateWaveNextStep = ({
  step,
  waveType,
}: {
  readonly step: CreateWaveStep;
  readonly waveType: ApiWaveType;
}): CreateWaveStep | null => {
  switch (step) {
    case CreateWaveStep.OVERVIEW:
      return CreateWaveStep.GROUPS;
    case CreateWaveStep.GROUPS:
      if (waveType === ApiWaveType.Chat) {
        return CreateWaveStep.RULES;
      }
      return CreateWaveStep.DATES;
    case CreateWaveStep.DATES:
      return CreateWaveStep.DROPS;
    case CreateWaveStep.DROPS:
      if (waveType === ApiWaveType.Chat) {
        return CreateWaveStep.VOTING;
      }
      return CreateWaveStep.RULES;
    case CreateWaveStep.RULES:
      if (waveType === ApiWaveType.Chat) {
        return CreateWaveStep.DESCRIPTION;
      }
      return CreateWaveStep.VOTING;
    case CreateWaveStep.VOTING:
      if (waveType === ApiWaveType.Chat) {
        return CreateWaveStep.DESCRIPTION;
      }
      return CreateWaveStep.OUTCOMES;
    case CreateWaveStep.APPROVAL:
      return CreateWaveStep.OUTCOMES;
    case CreateWaveStep.OUTCOMES:
      return CreateWaveStep.DESCRIPTION;
    case CreateWaveStep.DESCRIPTION:
      return null;
    default:
      assertUnreachable(step);
      return null;
  }
};

export const getCreateWavePreviousStep = ({
  step,
  waveType,
}: {
  readonly step: CreateWaveStep;
  readonly waveType: ApiWaveType;
}): CreateWaveStep | null => {
  switch (step) {
    case CreateWaveStep.OVERVIEW:
      return null;
    case CreateWaveStep.GROUPS:
      return CreateWaveStep.OVERVIEW;
    case CreateWaveStep.DATES:
      return CreateWaveStep.GROUPS;
    case CreateWaveStep.DROPS:
      if (waveType === ApiWaveType.Chat) {
        return CreateWaveStep.GROUPS;
      }
      return CreateWaveStep.DATES;
    case CreateWaveStep.RULES:
      if (waveType === ApiWaveType.Chat) {
        return CreateWaveStep.GROUPS;
      }
      return CreateWaveStep.DROPS;
    case CreateWaveStep.VOTING:
      if (waveType !== ApiWaveType.Chat) {
        return CreateWaveStep.RULES;
      }
      return CreateWaveStep.DROPS;
    case CreateWaveStep.APPROVAL:
      return CreateWaveStep.VOTING;
    case CreateWaveStep.OUTCOMES:
      return CreateWaveStep.VOTING;
    case CreateWaveStep.DESCRIPTION:
      if (waveType === ApiWaveType.Chat) {
        return CreateWaveStep.RULES;
      }
      return CreateWaveStep.OUTCOMES;
    default:
      assertUnreachable(step);
      return null;
  }
};

const getRankOutcomes = ({
  config,
}: {
  readonly config: CreateWaveConfig;
}): ApiCreateWaveOutcome[] => {
  const outcomes: ApiCreateWaveOutcome[] = [];
  for (const outcome of config.outcomes) {
    const winnersConfig = outcome.winnersConfig;

    if (
      outcome.type === CreateWaveOutcomeType.MANUAL &&
      outcome.title &&
      winnersConfig
    ) {
      outcomes.push({
        type: ApiWaveOutcomeType.Manual,
        description: outcome.title,
        distribution: winnersConfig.winners.map((winner) => ({
          amount: winner.value,
          description: outcome.title,
        })),
      });
    } else if (
      outcome.type === CreateWaveOutcomeType.REP &&
      outcome.category &&
      winnersConfig &&
      isPositiveFiniteNumber(winnersConfig.totalAmount)
    ) {
      outcomes.push({
        type: ApiWaveOutcomeType.Automatic,
        subtype: ApiWaveOutcomeSubType.CreditDistribution,
        description: "Rep distribution",
        credit: ApiWaveOutcomeCredit.Rep,
        rep_category: outcome.category,
        amount: winnersConfig.totalAmount,
        distribution: winnersConfig.winners.map((winner) => ({
          amount: winner.value,
          description: null,
        })),
      });
    } else if (
      outcome.type === CreateWaveOutcomeType.NIC &&
      winnersConfig &&
      isPositiveFiniteNumber(winnersConfig.totalAmount)
    ) {
      outcomes.push({
        type: ApiWaveOutcomeType.Automatic,
        subtype: ApiWaveOutcomeSubType.CreditDistribution,
        description: "NIC distribution",
        credit: ApiWaveOutcomeCredit.Cic,
        amount: winnersConfig.totalAmount,
        distribution: winnersConfig.winners.map((winner) => ({
          amount: winner.value,
          description: null,
        })),
      });
    }
  }
  return outcomes;
};

const getApproveOutcomes = ({
  config,
}: {
  readonly config: CreateWaveConfig;
}): ApiCreateWaveOutcome[] => {
  const outcomes: ApiCreateWaveOutcome[] = [];
  for (const outcome of config.outcomes) {
    if (outcome.type === CreateWaveOutcomeType.MANUAL && outcome.title) {
      outcomes.push({
        type: ApiWaveOutcomeType.Manual,
        description: outcome.title,
      });
    } else if (
      outcome.type === CreateWaveOutcomeType.REP &&
      outcome.category &&
      isPositiveFiniteNumber(outcome.credit)
    ) {
      outcomes.push({
        type: ApiWaveOutcomeType.Automatic,
        subtype: ApiWaveOutcomeSubType.CreditDistribution,
        description: "",
        credit: ApiWaveOutcomeCredit.Rep,
        rep_category: outcome.category,
        amount: outcome.credit,
      });
    } else if (
      outcome.type === CreateWaveOutcomeType.NIC &&
      isPositiveFiniteNumber(outcome.credit)
    ) {
      outcomes.push({
        type: ApiWaveOutcomeType.Automatic,
        subtype: ApiWaveOutcomeSubType.CreditDistribution,
        description: "",
        credit: ApiWaveOutcomeCredit.Cic,
        amount: outcome.credit,
      });
    }
  }
  return outcomes;
};

const getOutcomes = ({
  config,
}: {
  readonly config: CreateWaveConfig;
}): ApiCreateWaveOutcome[] => {
  const waveType = config.overview.type;
  switch (waveType) {
    case ApiWaveType.Chat:
      return [];
    case ApiWaveType.Approve:
      return getApproveOutcomes({ config });
    case ApiWaveType.Rank:
      return getRankOutcomes({ config });
    default:
      assertUnreachable(waveType);
      return [];
  }
};

const getApproveMaxWinners = ({
  config,
}: {
  readonly config: CreateWaveConfig;
}): number | null => {
  if (config.overview.type !== ApiWaveType.Approve) {
    return null;
  }

  return isPositiveWholeNumber(config.approval.maxWinners)
    ? config.approval.maxWinners
    : null;
};

/**
 * Calculates the last decision time that will occur in a rolling wave before the given end date
 * @param firstDecisionTime The timestamp of the first decision
 * @param subsequentDecisions Array of intervals between decisions in ms
 * @param userEndDate The user-specified end date
 * @returns The timestamp of the last decision that will occur before the end date
 */
export const calculateLastDecisionTime = (
  firstDecisionTime: number,
  subsequentDecisions: number[],
  userEndDate: number
): number => {
  // If no subsequent decisions, just return the first decision time
  if (subsequentDecisions.length === 0) {
    return firstDecisionTime;
  }

  // Calculate the total length of one decision cycle
  const cycleLength = subsequentDecisions.reduce(
    (sum, interval) => sum + interval,
    0
  );

  // Calculate time remaining after first decision until end date
  const timeRemainingAfterFirst = userEndDate - firstDecisionTime;

  // If end date is before or at first decision time, return first decision time
  if (timeRemainingAfterFirst <= 0) {
    return firstDecisionTime;
  }

  // Calculate how many complete cycles fit in the remaining time
  const completeCycles = Math.floor(timeRemainingAfterFirst / cycleLength);

  // Start with the time after all complete cycles
  let lastDecisionTime = firstDecisionTime + completeCycles * cycleLength;

  // Calculate time for partial cycle
  const remainingTime = timeRemainingAfterFirst % cycleLength;

  // Process partial cycle - find the last decision that fits
  let accumulatedTime = 0;
  for (const interval of subsequentDecisions) {
    accumulatedTime += interval;
    if (accumulatedTime <= remainingTime) {
      lastDecisionTime += interval;
    } else {
      break;
    }
  }

  return lastDecisionTime;
};

/**
 * Calculates the end date based on the given dates configuration
 * @param dates The CreateWaveDatesConfig object
 * @returns The calculated end date in milliseconds, or null for open-ended rolling waves
 */
const calculateRankEndDate = (dates: CreateWaveDatesConfig): number | null => {
  // If subsequentDecisions is empty, end date is firstDecisionTime
  if (dates.subsequentDecisions.length === 0) {
    return dates.firstDecisionTime;
  }

  // If isRolling is false, end date is the sum of firstDecisionTime and all subsequentDecisions
  if (!dates.isRolling) {
    return (
      dates.firstDecisionTime +
      dates.subsequentDecisions.reduce((sum, current) => sum + current, 0)
    );
  }

  // Open-ended rolling waves keep both periods open.
  if (dates.endDate === null || !Number.isFinite(dates.endDate)) {
    return null;
  }

  // Calculate the last decision time that will occur before the user-specified end date
  return calculateLastDecisionTime(
    dates.firstDecisionTime,
    dates.subsequentDecisions,
    dates.endDate
  );
};

export const getCreateWaveEndDate = ({
  config,
}: {
  readonly config: CreateWaveConfig;
}): number | null => {
  if (config.overview.type === ApiWaveType.Chat) {
    return null;
  }

  if (config.overview.type === ApiWaveType.Approve) {
    return config.dates.endDate;
  }

  // Ongoing (perpetual) Rank waves never end: no decision schedule, no end
  // date. Only Rank reaches this point, but the explicit type gate keeps the
  // guarantee local rather than positional.
  if (
    config.overview.type === ApiWaveType.Rank &&
    config.dates.ongoingRanking
  ) {
    return null;
  }

  return calculateRankEndDate(config.dates);
};

const getSubmissionStrategyForWave = ({
  submissionStrategy,
  isPerpetualRank,
}: {
  readonly submissionStrategy: ApiWaveParticipationSubmissionStrategy;
  readonly isPerpetualRank: boolean;
}): ApiWaveParticipationSubmissionStrategy => {
  // A perpetual rank wave never announces winners, so "resubmit after a win"
  // could never unlock; it is behaviorally identical to "never again", and
  // the UI blocks it, but normalize here too in case validation was bypassed.
  if (
    isPerpetualRank &&
    submissionStrategy.config.duplicates ===
      ApiWaveParticipationIdentitySubmissionAllowDuplicates.AllowAfterWin
  ) {
    return {
      ...submissionStrategy,
      config: {
        ...submissionStrategy.config,
        duplicates:
          ApiWaveParticipationIdentitySubmissionAllowDuplicates.NeverAllow,
      },
    };
  }

  return submissionStrategy;
};

export const getCreateNewWaveBody = ({
  drop,
  picture,
  config,
  parentWaveId,
}: {
  readonly drop: ApiCreateWaveDropRequest;
  readonly picture: string | null;
  readonly config: CreateWaveConfig;
  readonly parentWaveId?: string | null | undefined;
}): ApiCreateNewWave => {
  const endDate = getCreateWaveEndDate({ config });
  const supportsParticipationTerms = config.overview.type !== ApiWaveType.Chat;
  const participationTerms = supportsParticipationTerms
    ? normalizeWaveCustomRules(config.drops.terms)
    : null;
  const signatureRequired =
    config.drops.signatureRequired && Boolean(participationTerms);
  const isPerpetualRank =
    config.overview.type === ApiWaveType.Rank &&
    Boolean(config.dates.ongoingRanking);

  return {
    name: config.overview.name,
    description_drop: drop,
    picture,
    ...(parentWaveId ? { parent_wave_id: parentWaveId } : {}),
    voting: {
      scope: {
        group_id: config.groups.canVote,
      },
      credit_type: config.voting.type ?? ApiWaveCreditType.TdhPlusXtdh,
      credit_scope: config.voting.creditScope ?? ApiWaveCreditScope.Wave,
      credit_category: config.voting.category,
      creditor_id: config.voting.profileId,
      signature_required: false,
      period: {
        min: config.dates.votingStartDate,
        max: endDate,
      },
      forbid_negative_votes: config.voting.allowNegativeVotes === false,
      ...(config.voting.type === ApiWaveCreditType.CardSetTdh
        ? {
            credit_nfts: config.voting.creditNfts.map((nft) => ({
              contract: MEMES_CONTRACT,
              token_id: nft.token_id,
            })),
          }
        : {}),
    },
    visibility: {
      scope: {
        group_id: config.groups.canView,
      },
    },
    participation: {
      scope: {
        group_id: config.groups.canDrop,
      },
      no_of_applications_allowed_per_participant:
        config.drops.noOfApplicationsAllowedPerParticipant,
      required_media: config.drops.requiredTypes,
      required_metadata: config.drops.requiredMetadata
        .map((metadata) => ({
          name: metadata.key,
          type: metadata.type,
        }))
        .filter((metadata) => !!metadata.name),
      signature_required: signatureRequired,
      period: {
        min: config.dates.submissionStartDate,
        max: endDate,
      },
      terms: signatureRequired ? participationTerms : null,
      ...(config.drops.submissionStrategy
        ? {
            submission_strategy: getSubmissionStrategyForWave({
              submissionStrategy: config.drops.submissionStrategy,
              isPerpetualRank,
            }),
          }
        : {}),
    },
    chat: {
      scope: {
        group_id: config.groups.canChat,
      },
      enabled: config.chat.enabled,
      links_disabled: false,
    },
    wave: {
      admin_drop_deletion_enabled: config.drops.adminCanDeleteDrops,
      type: config.overview.type,
      winning_threshold:
        config.overview.type === ApiWaveType.Approve
          ? config.approval.threshold
          : null,
      winning_threshold_min_duration_ms:
        config.overview.type === ApiWaveType.Approve
          ? (config.approval.thresholdTimeMs ?? 0)
          : null,
      max_winners: getApproveMaxWinners({ config }),
      max_votes_per_identity_to_drop:
        config.overview.type === ApiWaveType.Chat
          ? null
          : (config.voting.maxVotesPerIdentityPerDrop ?? null),
      time_lock_ms: getCreateWaveTimeLockMs({ config, endDate }),
      admin_group: {
        group_id: config.groups.admin,
      },
      decisions_strategy:
        config.overview.type === ApiWaveType.Rank && !isPerpetualRank
          ? {
              first_decision_time: config.dates.firstDecisionTime,
              subsequent_decisions: config.dates.subsequentDecisions,
              is_rolling: config.dates.isRolling,
            }
          : null,
    },
    // Ongoing rank waves never announce winners, so outcome awards would be
    // dead config; the live leaderboard is the outcome. Type-gated so a stray
    // flag can never strip outcomes from other wave types.
    outcomes: isPerpetualRank ? [] : getOutcomes({ config }),
  };
};
