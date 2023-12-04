import { STATEMENT_GROUP, STATEMENT_TYPE } from "../helpers/Types";

export interface IProfileWallet {
  readonly address: string;
  readonly ens?: string;
}

export interface IProfileConsolidation {
  readonly wallet: IProfileWallet;
  readonly tdh: number;
}

export interface AggregatedCicRating {
  cic_rating: number;
  contributor_count: number;
}

export interface IProfileAndConsolidations {
  readonly profile: IProfile | null;
  readonly consolidation: {
    wallets: IProfileConsolidation[];
    tdh: number;
  };
  readonly level: number;
  readonly cic: AggregatedCicRating;
}

export enum PROFILE_CLASSIFICATION {
  GOVERNMENT_NAME = "GOVERNMENT_NAME",
  PSEUDONYM = "PSEUDONYM",
  ORGANIZATION = "ORGANIZATION",
  AI = "AI",
  BOT = "BOT",
  PARODY = "PARODY",
}

export const CLASSIFICATIONS: Record<
  PROFILE_CLASSIFICATION,
  { title: string }
> = {
  [PROFILE_CLASSIFICATION.GOVERNMENT_NAME]: { title: "Government Name" },
  [PROFILE_CLASSIFICATION.PSEUDONYM]: { title: "Pseudonym" },
  [PROFILE_CLASSIFICATION.ORGANIZATION]: { title: "Organization" },
  [PROFILE_CLASSIFICATION.AI]: { title: "AI" },
  [PROFILE_CLASSIFICATION.BOT]: { title: "Bot" },
  [PROFILE_CLASSIFICATION.PARODY]: { title: "Parody" },
};

export interface IProfile {
  readonly normalised_handle: string;
  readonly handle: string;
  readonly primary_wallet: string;
  readonly created_at: Date;
  readonly created_by_wallet: string;
  readonly classification: PROFILE_CLASSIFICATION | null;
  readonly updated_at?: Date | undefined;
  readonly updated_by_wallet?: string | undefined;
  readonly pfp_url?: string | undefined;
  readonly banner_1?: string | undefined;
  readonly banner_2?: string | undefined;
  readonly website?: string | undefined;
}

export enum CICType {
  INACCURATE = "INACCURATE",
  UNKNOWN = "UNKNOWN",
  PROBABLY_ACCURATE = "PROBABLY_ACCURATE",
  ACCURATE = "ACCURATE",
  HIGHLY_ACCURATE = "HIGHLY_ACCURATE",
}

export const CIC_TO_TEXT: Record<CICType, string> = {
  [CICType.INACCURATE]: "Inaccurate",
  [CICType.UNKNOWN]: "Not Enough Ratings Yet",
  [CICType.PROBABLY_ACCURATE]: "Probably Accurate",
  [CICType.ACCURATE]: "Accurate",
  [CICType.HIGHLY_ACCURATE]: "Highly Accurate",
};

export interface ApiProfileRaterCicState {
  readonly cic_rating_by_rater: number | null;
  readonly cic_ratings_left_to_give_by_rater: number | null;
}

export interface CicStatement {
  id: string;
  profile_id: string;
  statement_group: STATEMENT_GROUP;
  statement_type: STATEMENT_TYPE;
  statement_comment: string | null;
  statement_value: string;
  crated_at: Date;
  updated_at: Date | null;
}

export enum PROFILE_ACTIVITY_TYPE {
  CIC_RATING = "CIC_RATING",
  HANDLE = "HANDLE",
  PRIMARY_WALLET = "PRIMARY_WALLET",
  SOCIAL_MEDIA_ACCOUNT = "SOCIAL_MEDIA_ACCOUNT",
  CONTACT = "CONTACT",
  SOCIAL_MEDIA_VERIFICATION_POST = "SOCIAL_MEDIA_VERIFICATION_POST",
}

export const PROFILE_ACTIVITY_TYPE_TO_TEXT: Record<
  PROFILE_ACTIVITY_TYPE,
  string
> = {
  [PROFILE_ACTIVITY_TYPE.CIC_RATING]: "CIC Rating",
  [PROFILE_ACTIVITY_TYPE.HANDLE]: "Handle",
  [PROFILE_ACTIVITY_TYPE.PRIMARY_WALLET]: "Primary Wallet",
  [PROFILE_ACTIVITY_TYPE.SOCIAL_MEDIA_ACCOUNT]: "Social Media Account",
  [PROFILE_ACTIVITY_TYPE.CONTACT]: "Contact",
  [PROFILE_ACTIVITY_TYPE.SOCIAL_MEDIA_VERIFICATION_POST]:
    "Social Media Verification Post",
};
