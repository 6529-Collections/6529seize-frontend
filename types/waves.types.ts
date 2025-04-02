import { ApiWaveCreditType } from "../generated/models/ApiWaveCreditType";
import { ApiWaveMetadataType } from "../generated/models/ApiWaveMetadataType";
import { ApiWaveParticipationRequirement } from "../generated/models/ApiWaveParticipationRequirement";
import { ApiWavesOverviewType } from "../generated/models/ApiWavesOverviewType";
import { ApiWaveType } from "../generated/models/ApiWaveType";

export enum MyStreamWaveTab {
  CHAT = "CHAT",
  LEADERBOARD = "LEADERBOARD",
  WINNERS = "WINNERS",
  OUTCOME = "OUTCOME",
  MY_VOTES = "MY_VOTES",
  FAQ = "FAQ",
}

export enum CreateWaveGroupConfigType {
  CAN_VIEW = "CAN_VIEW",
  CAN_DROP = "CAN_DROP",
  CAN_VOTE = "CAN_VOTE",
  CAN_CHAT = "CAN_CHAT",
  ADMIN = "ADMIN",
}

export interface WaveOverviewConfig {
  readonly type: ApiWaveType;
  readonly name: string;
  readonly image: File | null;
}

export interface WaveGroupsConfig {
  readonly canView: string | null;
  readonly canDrop: string | null;
  readonly canVote: string | null;
  readonly canChat: string | null;
  readonly admin: string | null;
}

export interface CreateWaveDropsRequiredMetadata {
  readonly key: string;
  readonly type: ApiWaveMetadataType;
}

export interface CreateWaveDropsConfig {
  readonly noOfApplicationsAllowedPerParticipant: number | null;
  readonly requiredTypes: ApiWaveParticipationRequirement[];
  readonly requiredMetadata: CreateWaveDropsRequiredMetadata[];
  readonly terms: string | null;
  readonly signatureRequired: boolean;
  readonly adminCanDeleteDrops: boolean;
}

export interface TimeWeightedVotingSettings {
  readonly enabled: boolean;
  readonly averagingInterval: number;
  readonly averagingIntervalUnit: "minutes" | "hours";
}

export interface CreateWaveVotingConfig {
  readonly type: ApiWaveCreditType | null;
  readonly category: string | null;
  readonly profileId: string | null;
  readonly timeWeighted: TimeWeightedVotingSettings;
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
  readonly firstDecisionTime: number;
  readonly subsequentDecisions: number[];
  readonly isRolling: boolean;
}

export interface CreateWaveApprovalConfig {
  readonly threshold: number | null;
  readonly thresholdTimeMs: number | null;
}

export enum CreateWaveOutcomeType {
  MANUAL = "MANUAL",
  REP = "REP",
  NIC = "NIC",
}

export enum CreateWaveOutcomeConfigWinnersCreditValueType {
  ABSOLUTE_VALUE = "ABSOLUTE_VALUE",
  PERCENTAGE = "PERCENTAGE",
}

export interface CreateWaveOutcomeConfigWinner {
  readonly value: number;
}

export interface CreateWaveOutcomeConfigWinnersConfig {
  readonly creditValueType: CreateWaveOutcomeConfigWinnersCreditValueType;
  readonly totalAmount: number;
  readonly winners: CreateWaveOutcomeConfigWinner[];
}
export interface CreateWaveOutcomeConfig {
  readonly type: CreateWaveOutcomeType;
  readonly title: string | null;
  readonly credit: number | null;
  readonly category: string | null;
  readonly maxWinners: number | null;
  readonly winnersConfig: CreateWaveOutcomeConfigWinnersConfig | null;
}

export interface CreateWaveConfig {
  readonly overview: WaveOverviewConfig;
  readonly groups: WaveGroupsConfig;
  readonly dates: CreateWaveDatesConfig;
  readonly drops: CreateWaveDropsConfig;
  readonly chat: {
    readonly enabled: boolean;
  };
  readonly voting: CreateWaveVotingConfig;
  readonly outcomes: CreateWaveOutcomeConfig[];
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

export interface SearchWavesParams {
  readonly limit: number;
  readonly serial_no_less_than?: number;
  readonly group_id?: string;
}
export interface WavesOverviewParams {
  limit: number;
  offset: number;
  type: ApiWavesOverviewType;
  only_waves_followed_by_authenticated_user?: boolean;
}
