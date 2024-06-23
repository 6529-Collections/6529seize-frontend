import { WaveCreditType } from "../generated/models/WaveCreditType";
import { WaveType } from "../generated/models/WaveType";

export enum WaveSignatureType {
  NONE = "NONE",
  DROPS = "DROPS",
  VOTING = "VOTING",
  DROPS_AND_VOTING = "DROPS_AND_VOTING",
}

export enum WaveRequiredType {
  IMAGE = "IMAGE",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
}

export enum WaveRequiredMetadataType {
  STRING = "STRING",
  NUMBER = "NUMBER",
}

export enum CreateWaveGroupConfigType {
  CAN_VIEW = "CAN_VIEW",
  CAN_DROP = "CAN_DROP",
  CAN_VOTE = "CAN_VOTE",
  ADMIN = "ADMIN",
}

export interface WaveOverviewConfig {
  readonly type: WaveType;
  readonly signatureType: WaveSignatureType;
  readonly name: string;
}

export interface WaveGroupsConfig {
  readonly canView: string | null;
  readonly canDrop: string | null;
  readonly canVote: string | null;
  readonly admin: string | null;
}

export interface CreateWaveDropsRequiredMetadata {
  readonly key: string;
  readonly type: WaveRequiredMetadataType;
}

export interface CreateWaveDropsConfig {
  readonly requiredTypes: WaveRequiredType[];
  readonly requiredMetadata: CreateWaveDropsRequiredMetadata[];
}

export interface CreateWaveVotingConfig {
  readonly type: WaveCreditType;
  readonly category: string | null;
  readonly profileId: string | null;
}

export enum CreateWaveStep {
  OVERVIEW = "OVERVIEW",
  GROUPS = "GROUPS",
  DATES = "DATES",
  DROPS = "DROPS",
  VOTING = "VOTING",
  APPROVAL = "APPROVAL",
  OUTCOMES = "OUTCOMES",
  DESCRIPTION = "DESCRIPTION",
}

export interface CreateWaveDatesConfig {
  readonly submissionStartDate: number;
  readonly votingStartDate: number;
  readonly endDate: number | null;
}

export interface CreateWaveApprovalConfig {
  readonly threshold: number | null;
  readonly thresholdTimeMs: number | null;
}

export interface CreateWaveConfig {
  readonly overview: WaveOverviewConfig;
  readonly groups: WaveGroupsConfig;
  readonly dates: CreateWaveDatesConfig;
  readonly drops: CreateWaveDropsConfig;
  readonly voting: CreateWaveVotingConfig;
  readonly approval: CreateWaveApprovalConfig;
}

export enum CreateWaveStepStatus {
  DONE = "DONE",
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
}

export enum CreateWaveGroupStatus {
  NONE = "NONE",
  GROUP = "GROUP",
}
