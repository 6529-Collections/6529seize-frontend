export enum WaveType {
  CHAT = "CHAT",
  RANK = "RANK",
  APPROVE = "APPROVE",
}

export enum WaveSignatureType {
  NONE = "NONE",
  DROPS = "DROPS",
  VOTING = "VOTING",
  DROPS_AND_VOTING = "DROPS_AND_VOTING",
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
  readonly description: string;
}

export interface WaveGroupsConfig {
  readonly canView: string | null;
  readonly canDrop: string | null;
  readonly canVote: string | null;
  readonly admin: string | null;
}

export enum CreateWaveStep {
  OVERVIEW = "OVERVIEW",
  GROUPS = "GROUPS",
  DATES = "DATES",
  DROPS = "DROPS",
  VOTING = "VOTING",
  APPROVAL = "APPROVAL",
}

export interface CreateWaveConfig {
  readonly overview: WaveOverviewConfig;
  readonly groups: WaveGroupsConfig;
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