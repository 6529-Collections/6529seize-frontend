import type { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import type { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import type { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import type { ApiWaveParticipationSubmissionStrategy } from "@/generated/models/ApiWaveParticipationSubmissionStrategy";
import type { ApiWaveOutcomeDistributionItem } from "@/generated/models/ApiWaveOutcomeDistributionItem";
import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveCreditNft } from "@/generated/models/ApiWaveCreditNft";
import type { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import type { ApiWaveRepSummary } from "@/generated/models/ApiWaveRepSummary";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";

export enum MyStreamWaveTab {
  CHAT = "CHAT",
  LEADERBOARD = "LEADERBOARD",
  SUBMISSIONS = "SUBMISSIONS",
  SALES = "SALES",
  WINNERS = "WINNERS",
  OUTCOME = "OUTCOME",
  MY_VOTES = "MY_VOTES",
  POLLS = "POLLS",
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
  readonly submissionStrategy: ApiWaveParticipationSubmissionStrategy | null;
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
  readonly creditScope: ApiWaveCreditScope;
  readonly category: string | null;
  readonly profileId: string | null;
  readonly creditNfts: ApiWaveCreditNft[];
  readonly creditNftMemeCount: number | null;
  readonly allowNegativeVotes: boolean;
  readonly maxVotesPerIdentityPerDrop: number | null;
  readonly winningThreshold: number | null;
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
  readonly maxWinners: number | null;
}

export interface CreateWaveApproveDisplayConfig {
  readonly approvalsTabLabel: string;
  readonly approvedTabLabel: string;
}

export interface CreateWaveDisplayConfig {
  readonly approve: CreateWaveApproveDisplayConfig;
  readonly outcomesVisible: boolean;
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
  readonly winnersConfig: CreateWaveOutcomeConfigWinnersConfig | null;
}

export interface WaveOutcomeDistributionState {
  readonly items: ApiWaveOutcomeDistributionItem[];
  readonly totalCount: number;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly fetchNextPage: () => void;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string | undefined;
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
  readonly display: CreateWaveDisplayConfig;
}

export enum CreateWaveStepStatus {
  DONE = "DONE",
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
}

export interface SidebarWaveContributor {
  readonly pfp: string;
  readonly identity: string | null;
}

export interface SidebarWaveDescriptionDrop {
  readonly contents: string | null;
  readonly media: readonly ApiDropMedia[];
}

export interface SidebarWave {
  readonly id: string;
  readonly name: string;
  readonly type: ApiWaveType;
  readonly createdAt: number;
  readonly creator: ApiProfileMin | null;
  readonly picture: string | null;
  readonly contributors: readonly SidebarWaveContributor[];
  readonly isDirectMessage: boolean;
  readonly hasCompetition: boolean;
  readonly parentWaveId: string | null;
  readonly hasSubwaves: boolean;
  readonly descriptionDrop: SidebarWaveDescriptionDrop;
  readonly totalDropsCount: number;
  readonly isPrivate: boolean;
  readonly latestDropTimestamp: number | null;
  readonly latestFollowedSubwaveDropTimestamp: number | null;
  readonly firstUnreadDropSerialNo: number | null;
  readonly firstUnreadFollowedSubwaveDropSerialNo: number | null;
  readonly unreadDropsCount: number;
  readonly followedSubwavesCount: number;
  readonly unreadFollowedSubwaveDrops: number;
  readonly latestReadTimestamp: number;
  readonly pinned: boolean;
  readonly muted: boolean;
  readonly subscribed: boolean;
  readonly waveRep: ApiWaveRepSummary | null;
  readonly waveScore: ApiWaveScore | null;
}

export interface SidebarWavesPage {
  readonly waves: SidebarWave[];
  readonly page: number;
  readonly next: boolean;
}
