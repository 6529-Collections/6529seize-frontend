import { WaveCreditType } from "../../generated/models/WaveCreditType";
import { WaveMetadataType } from "../../generated/models/WaveMetadataType";
import { WaveParticipationRequirement } from "../../generated/models/WaveParticipationRequirement";
import { WaveType } from "../../generated/models/WaveType";
import {
  CreateWaveGroupConfigType,
  CreateWaveStep,
  WaveSignatureType,
} from "../../types/waves.types";

export const WAVE_LABELS: Record<WaveType, string> = {
  [WaveType.Chat]: "Chat",
  [WaveType.Rank]: "Rank",
  [WaveType.Approve]: "Approve",
};

export const WAVE_VOTING_LABELS: Record<WaveCreditType, string> = {
  [WaveCreditType.Tdh]: "By TDH",
  [WaveCreditType.Rep]: "By Rep",
  [WaveCreditType.Unique]: "By Unique Identity",
};

export const WAVE_SIGNATURE_LABELS: Record<
  WaveType,
  Record<WaveSignatureType, string>
> = {
  [WaveType.Chat]: {
    [WaveSignatureType.NONE]: "None",
    [WaveSignatureType.DROPS]: "Drops",
    [WaveSignatureType.VOTING]: "Rating",
    [WaveSignatureType.DROPS_AND_VOTING]: "All",
  },
  [WaveType.Rank]: {
    [WaveSignatureType.NONE]: "None",
    [WaveSignatureType.DROPS]: "Drops",
    [WaveSignatureType.VOTING]: "Voting",
    [WaveSignatureType.DROPS_AND_VOTING]: "All",
  },
  [WaveType.Approve]: {
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

export const CREATE_WAVE_MAIN_STEPS: Record<WaveType, CreateWaveStep[]> = {
  [WaveType.Chat]: [
    ...CREATE_WAVE_DEFAULT_MAIN_STEPS,
    CreateWaveStep.DESCRIPTION,
  ],
  [WaveType.Rank]: [
    ...CREATE_WAVE_DEFAULT_MAIN_STEPS,
    CreateWaveStep.OUTCOMES,
    CreateWaveStep.DESCRIPTION,
  ],
  [WaveType.Approve]: [
    ...CREATE_WAVE_DEFAULT_MAIN_STEPS,
    CreateWaveStep.APPROVAL,
    CreateWaveStep.OUTCOMES,
    CreateWaveStep.DESCRIPTION,
  ],
};

export const CREATE_WAVE_STEPS_LABELS: Record<
  WaveType,
  Record<CreateWaveStep, string>
> = {
  [WaveType.Chat]: {
    [CreateWaveStep.OVERVIEW]: "Overview",
    [CreateWaveStep.GROUPS]: "Groups",
    [CreateWaveStep.DATES]: "Dates",
    [CreateWaveStep.DROPS]: "Drops",
    [CreateWaveStep.VOTING]: "Rating",
    [CreateWaveStep.APPROVAL]: "Approval",
    [CreateWaveStep.OUTCOMES]: "Outcomes",
    [CreateWaveStep.DESCRIPTION]: "Description",
  },
  [WaveType.Rank]: {
    [CreateWaveStep.OVERVIEW]: "Overview",
    [CreateWaveStep.GROUPS]: "Groups",
    [CreateWaveStep.DATES]: "Dates",
    [CreateWaveStep.DROPS]: "Drops",
    [CreateWaveStep.VOTING]: "Voting",
    [CreateWaveStep.APPROVAL]: "Approval",
    [CreateWaveStep.OUTCOMES]: "Outcomes",
    [CreateWaveStep.DESCRIPTION]: "Description",
  },
  [WaveType.Approve]: {
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
  WaveType,
  Record<CreateWaveGroupConfigType, string>
> = {
  [WaveType.Chat]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Who can view",
    [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Who can rate",
    [CreateWaveGroupConfigType.ADMIN]: "Admin",
  },
  [WaveType.Rank]: {
    [CreateWaveGroupConfigType.CAN_VIEW]: "Who can view",
    [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
    [CreateWaveGroupConfigType.CAN_VOTE]: "Who can vote",
    [CreateWaveGroupConfigType.ADMIN]: "Admin",
  },
  [WaveType.Approve]: {
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
  [CreateWaveGroupConfigType.ADMIN]: "Only me",
};

export const CREATE_WAVE_START_DATE_LABELS: Record<WaveType, string> = {
  [WaveType.Chat]: "Start date",
  [WaveType.Rank]: "Submissions open",
  [WaveType.Approve]: "Start date",
};

export const CREATE_WAVE_DROPS_REQUIRED_TYPES_LABELS: Record<
  WaveParticipationRequirement,
  string
> = {
  [WaveParticipationRequirement.Image]: "Image",
  [WaveParticipationRequirement.Audio]: "Audio",
  [WaveParticipationRequirement.Video]: "Video",
};

export const CREATE_WAVE_DROPS_REQUIRED_METADATA_TYPES_LABELS: Record<
  WaveMetadataType,
  string
> = {
  [WaveMetadataType.String]: "Text",
  [WaveMetadataType.Number]: "Number",
};
