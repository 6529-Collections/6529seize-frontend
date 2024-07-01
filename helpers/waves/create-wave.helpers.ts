import { CreateDropRequest } from "../../generated/models/CreateDropRequest";
import { CreateNewWave } from "../../generated/models/CreateNewWave";
import { CreateWaveDropRequest } from "../../generated/models/CreateWaveDropRequest";
import { IntRange } from "../../generated/models/IntRange";
import { WaveCreditScope } from "../../generated/models/WaveCreditScope";
import { WaveCreditType } from "../../generated/models/WaveCreditType";
import { WaveType } from "../../generated/models/WaveType";
import {
  CreateWaveApprovalConfig,
  CreateWaveConfig,
  CreateWaveDatesConfig,
  CreateWaveDropsConfig,
  CreateWaveDropsRequiredMetadata,
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
}

export const getCreateWaveNextStep = ({
  step,
  waveType,
}: {
  readonly step: CreateWaveStep;
  readonly waveType: WaveType;
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
      if (waveType === WaveType.Approve) {
        return CreateWaveStep.APPROVAL;
      }
      if (waveType === WaveType.Chat) {
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
  readonly waveType: WaveType;
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
      if (waveType === WaveType.Approve) {
        return CreateWaveStep.APPROVAL;
      }
      return CreateWaveStep.VOTING;
    case CreateWaveStep.DESCRIPTION:
      if (waveType === WaveType.Chat) {
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
  readonly waveType: WaveType;
  readonly dates: CreateWaveDatesConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  if (!dates.submissionStartDate) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_START_DATE_REQUIRED);
  }
  if (!dates.votingStartDate) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_REQUIRED);
  }
  if (waveType !== WaveType.Rank) {
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
  if (
    voting.type === WaveCreditType.Tdh ||
    voting.type === WaveCreditType.Unique
  ) {
    if (!!voting.profileId) {
      errors.push(CREATE_WAVE_VALIDATION_ERROR.VOTING_PROFILE_ID_MUST_BE_EMPTY);
    }
    if (!!voting.category) {
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
}: {
  readonly waveType: WaveType;
  readonly approval: CreateWaveApprovalConfig;
}): CREATE_WAVE_VALIDATION_ERROR[] => {
  const errors: CREATE_WAVE_VALIDATION_ERROR[] = [];
  if (waveType !== WaveType.Approve) {
    return errors;
  }
  if (!approval.threshold) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED);
  }
  if (!approval.thresholdTimeMs) {
    errors.push(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_REQUIRED);
  }
  return errors;
};

// TODO outcomes errors
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
      waveType: config.overview.type,
    })
  );
  if (step === CreateWaveStep.APPROVAL) {
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
}): IntRange | null => {
  const waveType = config.overview.type;
  switch (waveType) {
    case WaveType.Approve:
      return {
        min: config.approval.threshold,
        max: config.approval.threshold,
      };
    case WaveType.Rank:
    case WaveType.Chat:
      return null;
    default:
      assertUnreachable(waveType);
      return null;
  }
};

export const getCreateNewWaveBody = ({
  drop,
  config,
}: {
  readonly drop: CreateWaveDropRequest;
  readonly config: CreateWaveConfig;
}): CreateNewWave => {
  return {
    name: config.overview.name,
    description_drop: drop,
    voting: {
      scope: {
        group_id: config.groups.canVote,
      },
      credit_type: config.voting.type,
      credit_scope: WaveCreditScope.Wave,
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
      // TODO
      no_of_applications_allowed_per_participant: null,
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
    wave: {
      type: config.overview.type,
      winning_thresholds: getWinningThreshold({ config }),
      // TODO
      max_winners: null,
      time_lock_ms: config.approval.thresholdTimeMs,
      admin_group_id: config.groups.admin,
      period: {
        min: config.dates.submissionStartDate,
        max: config.dates.endDate,
      },
    },
    outcomes: [],
  };
};
