import { ApiWaveCreditType } from "../../generated/models/ApiWaveCreditType";
import { ApiWaveMetadataType } from "../../generated/models/ApiWaveMetadataType";
import { ApiWaveType } from "../../generated/models/ApiWaveType";
import {
  CreateWaveGroupConfigType,
  CreateWaveStep,
  WaveSignatureType,
} from "../../types/waves.types";

export const WAVE_LABELS: Record<ApiWaveType, string> = {
  [ApiWaveType.Chat]: "Chat",
  [ApiWaveType.Rank]: "Rank",
  [ApiWaveType.Approve]: "Approve",
};

export const WAVE_VOTING_LABELS: Record<ApiWaveCreditType, string> = {
  [ApiWaveCreditType.Tdh]: "By TDH",
  [ApiWaveCreditType.Rep]: "By Rep",
  [ApiWaveCreditType.Unique]: "By Unique Identity",
};

export const WAVE_SIGNATURE_LABELS: Record<
  ApiWaveType,
  Record<WaveSignatureType, string>
> = {
  [ApiWaveType.Chat]: {
    [WaveSignatureType.NONE]: "None",
    [WaveSignatureType.DROPS]: "Drops",
    [WaveSignatureType.VOTING]: "Rating",
    [WaveSignatureType.DROPS_AND_VOTING]: "All",
  },
  [ApiWaveType.Rank]: {
    [WaveSignatureType.NONE]: "None",
    [WaveSignatureType.DROPS]: "Drops",
    [WaveSignatureType.VOTING]: "Voting",
    [WaveSignatureType.DROPS_AND_VOTING]: "All",
  },
  [ApiWaveType.Approve]: {
    [WaveSignatureType.NONE]: "None",
    [WaveSignatureType.DROPS]: "Drops",
    [WaveSignatureType.VOTING]: "Voting",
    [WaveSignatureType.DROPS_AND_VOTING]: "All",
  },
};

const CREATE_WAVE_DEFAULT_MAIN_STEPS: CreateWaveStep[] = [
  CreateWaveStep.OVERVIEW,
  CreateWaveStep.GROUPS,
  CreateWaveStep.DATES,
  CreateWaveStep.DROPS,
  CreateWaveStep.VOTING,
];

export const CREATE_WAVE_MAIN_STEPS: Record<ApiWaveType, CreateWaveStep[]> = {
  [ApiWaveType.Chat]: [
    ...CREATE_WAVE_DEFAULT_MAIN_STEPS,
    CreateWaveStep.DESCRIPTION,
  ],
  [ApiWaveType.Rank]: [
    ...CREATE_WAVE_DEFAULT_MAIN_STEPS,
    CreateWaveStep.OUTCOMES,
    CreateWaveStep.DESCRIPTION,
  ],
  [ApiWaveType.Approve]: [
    ...CREATE_WAVE_DEFAULT_MAIN_STEPS,
    CreateWaveStep.APPROVAL,
    CreateWaveStep.OUTCOMES,
    CreateWaveStep.DESCRIPTION,
  ],
};

export const CREATE_WAVE_GROUPS: Record<
  ApiWaveType,
  CreateWaveGroupConfigType[]
> = {
  [ApiWaveType.Chat]: [
    CreateWaveGroupConfigType.CAN_VIEW,
    CreateWaveGroupConfigType.CAN_CHAT,
    CreateWaveGroupConfigType.ADMIN,
  ],
  [ApiWaveType.Rank]: [
    CreateWaveGroupConfigType.CAN_VIEW,
    CreateWaveGroupConfigType.CAN_DROP,
    CreateWaveGroupConfigType.CAN_VOTE,
    CreateWaveGroupConfigType.CAN_CHAT,
    CreateWaveGroupConfigType.ADMIN,
  ],
  [ApiWaveType.Approve]: [
    CreateWaveGroupConfigType.CAN_VIEW,
    CreateWaveGroupConfigType.CAN_DROP,
    CreateWaveGroupConfigType.CAN_VOTE,
    CreateWaveGroupConfigType.CAN_CHAT,
    CreateWaveGroupConfigType.ADMIN,
  ],
};

export const CREATE_WAVE_STEPS_LABELS: Record<
  ApiWaveType,
  Record<CreateWaveStep, string>
> = {
  [ApiWaveType.Chat]: {
    [CreateWaveStep.OVERVIEW]: "Overview",
    [CreateWaveStep.GROUPS]: "Groups",
    [CreateWaveStep.DATES]: "Dates",
    [CreateWaveStep.DROPS]: "Drops",
    [CreateWaveStep.VOTING]: "Rating",
    [CreateWaveStep.APPROVAL]: "Approval",
    [CreateWaveStep.OUTCOMES]: "Outcomes",
    [CreateWaveStep.DESCRIPTION]: "Description",
  },
  [ApiWaveType.Rank]: {
    [CreateWaveStep.OVERVIEW]: "Overview",
    [CreateWaveStep.GROUPS]: "Groups",
    [CreateWaveStep.DATES]: "Dates",
    [CreateWaveStep.DROPS]: "Drops",
    [CreateWaveStep.VOTING]: "Voting",
    [CreateWaveStep.APPROVAL]: "Approval",
    [CreateWaveStep.OUTCOMES]: "Outcomes",
    [CreateWaveStep.DESCRIPTION]: "Description",
  },
  [ApiWaveType.Approve]: {
    [CreateWaveStep.OVERVIEW]: "Overview",
    [CreateWaveStep.GROUPS]: "Groups",
    [CreateWaveStep.DATES]: "Dates",
    [CreateWaveStep.DROPS]: "Drops",
    [CreateWaveStep.VOTING]: "Voting",
    [CreateWaveStep.APPROVAL]: "Approval",
    [CreateWaveStep.OUTCOMES]: "Outcomes",
    [CreateWaveStep.DESCRIPTION]: "Description",
  },
};

export const CREATE_WAVE_SELECT_GROUP_LABELS: Record<
  ApiWaveType,
  Record<CreateWaveGroupConfigType, string>
> = {
  [ApiWaveType.Chat]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Who can view",
    [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Who can rate",
    [CreateWaveGroupConfigType.CAN_CHAT]: "Who can chat",
    [CreateWaveGroupConfigType.ADMIN]: "Admin",
  },
  [ApiWaveType.Rank]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Who can view",
    [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Who can vote",
    [CreateWaveGroupConfigType.CAN_CHAT]: "Who can chat",
    [CreateWaveGroupConfigType.ADMIN]: "Admin",
  },
  [ApiWaveType.Approve]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Who can view",
    [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Who can vote",
    [CreateWaveGroupConfigType.CAN_CHAT]: "Who can chat",
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
  [CreateWaveGroupConfigType.ADMIN]: "Only me",
  [CreateWaveGroupConfigType.CAN_CHAT]: "Anyone",
};

export const CREATE_WAVE_START_DATE_LABELS: Record<ApiWaveType, string> = {
  [ApiWaveType.Chat]: "Start date",
  [ApiWaveType.Rank]: "Submissions open",
  [ApiWaveType.Approve]: "Start date",
};

export const CREATE_WAVE_DROPS_REQUIRED_METADATA_TYPES_LABELS: Record<
  ApiWaveMetadataType,
  string
> = {
  [ApiWaveMetadataType.String]: "Text",
  [ApiWaveMetadataType.Number]: "Number",
};
