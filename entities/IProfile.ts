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
    consolidation_key: string | null;
    consolidation_display: string | null;
  };
  readonly level: number;
  readonly cic: AggregatedCicRating;
  readonly rep: number;
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

export enum ProfileActivityLogType {
  RATING_EDIT = "RATING_EDIT",
  HANDLE_EDIT = "HANDLE_EDIT",
  PRIMARY_WALLET_EDIT = "PRIMARY_WALLET_EDIT",
  CLASSIFICATION_EDIT = "CLASSIFICATION_EDIT",
  SOCIALS_EDIT = "SOCIALS_EDIT",
  CONTACTS_EDIT = "CONTACTS_EDIT",
  SOCIAL_VERIFICATION_POST_EDIT = "SOCIAL_VERIFICATION_POST_EDIT",
  BANNER_1_EDIT = "BANNER_1_EDIT",
  BANNER_2_EDIT = "BANNER_2_EDIT",
  PFP_EDIT = "PFP_EDIT",
  PROFILE_ARCHIVED = "PROFILE_ARCHIVED",
}

export const PROFILE_ACTIVITY_TYPE_TO_TEXT: Record<
  ProfileActivityLogType,
  string
> = {
  [ProfileActivityLogType.RATING_EDIT]: "Rating",
  [ProfileActivityLogType.HANDLE_EDIT]: "Handle",
  [ProfileActivityLogType.PRIMARY_WALLET_EDIT]: "Primary Wallet",
  [ProfileActivityLogType.CLASSIFICATION_EDIT]: "Classification",
  [ProfileActivityLogType.SOCIALS_EDIT]: "Social Media Account",
  [ProfileActivityLogType.CONTACTS_EDIT]: "Contact",
  [ProfileActivityLogType.SOCIAL_VERIFICATION_POST_EDIT]:
    "Social Media Verification Post",
  [ProfileActivityLogType.BANNER_1_EDIT]: "Banner 1",
  [ProfileActivityLogType.BANNER_2_EDIT]: "Banner 2",
  [ProfileActivityLogType.PFP_EDIT]: "Profile Picture",
  [ProfileActivityLogType.PROFILE_ARCHIVED]: "Profile Archived",
};

export interface ProfileActivityLogBase {
  readonly id: string;
  readonly profile_id: string;
  readonly target_id: string | null;
  readonly created_at: Date;
  readonly profile_handle: string;
  readonly target_profile_handle: string | null;
}

export enum ProfileActivityLogRatingEditContentChangeReason {
  USER_EDIT = "USER_EDIT",
  LOST_TDH = "LOST_TDH",
}

export enum ProfileActivityLogRatingEditContentMatter {
  CIC = "CIC",
  REP = "REP",
}

export interface ProfileActivityLogRatingEdit extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.RATING_EDIT;
  readonly contents: {
    change_reason: ProfileActivityLogRatingEditContentChangeReason;
    new_rating: number;
    old_rating: number;
    rating_category: string;
    rating_matter: ProfileActivityLogRatingEditContentMatter;
  };
}

export interface ProfileActivityLogHandleEdit extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.HANDLE_EDIT;
  readonly contents: {
    new_value: string;
    old_value: string;
  };
}

export interface ProfileActivityLogPrimaryWalletEdit
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.PRIMARY_WALLET_EDIT;
  readonly contents: {
    new_value: string;
    old_value: string;
  };
}

export interface ProfileActivityLogClassificationEdit
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.CLASSIFICATION_EDIT;
  readonly contents: {
    new_value: PROFILE_CLASSIFICATION;
    old_value: PROFILE_CLASSIFICATION;
  };
}

export interface ProfileActivityLogBanner1Edit extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.BANNER_1_EDIT;
  readonly contents: {
    new_value: string;
    old_value: string;
  };
}

export interface ProfileActivityLogBanner2Edit extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.BANNER_2_EDIT;
  readonly contents: {
    new_value: string;
    old_value: string;
  };
}

export interface ProfileActivityLogPfpEdit extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.PFP_EDIT;
  readonly contents: {
    new_value: string;
    old_value: string;
  };
}

export enum ProfileActivityLogSocialsEditContentAction {
  ADD = "ADD",
  DELETE = "DELETE",
}

export const PROFILE_ACTIVITY_LOG_ACTION_STR: Record<
  ProfileActivityLogSocialsEditContentAction,
  string
> = {
  [ProfileActivityLogSocialsEditContentAction.ADD]: "added",
  [ProfileActivityLogSocialsEditContentAction.DELETE]: "removed",
};

export interface ProfileActivityLogSocialsEdit extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.SOCIALS_EDIT;
  readonly contents: {
    action: ProfileActivityLogSocialsEditContentAction;
    statement: CicStatement;
  };
}

export interface ProfileActivityLogContactsEdit extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.CONTACTS_EDIT;
  readonly contents: {
    action: ProfileActivityLogSocialsEditContentAction;
    statement: CicStatement;
  };
}

export interface ProfileActivityLogSocialVerificationPostEdit
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.SOCIAL_VERIFICATION_POST_EDIT;
  readonly contents: {
    action: ProfileActivityLogSocialsEditContentAction;
    statement: CicStatement;
  };
}

export interface ProfileActivityLogArchived extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.PROFILE_ARCHIVED;
  readonly contents: {
    readonly handle: string;
    readonly reason: string;
  };
}

export type ProfileActivityLog =
  | ProfileActivityLogRatingEdit
  | ProfileActivityLogHandleEdit
  | ProfileActivityLogPrimaryWalletEdit
  | ProfileActivityLogClassificationEdit
  | ProfileActivityLogSocialsEdit
  | ProfileActivityLogContactsEdit
  | ProfileActivityLogSocialVerificationPostEdit
  | ProfileActivityLogBanner1Edit
  | ProfileActivityLogBanner2Edit
  | ProfileActivityLogPfpEdit
  | ProfileActivityLogArchived;

export enum RateMatter {
  CIC = "CIC",
}

export interface ProfilesMatterRating {
  readonly rater_handle: string;
  readonly matter: RateMatter;
  readonly matter_category: string;
  readonly rating: number;
  readonly rater_cic_rating: number;
  readonly rater_tdh: number;
  readonly last_modified: Date;
}

export interface ProfilesMatterRatingWithRaterLevel
  extends ProfilesMatterRating {
  readonly rater_level: number;
}

export interface CommunityMemberMinimal {
  readonly handle: string | null;
  readonly normalised_handle: string | null;
  readonly primary_wallet: string | null;
  readonly display: string | null;
  readonly tdh: number;
  readonly level: number;
  readonly cic_rating: number;
  readonly wallet: string;
}

export interface RatingStats {
  readonly category: string;
  readonly rating: number;
  readonly contributor_count: number;
  readonly rater_contribution: number;
}

export interface ApiProfileRepRatesState {
  readonly total_rep_rating: number;
  readonly total_rep_rating_by_rater: number | null;
  readonly rep_rates_left_for_rater: number | null;
  readonly number_of_raters: number;
  readonly rating_stats: RatingStats[];
}

export interface RatingWithProfileInfo {
  handle: string;
  tdh: number;
  rating: number;
  cic: number;
  last_modified: Date;
}

export type RatingWithProfileInfoAndLevel = RatingWithProfileInfo & {
  level: number;
};
