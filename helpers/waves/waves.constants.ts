import { ApiWaveCreditType } from "../../generated/models/ApiWaveCreditType";
import { ApiWaveMetadataType } from "../../generated/models/ApiWaveMetadataType";
import { ApiWaveType } from "../../generated/models/ApiWaveType";
import {
  CreateWaveGroupConfigType,
  CreateWaveStep,
} from "../../types/waves.types";

export const WAVE_LABELS: Record<ApiWaveType, string> = {
  [ApiWaveType.Chat]: "Chat",
  [ApiWaveType.Rank]: "Rank",
  [ApiWaveType.Approve]: "Approve",
};

export const WAVE_VOTING_LABELS: Record<ApiWaveCreditType, string> = {
  [ApiWaveCreditType.Tdh]: "By TDH",
  [ApiWaveCreditType.Rep]: "By Rep",
};

export const CREATE_WAVE_MAIN_STEPS: Record<ApiWaveType, CreateWaveStep[]> = {
  [ApiWaveType.Chat]: [
    CreateWaveStep.OVERVIEW,
    CreateWaveStep.GROUPS,
    CreateWaveStep.DESCRIPTION,
  ],
  [ApiWaveType.Rank]: [
    CreateWaveStep.OVERVIEW,
    CreateWaveStep.GROUPS,
    CreateWaveStep.DATES,
    CreateWaveStep.DROPS,
    CreateWaveStep.VOTING,
    CreateWaveStep.OUTCOMES,
    CreateWaveStep.DESCRIPTION,
  ],
  [ApiWaveType.Approve]: [
    CreateWaveStep.OVERVIEW,
    CreateWaveStep.GROUPS,
    CreateWaveStep.DATES,
    CreateWaveStep.DROPS,
    CreateWaveStep.VOTING,
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
  [CreateWaveGroupConfigType.CAN_CHAT]: "Anyone",
  [CreateWaveGroupConfigType.ADMIN]: "Only me",
};

export const CREATE_WAVE_START_DATE_LABELS: Record<ApiWaveType, string> = {
  [ApiWaveType.Chat]: "Drops Submission Opens",
  [ApiWaveType.Rank]: "Drops Submission Opens",
  [ApiWaveType.Approve]: "Drops Submission Opens",
};

const CREATE_WAVE_DROPS_REQUIRED_METADATA_TYPES_LABELS: Record<
  ApiWaveMetadataType,
  string
> = {
  [ApiWaveMetadataType.String]: "Text",
  [ApiWaveMetadataType.Number]: "Number",
};
