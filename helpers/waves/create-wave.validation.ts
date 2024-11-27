import { ApiWaveCreditType } from "../../generated/models/ApiWaveCreditType";
import { ApiWaveType } from "../../generated/models/ApiWaveType";
import {
  CreateWaveApprovalConfig,
  CreateWaveConfig,
  CreateWaveDatesConfig,
  CreateWaveDropsConfig,
  CreateWaveDropsRequiredMetadata,
  CreateWaveOutcomeConfig,
  CreateWaveStep,
  CreateWaveVotingConfig,
  WaveOverviewConfig,
} from "../../types/waves.types";

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
