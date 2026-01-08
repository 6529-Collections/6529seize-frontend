import type { ApiCreateNewWave } from "@/generated/models/ApiCreateNewWave";
import type { ApiCreateWaveDropRequest } from "@/generated/models/ApiCreateWaveDropRequest";
import type { ApiIntRange } from "@/generated/models/ApiIntRange";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeSubType } from "@/generated/models/ApiWaveOutcomeSubType";
import { ApiWaveOutcomeType } from "@/generated/models/ApiWaveOutcomeType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type {
  CreateWaveConfig,
  CreateWaveDatesConfig,
  TimeWeightedVotingSettings} from "@/types/waves.types";
import {
  CreateWaveOutcomeType,
  CreateWaveStep
} from "@/types/waves.types";
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
        return CreateWaveStep.DESCRIPTION;
      }
      return CreateWaveStep.DATES;
    case CreateWaveStep.DATES:
      return CreateWaveStep.DROPS;
    case CreateWaveStep.DROPS:
      return CreateWaveStep.VOTING;
    case CreateWaveStep.VOTING:
      if (waveType === ApiWaveType.Approve) {
        return CreateWaveStep.APPROVAL;
      }
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
    case CreateWaveStep.VOTING:
      return CreateWaveStep.DROPS;
    case CreateWaveStep.APPROVAL:
      return CreateWaveStep.VOTING;
    case CreateWaveStep.OUTCOMES:
      if (waveType === ApiWaveType.Approve) {
        return CreateWaveStep.APPROVAL;
      }
      return CreateWaveStep.VOTING;
    case CreateWaveStep.DESCRIPTION:
      if (waveType === ApiWaveType.Chat) {
        return CreateWaveStep.GROUPS;
      }
      return CreateWaveStep.OUTCOMES;
    default:
      assertUnreachable(step);
      return null;
  }
};

const getWinningThreshold = ({
  config,
}: {
  readonly config: CreateWaveConfig;
}): ApiIntRange | null => {
  const waveType = config.overview.type;
  switch (waveType) {
    case ApiWaveType.Approve:
      return {
        min: config.approval.threshold,
        max: config.approval.threshold,
      };
    case ApiWaveType.Rank:
    case ApiWaveType.Chat:
      return null;
    default:
      assertUnreachable(waveType);
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
    if (
      outcome.type === CreateWaveOutcomeType.MANUAL &&
      outcome.title &&
      outcome.winnersConfig
    ) {
      outcomes.push({
        type: ApiWaveOutcomeType.Manual,
        description: outcome.title,
        distribution: outcome.winnersConfig.winners.map((winner) => ({
          amount: winner.value,
          description: outcome.title,
        })),
      });
    } else if (
      outcome.type === CreateWaveOutcomeType.REP &&
      outcome.category &&
      outcome.winnersConfig?.totalAmount
    ) {
      outcomes.push({
        type: ApiWaveOutcomeType.Automatic,
        subtype: ApiWaveOutcomeSubType.CreditDistribution,
        description: "Rep distribution",
        credit: ApiWaveOutcomeCredit.Rep,
        rep_category: outcome.category,
        amount: outcome.winnersConfig.totalAmount,
        distribution: outcome.winnersConfig.winners.map((winner) => ({
          amount: winner.value,
          description: null,
        })),
      });
    } else if (
      outcome.type === CreateWaveOutcomeType.NIC &&
      outcome.winnersConfig?.totalAmount
    ) {
      outcomes.push({
        type: ApiWaveOutcomeType.Automatic,
        subtype: ApiWaveOutcomeSubType.CreditDistribution,
        description: "NIC distribution",
        credit: ApiWaveOutcomeCredit.Cic,
        amount: outcome.winnersConfig.totalAmount,
        distribution: outcome.winnersConfig.winners.map((winner) => ({
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
    if (
      outcome.type === CreateWaveOutcomeType.MANUAL &&
      outcome.title &&
      outcome.maxWinners
    ) {
      outcomes.push({
        type: ApiWaveOutcomeType.Manual,
        description: outcome.title,
      });
    } else if (
      outcome.type === CreateWaveOutcomeType.REP &&
      outcome.category &&
      outcome.credit
    ) {
      outcomes.push({
        type: ApiWaveOutcomeType.Automatic,
        subtype: ApiWaveOutcomeSubType.CreditDistribution,
        description: "",
        credit: ApiWaveOutcomeCredit.Rep,
        rep_category: outcome.category,
        amount: outcome.credit,
      });
    } else if (outcome.type === CreateWaveOutcomeType.NIC && outcome.credit) {
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
 * @returns The calculated end date in milliseconds
 * @throws Error if isRolling is true and no end date is provided
 */
const calculateEndDate = (dates: CreateWaveDatesConfig): number => {
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

  // If isRolling is true, we need to calculate the last decision time
  if (dates.isRolling) {
    // Need an end date for rolling waves
    if (!dates.endDate) {
      throw new Error("End date must be explicitly set when isRolling is true");
    }

    // Calculate the last decision time that will occur before the user-specified end date
    return calculateLastDecisionTime(
      dates.firstDecisionTime,
      dates.subsequentDecisions,
      dates.endDate
    );
  }

  // This should never happen if all cases are covered
  return dates.endDate ?? dates.firstDecisionTime;
};

export const getCreateNewWaveBody = ({
  drop,
  picture,
  config,
}: {
  readonly drop: ApiCreateWaveDropRequest;
  readonly picture: string | null;
  readonly config: CreateWaveConfig;
}): ApiCreateNewWave => {
  const endDate = calculateEndDate(config.dates);

  return {
    name: config.overview.name,
    description_drop: drop,
    picture,
    voting: {
      scope: {
        group_id: config.groups.canVote,
      },
      credit_type: config.voting.type ?? ApiWaveCreditType.TdhPlusXtdh,
      credit_scope: ApiWaveCreditScope.Wave,
      credit_category: config.voting.category,
      creditor_id: config.voting.profileId,
      signature_required: false,
      period: {
        min: config.dates.votingStartDate,
        max: endDate,
      },
      forbid_negative_votes: false,
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
      signature_required: config.drops.signatureRequired,
      period: {
        min: config.dates.submissionStartDate,
        max: endDate,
      },
      terms: config.drops.terms,
    },
    chat: {
      scope: {
        group_id: config.groups.canChat,
      },
      enabled: config.chat.enabled,
    },
    wave: {
      admin_drop_deletion_enabled: config.drops.adminCanDeleteDrops,
      type: config.overview.type,
      winning_thresholds: getWinningThreshold({ config }),
      // TODO - should be in outcomes
      max_winners: null,
      time_lock_ms:
        config.overview.type === ApiWaveType.Rank &&
        config.voting.timeWeighted.enabled
          ? getTimeWeightedLockMs(config.voting.timeWeighted)
          : null,
      admin_group: {
        group_id: config.groups.admin,
      },
      decisions_strategy:
        config.overview.type === ApiWaveType.Rank
          ? {
              first_decision_time: config.dates.firstDecisionTime,
              subsequent_decisions: config.dates.subsequentDecisions,
              is_rolling: config.dates.isRolling,
            }
          : null,
    },
    outcomes: getOutcomes({ config }),
  };
};
