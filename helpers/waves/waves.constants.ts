import {
  CreateWaveGroupConfigType,
  CreateWaveStep,
  WaveSignatureType,
  WaveType,
} from "../../types/waves.types";

export const WAVE_LABELS: Record<WaveType, string> = {
  [WaveType.CHAT]: "Chat",
  [WaveType.RANK]: "Rank",
  [WaveType.APPROVE]: "Approve",
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
    [CreateWaveGroupConfigType.CAN_VIEW]: "Can view",
    [CreateWaveGroupConfigType.CAN_DROP]: "Can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Can rate",
    [CreateWaveGroupConfigType.ADMIN]: "Admin",
  },
  [WaveType.RANK]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Can view",
    [CreateWaveGroupConfigType.CAN_DROP]: "Can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Can vote",
    [CreateWaveGroupConfigType.ADMIN]: "Admin",
  },
  [WaveType.APPROVE]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Can view",
    [CreateWaveGroupConfigType.CAN_DROP]: "Can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Can vote",
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
