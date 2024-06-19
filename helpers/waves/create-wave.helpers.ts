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
} from "../../types/waves.types";
import { assertUnreachable } from "../AllowlistToolHelpers";

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
      return null;
    case CreateWaveStep.APPROVAL:
      return null;
    default:
      assertUnreachable(step);
      return null;
  }
};

export const getCreateWavePreviousStep = ({
  step,
}: {
  readonly step: CreateWaveStep;
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
    default:
      assertUnreachable(step);
      return null;
  }
};

const getIsOverViewNextStepDisabled = ({
  overview,
}: {
  readonly overview: WaveOverviewConfig;
}): boolean => {
  if (!overview.name || !overview.description) {
    return true;
  }

  if (!overview.type || !overview.signatureType) {
    return true;
  }
  return false;
};

const getIsDatesNextStepDisabled = ({
  waveType,
  dates,
}: {
  readonly waveType: WaveType;
  readonly dates: CreateWaveDatesConfig;
}): boolean => {
  switch (waveType) {
    case WaveType.Chat:
    case WaveType.Approve:
      return (
        !dates.submissionStartDate ||
        dates.submissionStartDate !== dates.votingStartDate
      );
    case WaveType.Rank:
      return (
        !dates.submissionStartDate ||
        !dates.votingStartDate ||
        dates.votingStartDate < dates.submissionStartDate ||
        !dates.endDate ||
        dates.endDate < dates.votingStartDate
      );
    default:
      assertUnreachable(waveType);
      return true;
  }
};

const isRequiredMetadataRowsNonUnique = ({
  requiredMetadata,
}: {
  requiredMetadata: CreateWaveDropsRequiredMetadata[];
}): boolean => {
  const keys = requiredMetadata.map((item) => item.key);
  return new Set(keys).size !== keys.length;
};

const getIsDropsNextStepDisabled = ({
  drops,
}: {
  readonly drops: CreateWaveDropsConfig;
}): boolean => {
  if (!drops.requiredMetadata.length) {
    return false;
  }
  return isRequiredMetadataRowsNonUnique({
    requiredMetadata: drops.requiredMetadata,
  });
};

const getIsVotingNextStepDisabled = ({
  voting,
}: {
  readonly voting: CreateWaveVotingConfig;
}): boolean => {
  switch (voting.type) {
    case WaveCreditType.Tdh:
      return !!voting.profileId || !!voting.category;
    case WaveCreditType.Rep:
      // TODO make sure this is correct validation
      return !voting.profileId?.length && !voting.category?.length;
    case WaveCreditType.Unique:
      return !!voting.profileId || !!voting.category;
    default:
      assertUnreachable(voting.type);
      return true;
  }
};

const getIsApprovalNextStepDisabled = ({
  approval,
}: {
  readonly approval: CreateWaveApprovalConfig;
}): boolean => {
  return !approval.threshold || !approval.thresholdTimeMs;
};

export const getIsNextStepDisabled = ({
  step,
  config,
}: {
  readonly step: CreateWaveStep;
  readonly config: CreateWaveConfig;
}): boolean => {
  switch (step) {
    case CreateWaveStep.OVERVIEW:
      return getIsOverViewNextStepDisabled({ overview: config.overview });
    case CreateWaveStep.GROUPS:
      return false;
    case CreateWaveStep.DATES:
      return getIsDatesNextStepDisabled({
        waveType: config.overview.type,
        dates: config.dates,
      });
    case CreateWaveStep.DROPS:
      return getIsDropsNextStepDisabled({ drops: config.drops });
    case CreateWaveStep.VOTING:
      return getIsVotingNextStepDisabled({ voting: config.voting });
    case CreateWaveStep.APPROVAL:
      return getIsApprovalNextStepDisabled({ approval: config.approval });
    default:
      assertUnreachable(step);
      return true;
  }
};
