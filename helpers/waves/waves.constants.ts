import {
  CreateWaveGroupConfigType,
  CreateWaveStep,
  WaveRequiredMetadataType,
  WaveRequiredType,
  WaveSignatureType,
  WaveType,
  WaveVotingType,
} from "../../types/waves.types";

export const WAVE_LABELS: Record<WaveType, string> = {
  [WaveType.CHAT]: "Chat",
  [WaveType.RANK]: "Rank",
  [WaveType.APPROVE]: "Approve",
};

export const WAVE_VOTING_LABELS: Record<WaveVotingType, string> = {
  [WaveVotingType.TDH]: "By TDH",
  [WaveVotingType.REP]: "By Rep",
  [WaveVotingType.UNIQUE_IDENTITY]: "By Unique Identity",
};

export const WAVE_SIGNATURE_LABELS: Record<
  WaveType,
  Record<WaveSignatureType, string>
> = {
  [WaveType.CHAT]: {
    [WaveSignatureType.NONE]: "None",
    [WaveSignatureType.DROPS]: "Drops",
    [WaveSignatureType.VOTING]: "Rating",
    [WaveSignatureType.DROPS_AND_VOTING]: "Drops & Rating",
  },
  [WaveType.RANK]: {
    [WaveSignatureType.NONE]: "None",
    [WaveSignatureType.DROPS]: "Drops",
    [WaveSignatureType.VOTING]: "Voting",
    [WaveSignatureType.DROPS_AND_VOTING]: "Drops & Voting",
  },
  [WaveType.APPROVE]: {
    [WaveSignatureType.NONE]: "None",
    [WaveSignatureType.DROPS]: "Drops",
    [WaveSignatureType.VOTING]: "Voting",
    [WaveSignatureType.DROPS_AND_VOTING]: "Drops & Voting",
  },
};

const CREATE_WAVE_DEFAULT_MAIN_STEPS: CreateWaveStep[] = [
  CreateWaveStep.OVERVIEW,
  CreateWaveStep.GROUPS,
  CreateWaveStep.DATES,
  CreateWaveStep.DROPS,
  CreateWaveStep.VOTING,
];

export const CREATE_WAVE_MAIN_STEPS: Record<WaveType, CreateWaveStep[]> = {
  [WaveType.CHAT]: CREATE_WAVE_DEFAULT_MAIN_STEPS,
  [WaveType.RANK]: CREATE_WAVE_DEFAULT_MAIN_STEPS,
  [WaveType.APPROVE]: [
    ...CREATE_WAVE_DEFAULT_MAIN_STEPS,
    CreateWaveStep.APPROVAL,
  ],
};

export const CREATE_WAVE_STEPS_LABELS: Record<
  WaveType,
  Record<CreateWaveStep, string>
> = {
  [WaveType.CHAT]: {
    [CreateWaveStep.OVERVIEW]: "Overview",
    [CreateWaveStep.GROUPS]: "Groups",
    [CreateWaveStep.DATES]: "Dates",
    [CreateWaveStep.DROPS]: "Drops",
    [CreateWaveStep.VOTING]: "Rating",
    [CreateWaveStep.APPROVAL]: "Approval",
  },
  [WaveType.RANK]: {
    [CreateWaveStep.OVERVIEW]: "Overview",
    [CreateWaveStep.GROUPS]: "Groups",
    [CreateWaveStep.DATES]: "Dates",
    [CreateWaveStep.DROPS]: "Drops",
    [CreateWaveStep.VOTING]: "Voting",
    [CreateWaveStep.APPROVAL]: "Approval",
  },
  [WaveType.APPROVE]: {
    [CreateWaveStep.OVERVIEW]: "Overview",
    [CreateWaveStep.GROUPS]: "Groups",
    [CreateWaveStep.DATES]: "Dates",
    [CreateWaveStep.DROPS]: "Drops",
    [CreateWaveStep.VOTING]: "Voting",
    [CreateWaveStep.APPROVAL]: "Approval",
  },
};

export const CREATE_WAVE_SELECT_GROUP_LABELS: Record<
  WaveType,
  Record<CreateWaveGroupConfigType, string>
> = {
  [WaveType.CHAT]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Who can view",
    [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Who can rate",
    [CreateWaveGroupConfigType.ADMIN]: "Admin",
  },
  [WaveType.RANK]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Who can view",
    [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Who can vote",
    [CreateWaveGroupConfigType.ADMIN]: "Admin",
  },
  [WaveType.APPROVE]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Who can view",
    [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Who can vote",
    [CreateWaveGroupConfigType.ADMIN]: "Admin",
  },
};

export const CREATE_WAVE_NONE_GROUP_LABELS: Record<
  CreateWaveGroupConfigType,
  string
> = {
  [CreateWaveGroupConfigType.CAN_VIEW]: "Anyone",
  [CreateWaveGroupConfigType.CAN_DROP]: "Anyone",
  [CreateWaveGroupConfigType.CAN_VOTE]: "Anyone",
  [CreateWaveGroupConfigType.ADMIN]: "None",
};

export const CREATE_WAVE_START_DATE_LABELS: Record<WaveType, string> = {
  [WaveType.CHAT]: "Start date",
  [WaveType.RANK]: "Submissions open",
  [WaveType.APPROVE]: "Start date",
};

export const CREATE_WAVE_DROPS_REQUIRED_TYPES_LABELS: Record<
  WaveRequiredType,
  string
> = {
  [WaveRequiredType.IMAGE]: "Image",
  [WaveRequiredType.AUDIO]: "Audio",
  [WaveRequiredType.VIDEO]: "Video",
};

export const CREATE_WAVE_DROPS_REQUIRED_METADATA_TYPES_LABELS: Record<
  WaveRequiredMetadataType,
  string
> = {
  [WaveRequiredMetadataType.STRING]: "Text",
  [WaveRequiredMetadataType.NUMBER]: "Number",
};
