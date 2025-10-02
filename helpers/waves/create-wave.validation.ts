import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { assertUnreachable } from "../AllowlistToolHelpers";
import {
  CreateWaveApprovalConfig,
  CreateWaveConfig,
  CreateWaveDatesConfig,
  CreateWaveDropsConfig,
  CreateWaveDropsRequiredMetadata,
  CreateWaveOutcomeConfig,
  CreateWaveStep,
  CreateWaveVotingConfig,
  WaveGroupsConfig,
  WaveOverviewConfig,
} from "@/types/waves.types";

export enum CREATE_WAVE_VALIDATION_ERROR {
  NAME_REQUIRED = "NAME_REQUIRED",
  NAME_TOO_LONG = "NAME_TOO_LONG",
  SUBMISSION_START_DATE_REQUIRED = "SUBMISSION_START_DATE_REQUIRED",
  VOTING_START_DATE_REQUIRED = "VOTING_START_DATE_REQUIRED",
  END_DATE_REQUIRED = "END_DATE_REQUIRED",
  VOTING_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_SUBMISSION_START_DATE = "VOTING_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_SUBMISSION_START_DATE",
  END_DATE_MUST_BE_AFTER_VOTING_START_DATE = "END_DATE_MUST_BE_AFTER_VOTING_START_DATE",
  DROPS_REQUIRED_METADATA_NON_UNIQUE = "DROPS_REQUIRED_METADATA_NON_UNIQUE",
  APPROVAL_THRESHOLD_REQUIRED = "APPROVAL_THRESHOLD_REQUIRED",
  APPROVAL_THRESHOLD_TIME_REQUIRED = "APPROVAL_THRESHOLD_TIME_REQUIRED",
  APPROVAL_THRESHOLD_TIME_MUST_BE_SMALLER_THAN_WAVE_DURATION = "APPROVAL_THRESHOLD_TIME_MUST_BE_SMALLER_THAN_WAVE_DURATION",
  OUTCOMES_REQUIRED = "OUTCOMES_REQUIRED",
  CHAT_WAVE_CANNOT_HAVE_APPLICATIONS_PER_PARTICIPANT = "CHAT_WAVE_CANNOT_HAVE_APPLICATIONS_PER_PARTICIPANT",
  CHAT_WAVE_CANNOT_HAVE_REQUIRED_TYPES = "CHAT_WAVE_CANNOT_HAVE_REQUIRED_TYPES",
  CHAT_WAVE_CANNOT_HAVE_REQUIRED_METADATA = "CHAT_WAVE_CANNOT_HAVE_REQUIRED_METADATA",
  APPLICATIONS_PER_PARTICIPANT_MUST_BE_POSITIVE = "APPLICATIONS_PER_PARTICIPANT_MUST_BE_POSITIVE",
  VOTING_TYPE_REQUIRED = "VOTING_TYPE_REQUIRED",
  CHAT_WAVE_CANNOT_HAVE_VOTING = "CHAT_WAVE_CANNOT_HAVE_VOTING",
  TDH_VOTING_CANNOT_HAVE_CATEGORY = "TDH_VOTING_CANNOT_HAVE_CATEGORY",
  TDH_VOTING_CANNOT_HAVE_PROFILE_ID = "TDH_VOTING_CANNOT_HAVE_PROFILE_ID",
  REP_VOTING_REQUIRES_CATEGORY = "REP_VOTING_REQUIRES_CATEGORY",
  REP_VOTING_REQUIRES_PROFILE_ID = "REP_VOTING_REQUIRES_PROFILE_ID",
  VOTING_CATEGORY_CANNOT_BE_EMPTY = "VOTING_CATEGORY_CANNOT_BE_EMPTY",
  VOTING_PROFILE_ID_CANNOT_BE_EMPTY = "VOTING_PROFILE_ID_CANNOT_BE_EMPTY",
  APPROVAL_THRESHOLD_MUST_BE_NULL = "APPROVAL_THRESHOLD_MUST_BE_NULL",
  TIME_WEIGHTED_VOTING_INTERVAL_TOO_SMALL = "TIME_WEIGHTED_VOTING_INTERVAL_TOO_SMALL",
  TIME_WEIGHTED_VOTING_INTERVAL_TOO_LARGE = "TIME_WEIGHTED_VOTING_INTERVAL_TOO_LARGE",
}

const MAX_NAME_LENGTH = 250;

const getOverviewValidationErrors = ({
  overview,
}: {
  readonly overview: WaveOverviewConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  if (!overview.name) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED);
  } else if (overview.name.length > MAX_NAME_LENGTH) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.NAME_TOO_LONG);
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

  if (waveType === ApiWaveType.Chat) {
    return errors;
  }

  if (!dates.submissionStartDate) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_START_DATE_REQUIRED);
  }
  if (!dates.votingStartDate) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_REQUIRED);
  }

  if (waveType === ApiWaveType.Rank) {
    if (dates.submissionStartDate && dates.votingStartDate) {
      if (dates.submissionStartDate > dates.votingStartDate) {
        errors.push(
          CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_SUBMISSION_START_DATE
        );
      }
    }
    if (!dates.endDate) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED);
    } else if (dates.votingStartDate && dates.endDate < dates.votingStartDate) {
      errors.push(
        CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
      );
    }
  } else if (waveType === ApiWaveType.Approve) {
    if (dates.submissionStartDate && dates.votingStartDate) {
      if (dates.submissionStartDate !== dates.votingStartDate) {
        errors.push(
          CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_SUBMISSION_START_DATE
        );
      }
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
  waveType,
  drops,
}: {
  readonly waveType: ApiWaveType;
  readonly drops: CreateWaveDropsConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];

  if (waveType === ApiWaveType.Chat) {
    // Chat waves cannot have any drops configuration
    if (drops.noOfApplicationsAllowedPerParticipant !== null) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_APPLICATIONS_PER_PARTICIPANT);
    }
    if (drops.requiredTypes.length > 0) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_REQUIRED_TYPES);
    }
    if (drops.requiredMetadata.length > 0) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_REQUIRED_METADATA);
    }
  } else {
    // Rank and Approve waves
    if (drops.noOfApplicationsAllowedPerParticipant !== null && drops.noOfApplicationsAllowedPerParticipant <= 0) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.APPLICATIONS_PER_PARTICIPANT_MUST_BE_POSITIVE);
    }

    // Check for unique metadata keys
    if (isRequiredMetadataRowsNonUnique({ requiredMetadata: drops.requiredMetadata })) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_NON_UNIQUE);
    }
  }

  return errors;
};

const getVotingValidationErrors = ({
  waveType,
  voting,
}: {
  readonly waveType: ApiWaveType;
  readonly voting: CreateWaveVotingConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];

  if (waveType === ApiWaveType.Chat) {
    // Chat waves must have null type and null category/profileId
    if (voting.type !== null || voting.category !== null || voting.profileId !== null) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING);
    }
    return errors;
  }

  // For Rank and Approve waves
  if (voting.type === null) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_TYPE_REQUIRED);
    return errors;
  }

  if (voting.type === ApiWaveCreditType.Tdh) {
    // TDH voting cannot have category or profileId
    if (voting.category !== null) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.TDH_VOTING_CANNOT_HAVE_CATEGORY);
    }
    if (voting.profileId !== null) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.TDH_VOTING_CANNOT_HAVE_PROFILE_ID);
    }
  } else {
    // REP voting requires non-empty category and profileId
    if (!voting.category) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.REP_VOTING_REQUIRES_CATEGORY);
    } else if (voting.category.trim() === "") {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.REP_VOTING_REQUIRES_CATEGORY);
    }

    if (!voting.profileId) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.REP_VOTING_REQUIRES_PROFILE_ID);
    } else if (voting.profileId.trim() === "") {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.REP_VOTING_REQUIRES_PROFILE_ID);
    }
  }

  // Validate time-weighted voting settings for Rank waves
  if (waveType === ApiWaveType.Rank && voting.timeWeighted.enabled) {
    // Constants for validation
    const MIN_MINUTES = 5;
    const MAX_HOURS = 24;
    const MAX_MINUTES = MAX_HOURS * 60;
    
    // Calculate the interval in minutes for validation
    const intervalInMinutes = voting.timeWeighted.averagingIntervalUnit === "minutes" 
      ? voting.timeWeighted.averagingInterval 
      : voting.timeWeighted.averagingInterval * 60;
    
    // Validate minimum
    if (intervalInMinutes < MIN_MINUTES) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_TOO_SMALL);
    }
    
    // Validate maximum
    if (intervalInMinutes > MAX_MINUTES) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_TOO_LARGE);
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

  if (waveType === ApiWaveType.Chat || waveType === ApiWaveType.Rank) {
    // Chat and Rank waves cannot have approval settings
    if (approval.threshold !== null || approval.thresholdTimeMs !== null) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_MUST_BE_NULL);
    }
    return errors;
  }

  // For Approve waves
  if (!approval.threshold || approval.threshold <= 0) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED);
  }

  if (!approval.thresholdTimeMs || approval.thresholdTimeMs <= 0) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_REQUIRED);
  }

  if (approval.thresholdTimeMs && dates.endDate) {
    const waveDuration = dates.endDate - dates.submissionStartDate;
    if (approval.thresholdTimeMs >= waveDuration) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_MUST_BE_SMALLER_THAN_WAVE_DURATION);
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
  return errors;
};

const getGroupsValidationErrors = ({
  waveType,
  groups,
}: {
  readonly waveType: ApiWaveType;
  readonly groups: WaveGroupsConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];

  if (waveType === ApiWaveType.Chat) {
    if (groups.canDrop !== null) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING);
    }
    if (groups.canVote !== null) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING);
    }
  }

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

  switch (step) {
    case CreateWaveStep.OVERVIEW:
      errors.push(...getOverviewValidationErrors({ overview: config.overview }));
      break;
    case CreateWaveStep.GROUPS:
      errors.push(...getGroupsValidationErrors({ waveType: config.overview.type, groups: config.groups }));
      break;
    case CreateWaveStep.DATES:
      errors.push(...getDatesValidationErrors({ waveType: config.overview.type, dates: config.dates }));
      break;
    case CreateWaveStep.DROPS:
      errors.push(...getDropsValidationErrors({ waveType: config.overview.type, drops: config.drops }));
      break;
    case CreateWaveStep.VOTING:
      errors.push(...getVotingValidationErrors({ waveType: config.overview.type, voting: config.voting }));
      break;
    case CreateWaveStep.APPROVAL:
      errors.push(...getApprovalValidationErrors({ waveType: config.overview.type, approval: config.approval, dates: config.dates }));
      break;
    case CreateWaveStep.OUTCOMES:
      errors.push(...getOutcomesValidationErrors({ waveType: config.overview.type, outcomes: config.outcomes }));
      break;
    case CreateWaveStep.DESCRIPTION:
      // No validation for description step
      break;
    default:
      assertUnreachable(step);
  }

  return errors;
}; 
