export interface ChallengeMetadata {}

export enum ChallengeTargetType {
  ANYONE = "ANYONE",
  GROUP = "GROUP",
  SPECIFIED_WALLETS = "SPECIFIED_WALLETS",
}

export interface ChallengeTargetAnyone {
  readonly type: ChallengeTargetType.ANYONE;
}

export interface ChallengeTargetGroupFilter {
  readonly type: ChallengeTargetType.GROUP;
  readonly filterId: string;
}

export interface ChallengeTargetSpecifiedWallets {
  readonly type: ChallengeTargetType.SPECIFIED_WALLETS;
  readonly wallets: string[];
}

export type ChallengeTarget =
  | ChallengeTargetAnyone
  | ChallengeTargetGroupFilter
  | ChallengeTargetSpecifiedWallets;

export enum ChallengeType {
  INDIVIDUAL_POST = "INDIVIDUAL_POST",
  POST_VS_POST = "POST_VS_POST",
}

export enum ChallengeVotingType {
  HIGHEST_POINTS = "HIGHEST_POINTS",
  THRESHOLD_POINTS = "THRESHOLD_POINTS",
  THRESHOLD_POINTS_WITH_TIME_LOCK = "THRESHOLD_POINTS_WITH_TIME_LOCK",
  INDIVIDUAL_VOTE = "INDIVIDUAL_VOTE",
  POLL = "POLL",
}

export enum ChallengeVotingMetricType {
  TDH = "TDH",
  TDH_QUADRATIC = "TDH_QUADRATIC",
  TDH_UNWEIGHTED = "TDH_UNWEIGHTED",
  TDH_UNBOOSTED = "TDH_UNBOOSTED",
  REP = "REP",
  REP_CATEGORY = "REP_CATEGORY",
  INDIVIDUAL_POST = "INDIVIDUAL_POST",
}

export type ChallengeIndividualPostVotingType = ChallengeVotingType.HIGHEST_POINTS;
export type ChallengeIndividualPostVotingMetricType = ChallengeVotingMetricType.TDH;

export interface ChallengeIndividualPost {
  readonly type: ChallengeType.INDIVIDUAL_POST;
  readonly votingType: ChallengeIndividualPostVotingType;
  readonly votingMetricType: ChallengeIndividualPostVotingMetricType;
}

export interface Challenge {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly maxParticipants: number | null;
  readonly startTimestamp: number;
  readonly endTimestamp: number | null;
  readonly metadata: ChallengeMetadata[];
  readonly canAccept: ChallengeTarget;
  readonly canSee: ChallengeTarget;
  readonly canVote: ChallengeTarget;
  readonly challengeType: ChallengeType;
}
