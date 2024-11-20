import { ApiCreateNewWave } from "../../generated/models/ApiCreateNewWave";
import { ApiCreateWaveDropRequest } from "../../generated/models/ApiCreateWaveDropRequest";
import { ApiIntRange } from "../../generated/models/ApiIntRange";
import { ApiWaveCreditScope } from "../../generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "../../generated/models/ApiWaveCreditType";
import { ApiWaveOutcome } from "../../generated/models/ApiWaveOutcome";
import { ApiWaveOutcomeCredit } from "../../generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeSubType } from "../../generated/models/ApiWaveOutcomeSubType";
import { ApiWaveOutcomeType } from "../../generated/models/ApiWaveOutcomeType";
import { ApiWaveType } from "../../generated/models/ApiWaveType";
import {
  CreateWaveApprovalConfig,
  CreateWaveConfig,
  CreateWaveDatesConfig,
  CreateWaveDropsConfig,
  CreateWaveDropsRequiredMetadata,
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeConfigWinnersConfig,
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
  CreateWaveStep,
  CreateWaveVotingConfig,
  WaveOverviewConfig,
  WaveSignatureType,
} from "../../types/waves.types";
import { assertUnreachable } from "../AllowlistToolHelpers";

export enum CREATE_WAVE_VALIDATION_ERROR {
  NAME_REQUIRED = "NAME_REQUIRED",
  SUBMISSION_START_DATE_REQUIRED = "SUBMISSION_START_DATE_REQUIRED",
  VOTING_START_DATE_REQUIRED = "VOTING_START_DATE_REQUIRED",
  SUBMISSION_START_DATE_MUST_EQUAL_VOTING_START_DATE = "SUBMISSION_START_DATE_MUST_EQUAL_VOTING_START_DATE",
  SUBMISSION_START_DATE_MUST_BE_BEFORE_VOTING_START_DATE = "SUBMISSION_START_DATE_MUST_BE_BEFORE_VOTING_START_DATE",
  END_DATE_REQUIRED = "END_DATE_REQUIRED",
  END_DATE_MUST_BE_AFTER_VOTING_START_DATE = "END_DATE_MUST_BE_AFTER_VOTING_START_DATE",
  DROPS_REQUIRED_METADATA_NON_UNIQUE = "DROPS_REQUIRED_METADATA_NON_UNIQUE",
  VOTING_PROFILE_ID_REQUIRED = "VOTING_PROFILE_ID_REQUIRED",
  VOTING_PROFILE_ID_MUST_BE_EMPTY = "VOTING_PROFILE_ID_MUST_BE_EMPTY",
  VOTING_CATEGORY_REQUIRED = "VOTING_CATEGORY_REQUIRED",
  VOTING_CATEGORY_MUST_BE_EMPTY = "VOTING_CATEGORY_MUST_BE_EMPTY",
  APPROVAL_THRESHOLD_REQUIRED = "APPROVAL_THRESHOLD_REQUIRED",
  APPROVAL_THRESHOLD_TIME_REQUIRED = "APPROVAL_THRESHOLD_TIME_REQUIRED",
  APPROVAL_THRESHOLD_TIME_MUST_BE_SMALLER_THAN_WAVE_DURATION = "APPROVAL_THRESHOLD_TIME_MUST_BE_SMALLER_THAN_WAVE_DURATION",
  OUTCOMES_REQUIRED = "OUTCOMES_REQUIRED",
}

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
        return CreateWaveStep.VOTING;
      }
      return CreateWaveStep.OUTCOMES;
    default:
      assertUnreachable(step);
      return null;
  }
};

const getOverviewValidationErrors = ({
  overview,
}: {
  readonly overview: WaveOverviewConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  if (!overview.name) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED);
  }
  return errors;
};

const getDatesValidationErrors = ({
  waveType,
  dates,
}: {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  if (!dates.submissionStartDate) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_START_DATE_REQUIRED);
  }
  if (!dates.votingStartDate) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_REQUIRED);
  }
  if (waveType !== ApiWaveType.Rank) {
    if (dates.submissionStartDate !== dates.votingStartDate) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_START_DATE_MUST_EQUAL_VOTING_START_DATE
      );
    }
  } else {
    if (dates.submissionStartDate > dates.votingStartDate) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_START_DATE_MUST_BE_BEFORE_VOTING_START_DATE
      );
    }
    if (!dates.endDate) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED);
    } else if (dates.endDate < dates.votingStartDate) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
      );
    }
  }
  return errors;
};

const isRequiredMetadataRowsNonUnique = ({
  requiredMetadata,
}: {
  requiredMetadata: CreateWaveDropsRequiredMetadata[];
}): boolean => {
  const keys = requiredMetadata.map((item) => item.key);
  return new Set(keys).size !== keys.length;
};

const getDropsValidationErrors = ({
  drops,
}: {
  readonly drops: CreateWaveDropsConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  if (!drops.requiredMetadata.length) {
    return errors;
  }
  if (
    isRequiredMetadataRowsNonUnique({
      requiredMetadata: drops.requiredMetadata,
    })
  ) {
    errors.push(
      CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_NON_UNIQUE
    );
  }
  return errors;
};

const getVotingValidationErrors = ({
  voting,
}: {
  readonly voting: CreateWaveVotingConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  if (voting.type === ApiWaveCreditType.Tdh) {
    if (voting.profileId) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_PROFILE_ID_MUST_BE_EMPTY);
    }
    if (voting.category) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_CATEGORY_MUST_BE_EMPTY);
    }
  } else {
    if (!voting.profileId) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_PROFILE_ID_REQUIRED);
    }
    if (!voting.category) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_CATEGORY_REQUIRED);
    }
  }
  return errors;
};

const getApprovalValidationErrors = ({
  waveType,
  approval,
  dates,
}: {
  readonly waveType: ApiWaveType;
  readonly approval: CreateWaveApprovalConfig;
  readonly dates: CreateWaveDatesConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  if (waveType !== ApiWaveType.Approve) {
    return errors;
  }
  if (!approval.threshold) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED);
  }
  if (!approval.thresholdTimeMs) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_REQUIRED);
  }
  if (approval.thresholdTimeMs && dates.endDate) {
    if (approval.thresholdTimeMs > dates.endDate - dates.submissionStartDate) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_MUST_BE_SMALLER_THAN_WAVE_DURATION
      );
    }
  }
  return errors;
};

const getOutcomesValidationErrors = ({
  waveType,
  outcomes,
}: {
  readonly waveType: ApiWaveType;
  readonly outcomes: CreateWaveOutcomeConfig[];
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  if (waveType === ApiWaveType.Chat) {
    return errors;
  }
  if (!outcomes.length) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.OUTCOMES_REQUIRED);
  }
  // TODO validate outcomes against rules
  return errors;
};

export const getCreateWaveValidationErrors = ({
  step,
  config,
}: {
  readonly step: CreateWaveStep;
  readonly config: CreateWaveConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  errors.push(...getOverviewValidationErrors({ overview: config.overview }));
  if (step === CreateWaveStep.OVERVIEW) {
    return errors;
  }
  if (step === CreateWaveStep.GROUPS) {
    return errors;
  }
  errors.push(
    ...getDatesValidationErrors({
      waveType: config.overview.type,
      dates: config.dates,
    })
  );
  if (step === CreateWaveStep.DATES) {
    return errors;
  }
  errors.push(
    ...getDropsValidationErrors({
      drops: config.drops,
    })
  );
  if (step === CreateWaveStep.DROPS) {
    return errors;
  }
  errors.push(...getVotingValidationErrors({ voting: config.voting }));
  if (step === CreateWaveStep.VOTING) {
    return errors;
  }
  errors.push(
    ...getApprovalValidationErrors({
      approval: config.approval,
      dates: config.dates,
      waveType: config.overview.type,
    })
  );
  if (step === CreateWaveStep.APPROVAL) {
    return errors;
  }
  errors.push(
    ...getOutcomesValidationErrors({
      outcomes: config.outcomes,
      waveType: config.overview.type,
    })
  );
  if (step === CreateWaveStep.OUTCOMES) {
    return errors;
  }
  return errors;
};

const getIsVotingSignatureRequired = ({
  config,
}: {
  readonly config: CreateWaveConfig;
}): boolean => {
  return (
    config.overview.signatureType === WaveSignatureType.DROPS_AND_VOTING ||
    config.overview.signatureType === WaveSignatureType.VOTING
  );
};

const getIsParticipationSignatureRequired = ({
  config,
}: {
  readonly config: CreateWaveConfig;
}): boolean => {
  return (
    config.overview.signatureType === WaveSignatureType.DROPS_AND_VOTING ||
    config.overview.signatureType === WaveSignatureType.DROPS
  );
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

const calculatePercentages = ({
  values,
  totalAmount,
}: {
  values: number[];
  totalAmount: number;
}): number[] => {
  const sum = values.reduce((acc, value) => acc + value, 0);
  if (sum !== totalAmount) {
    throw new Error("Total amount does not match the sum of the values.");
  }

  // Calculate raw percentages and floor them
  let percentages = values.map((value) =>
    Math.floor((value / totalAmount) * 100)
  );

  // Calculate remaining points to distribute (due to rounding down)
  const remainingPoints = 100 - percentages.reduce((acc, p) => acc + p, 0);

  // Distribute remaining points to the largest original values first
  const indexesOrderedByValue = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .map((item) => item.index);

  for (let i = 0; i < remainingPoints; i++) {
    percentages[indexesOrderedByValue[i % indexesOrderedByValue.length]]++;
  }

  return percentages;
};

const getOutcomesDistribution = ({
  winnersConfig,
}: {
  readonly winnersConfig: CreateWaveOutcomeConfigWinnersConfig;
}): number[] =>
  winnersConfig.creditValueType ===
  CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE
    ? winnersConfig.winners.map((winner) => +winner.value)
    : calculatePercentages({
        values: winnersConfig.winners.map((winner) => winner.value),
        totalAmount: winnersConfig.totalAmount,
      });

const getRankOutcomes = ({
  config,
}: {
  readonly config: CreateWaveConfig;
}): ApiWaveOutcome[] => {
  const outcomes: ApiWaveOutcome[] = [];
  for (const outcome of config.outcomes) {
    if (outcome.type === CreateWaveOutcomeType.MANUAL && outcome.title) {
      outcomes.push({
        type: ApiWaveOutcomeType.Manual,
        description: outcome.title,
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
        distribution: getOutcomesDistribution({
          winnersConfig: outcome.winnersConfig,
        }),
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
        distribution: getOutcomesDistribution({
          winnersConfig: outcome.winnersConfig,
        }),
      });
    }
  }
  return outcomes;
};

const getApproveOutcomes = ({
  config,
}: {
  readonly config: CreateWaveConfig;
}): ApiWaveOutcome[] => {
  const outcomes: ApiWaveOutcome[] = [];
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
}): ApiWaveOutcome[] => {
  const waveType = config.overview.type;
  switch (waveType) {
    case ApiWaveType.Chat:
      return [];
    case ApiWaveType.Approve:
      // TODO add max winners
      return getApproveOutcomes({ config });
    case ApiWaveType.Rank:
      // TODO add max winners
      return getRankOutcomes({ config });
    default:
      assertUnreachable(waveType);
      return [];
  }
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
  return {
    name: config.overview.name,
    description_drop: drop,
    picture,
    voting: {
      scope: {
        group_id: config.groups.canVote,
      },
      credit_type: config.voting.type,
      credit_scope: ApiWaveCreditScope.Wave,
      credit_category: config.voting.category,
      creditor_id: config.voting.profileId,
      signature_required: getIsVotingSignatureRequired({ config }),
      period: {
        min: config.dates.votingStartDate,
        max: config.dates.endDate,
      },
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
      signature_required: getIsParticipationSignatureRequired({ config }),
      period: {
        min: config.dates.submissionStartDate,
        max: config.dates.endDate,
      },
    },
    chat: {
      scope: {
        group_id: config.groups.canChat,
      },
      enabled: config.chat.enabled,
    },
    wave: {
      type: config.overview.type,
      winning_thresholds: getWinningThreshold({ config }),
      // TODO - should be in outcomes
      max_winners: null,
      time_lock_ms: config.approval.thresholdTimeMs,
      admin_group: {
        group_id: config.groups.admin,
      }
    },
    outcomes: getOutcomes({ config }),
  };
};
