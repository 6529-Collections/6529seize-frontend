import { WaveCreditType } from "../generated/models/WaveCreditType";
import { WaveMetadataType } from "../generated/models/WaveMetadataType";
import { WaveParticipationRequirement } from "../generated/models/WaveParticipationRequirement";
import { WavesOverviewType } from "../generated/models/WavesOverviewType";
import { WaveType } from "../generated/models/WaveType";

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
  readonly image: File | null;
}

export interface WaveGroupsConfig {
  readonly canView: string | null;
  readonly canDrop: string | null;
  readonly canVote: string | null;
  readonly admin: string | null;
}

export interface CreateWaveDropsRequiredMetadata {
  readonly key: string;
  readonly type: WaveMetadataType;
}

export interface CreateWaveDropsConfig {
  // TODO add to API, make sure that in CHAT its always true
  readonly allowDiscussionDrops: boolean;
  readonly noOfApplicationsAllowedPerParticipant: number | null;
  readonly requiredTypes: WaveParticipationRequirement[];
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
  type: WavesOverviewType;
}
