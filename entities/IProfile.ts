import { AcceptActionRequestActionEnum } from "../generated/models/AcceptActionRequest";
import { ProfileProxyActionType } from "../generated/models/ProfileProxyActionType";
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
    readonly wallets: IProfileConsolidation[];
    readonly tdh: number;
    readonly consolidation_key: string | null;
    readonly consolidation_display: string | null;
  };
  readonly level: number;
  readonly cic: AggregatedCicRating;
  readonly rep: number;
  readonly balance: number;
  readonly input_identity: string;
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
  readonly external_id: string;
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
  CLASSIFICATION_EDIT = "CLASSIFICATION_EDIT",
  SOCIALS_EDIT = "SOCIALS_EDIT",
  CONTACTS_EDIT = "CONTACTS_EDIT",
  SOCIAL_VERIFICATION_POST_EDIT = "SOCIAL_VERIFICATION_POST_EDIT",
  NFT_ACCOUNTS_EDIT = "NFT_ACCOUNTS_EDIT",
  GENERAL_CIC_STATEMENT_EDIT = "GENERAL_CIC_STATEMENT_EDIT",
  BANNER_1_EDIT = "BANNER_1_EDIT",
  BANNER_2_EDIT = "BANNER_2_EDIT",
  PFP_EDIT = "PFP_EDIT",
  PROFILE_ARCHIVED = "PROFILE_ARCHIVED",
  PROXY_CREATED = "PROXY_CREATED",
  PROXY_ACTION_CREATED = "PROXY_ACTION_CREATED",
  PROXY_ACTION_STATE_CHANGED = "PROXY_ACTION_STATE_CHANGED",
  PROXY_ACTION_CHANGED = "PROXY_ACTION_CHANGED",
  DROP_COMMENT = "DROP_COMMENT",
  DROP_RATING_EDIT = "DROP_RATING_EDIT",
  DROP_CREATED = "DROP_CREATED",
  PROXY_DROP_RATING_EDIT = "PROXY_DROP_RATING_EDIT",
}

export const PROFILE_ACTIVITY_TYPE_TO_TEXT: Record<
  ProfileActivityLogType,
  string
> = {
  [ProfileActivityLogType.RATING_EDIT]: "Rating",
  [ProfileActivityLogType.HANDLE_EDIT]: "Handle",
  [ProfileActivityLogType.CLASSIFICATION_EDIT]: "Classification",
  [ProfileActivityLogType.SOCIALS_EDIT]: "Social Media Account",
  [ProfileActivityLogType.NFT_ACCOUNTS_EDIT]: "NFT Account",
  [ProfileActivityLogType.CONTACTS_EDIT]: "Contact",
  [ProfileActivityLogType.SOCIAL_VERIFICATION_POST_EDIT]:
    "Social Media Verification Post",
  [ProfileActivityLogType.BANNER_1_EDIT]: "Banner 1",
  [ProfileActivityLogType.BANNER_2_EDIT]: "Banner 2",
  [ProfileActivityLogType.PFP_EDIT]: "Profile Picture",
  [ProfileActivityLogType.PROFILE_ARCHIVED]: "Profile Archived",
  [ProfileActivityLogType.GENERAL_CIC_STATEMENT_EDIT]: "About",
  [ProfileActivityLogType.PROXY_CREATED]: "Proxy Created",
  [ProfileActivityLogType.PROXY_ACTION_CREATED]: "Proxy Action Created",
  [ProfileActivityLogType.PROXY_ACTION_STATE_CHANGED]:
    "Proxy Action State Changed",
  [ProfileActivityLogType.PROXY_ACTION_CHANGED]: "Proxy Action Changed",
  [ProfileActivityLogType.DROP_COMMENT]: "Drop Comment",
  [ProfileActivityLogType.DROP_RATING_EDIT]: "Drop Rating",
  [ProfileActivityLogType.DROP_CREATED]: "Drop Created",
  [ProfileActivityLogType.PROXY_DROP_RATING_EDIT]: "Proxy Drop Rating",
};

export interface ProfileActivityLogBase {
  readonly id: string;
  readonly profile_id: string;
  readonly target_id: string | null;
  readonly created_at: Date;
  readonly profile_handle: string;
  readonly target_profile_handle: string | null;
  readonly proxy_handle: string | null;
  readonly proxy_id: string | null;
}

export enum ProfileActivityLogRatingEditContentChangeReason {
  USER_EDIT = "USER_EDIT",
  LOST_TDH = "LOST_TDH",
}

export interface ProfileActivityLogRatingEdit extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.RATING_EDIT;
  readonly contents: {
    readonly change_reason: ProfileActivityLogRatingEditContentChangeReason;
    readonly new_rating: number;
    readonly old_rating: number;
    readonly rating_category: string;
    readonly rating_matter: RateMatter;
  };
}

export interface ProfileActivityLogHandleEdit extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.HANDLE_EDIT;
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

export interface ProfileActivityLogNftAccountsEdit
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.NFT_ACCOUNTS_EDIT;
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

export interface ProfileActivityLogGeneralCicStatementEdit
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.GENERAL_CIC_STATEMENT_EDIT;
  readonly contents: {
    readonly statement: CicStatement;
  };
}

export interface ProfileActivityLogProxyCreated extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.PROXY_CREATED;
  readonly contents: {};
}

export interface ProfileActivityLogProxyActionCreated
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.PROXY_ACTION_CREATED;
  readonly contents: {
    readonly action_id: string;
    readonly proxy_id: string;
    readonly type: ProfileProxyActionType;
  };
}

export interface ProfileActivityLogProxyActionStateChanged
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.PROXY_ACTION_STATE_CHANGED;
  readonly contents: {
    readonly action_id: string;
    readonly proxy_id: string;
    readonly state_change_type: AcceptActionRequestActionEnum;
    readonly type: ProfileProxyActionType;
  };
}

export interface ProfileActivityLogProxyActionChanged
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.PROXY_ACTION_CHANGED;
  readonly contents: {
    readonly action_id: string;
    readonly end_time?: number | null;
    readonly credit_amount?: number;
    readonly proxy_id: string;
    readonly type: ProfileProxyActionType;
  };
}

export interface ProfileActivityLogDropComment extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.DROP_COMMENT;
  readonly contents: {};
}

export interface ProfileActivityLogDropRatingEdit
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.DROP_RATING_EDIT;
  readonly contents: {};
}

export interface ProfileActivityLogDropCreated extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.DROP_CREATED;
  readonly contents: {};
}

export interface ProfileActivityLogProxyDropRatingEdit
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.PROXY_DROP_RATING_EDIT;
  readonly contents: {};
}

export type ProfileActivityLog =
  | ProfileActivityLogRatingEdit
  | ProfileActivityLogHandleEdit
  | ProfileActivityLogClassificationEdit
  | ProfileActivityLogSocialsEdit
  | ProfileActivityLogContactsEdit
  | ProfileActivityLogSocialVerificationPostEdit
  | ProfileActivityLogBanner1Edit
  | ProfileActivityLogBanner2Edit
  | ProfileActivityLogPfpEdit
  | ProfileActivityLogArchived
  | ProfileActivityLogGeneralCicStatementEdit
  | ProfileActivityLogNftAccountsEdit
  | ProfileActivityLogProxyCreated
  | ProfileActivityLogProxyActionCreated
  | ProfileActivityLogProxyActionStateChanged
  | ProfileActivityLogProxyActionChanged
  | ProfileActivityLogDropComment
  | ProfileActivityLogDropRatingEdit
  | ProfileActivityLogDropCreated
  | ProfileActivityLogProxyDropRatingEdit;

export enum RateMatter {
  NIC = "NIC",
  REP = "REP",
  DROP_REP = "DROP_REP",
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

export interface CommunityMemberMinimal {
  readonly profile_id: string | null;
  readonly handle: string | null;
  readonly normalised_handle: string | null;
  readonly primary_wallet: string | null;
  readonly display: string | null;
  readonly tdh: number;
  readonly level: number;
  readonly cic_rating: number;
  readonly wallet: string;
  readonly pfp: string | null;
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

export interface ApiCreateOrUpdateProfileRequest {
  readonly handle: string;
  readonly classification: PROFILE_CLASSIFICATION;
  pfp_url?: string;
  banner_1?: string;
  banner_2?: string;
}

export interface WalletConsolidationState {
  readonly created_at: Date;
  readonly block: number;
  readonly wallet1: string;
  readonly wallet2: string;
  readonly confirmed: 0 | 1;
  readonly wallet1_display: string | null;
  readonly wallet2_display: string | null;
}

export type ApiCreateOrUpdateProfileCicStatement = Omit<
  CicStatement,
  "id" | "crated_at" | "updated_at" | "profile_id"
>;

export enum CollectedCollectionType {
  MEMES = "MEMES",
  NEXTGEN = "NEXTGEN",
  GRADIENTS = "GRADIENTS",
  MEMELAB = "MEMELAB",
}

export enum CollectionSeized {
  SEIZED = "SEIZED",
  NOT_SEIZED = "NOT_SEIZED",
}

export enum CollectionSort {
  TOKEN_ID = "TOKEN_ID",
  TDH = "TDH",
  RANK = "RANK",
}

export interface CollectedCard {
  readonly collection: CollectedCollectionType;
  readonly token_id: number;
  readonly token_name: string;
  readonly img: string;
  readonly tdh: number | null;
  readonly rank: number | null;
  readonly seized_count: number | null;
  readonly szn: number | null;
}

export interface WalletDelegation {
  readonly created_at: Date;
  readonly block: number;
  readonly from_address: string;
  readonly to_address: string;
  readonly collection: string; //"0x8888888888888888888888888888888888888888" = any collection
  readonly use_case: number;
  readonly expiry: number;
  readonly all_tokens: number;
  readonly token_id: number;
  readonly from_display: string | null;
  readonly to_display: string | null;
}

export interface CommunityMemberOverview {
  readonly display: string;
  readonly detail_view_key: string;
  readonly level: number;
  readonly tdh: number;
  readonly rep: number;
  readonly cic: number;
  readonly pfp: string | null;
  readonly last_activity: number | null;
  readonly wallet: string;
}

export interface ProfileMinimal {
  readonly id: string;
  readonly handle: string;
  readonly pfp: string | null;
  readonly cic: number;
  readonly rep: number;
  readonly tdh: number;
  readonly level: number;
}

export interface ProfileAvailableDropRateResponse {
  readonly available_credit_for_rating: number;
}

export enum ProfileConnectedStatus {
  NOT_CONNECTED = "NOT_CONNECTED",
  NO_PROFILE = "NO_PROFILE",
  PROXY = "PROXY",
  HAVE_PROFILE = "HAVE_PROFILE",
}
