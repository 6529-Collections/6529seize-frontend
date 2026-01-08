import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants";
import type { RateMatter } from "@/enums";
import { ContractType, ProfileActivityLogType } from "@/enums";
import type { AcceptActionRequestActionEnum } from "@/generated/models/AcceptActionRequest";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import type { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";

interface IProfileWallet {
  readonly address: string;
  readonly ens?: string | undefined;
}

export interface IProfileConsolidation {
  readonly wallet: IProfileWallet;
  readonly tdh: number;
}

export const CLASSIFICATIONS: Record<
  ApiProfileClassification,
  { title: string }
> = {
  [ApiProfileClassification.GovernmentName]: { title: "Government Name" },
  [ApiProfileClassification.Pseudonym]: { title: "Pseudonym" },
  [ApiProfileClassification.Organization]: { title: "Organization" },
  [ApiProfileClassification.Ai]: { title: "AI" },
  [ApiProfileClassification.Bot]: { title: "Bot" },
  [ApiProfileClassification.Parody]: { title: "Parody" },
  [ApiProfileClassification.Collection]: { title: "Collection" },
};

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

interface ProfileActivityLogBase {
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
    new_value: ApiProfileClassification;
    old_value: ApiProfileClassification;
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

enum ProfileActivityLogSocialsEditContentAction {
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
    readonly type: ApiProfileProxyActionType;
  };
}

export interface ProfileActivityLogProxyActionStateChanged
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.PROXY_ACTION_STATE_CHANGED;
  readonly contents: {
    readonly action_id: string;
    readonly proxy_id: string;
    readonly state_change_type: AcceptActionRequestActionEnum;
    readonly type: ApiProfileProxyActionType;
  };
}

export interface ProfileActivityLogProxyActionChanged
  extends ProfileActivityLogBase {
  readonly type: ProfileActivityLogType.PROXY_ACTION_CHANGED;
  readonly contents: {
    readonly action_id: string;
    readonly end_time?: number | null | undefined;
    readonly credit_amount?: number | undefined;
    readonly proxy_id: string;
    readonly type: ApiProfileProxyActionType;
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

interface ProfileActivityLogProxyDropRatingEdit extends ProfileActivityLogBase {
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

interface RatingWithProfileInfo {
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
  readonly classification: ApiProfileClassification;
  pfp_url?: string | undefined;
  banner_1?: string | undefined;
  banner_2?: string | undefined;
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
  NETWORK = "NETWORK",
}

export const COLLECTED_COLLECTION_TYPE_TO_CONTRACT: Record<
  CollectedCollectionType,
  string
> = {
  [CollectedCollectionType.MEMES]: MEMES_CONTRACT,
  [CollectedCollectionType.NEXTGEN]: NEXTGEN_CONTRACT,
  [CollectedCollectionType.GRADIENTS]: GRADIENT_CONTRACT,
  [CollectedCollectionType.MEMELAB]: MEMELAB_CONTRACT,
  [CollectedCollectionType.NETWORK]: "",
};

export const COLLECTED_COLLECTION_TYPE_TO_CONTRACT_TYPE: Record<
  CollectedCollectionType,
  string
> = {
  [CollectedCollectionType.MEMES]: ContractType.ERC1155,
  [CollectedCollectionType.NEXTGEN]: ContractType.ERC721,
  [CollectedCollectionType.GRADIENTS]: ContractType.ERC721,
  [CollectedCollectionType.MEMELAB]: ContractType.ERC1155,
  [CollectedCollectionType.NETWORK]: "",
};

export enum CollectionSeized {
  SEIZED = "SEIZED",
  NOT_SEIZED = "NOT_SEIZED",
}

export enum CollectionSort {
  TOKEN_ID = "TOKEN_ID",
  TDH = "TDH",
  RANK = "RANK",
  XTDH = "XTDH",
  XTDH_DAY = "XTDH_DAY",
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

export enum ProfileConnectedStatus {
  NOT_CONNECTED = "NOT_CONNECTED",
  NO_PROFILE = "NO_PROFILE",
  PROXY = "PROXY",
  HAVE_PROFILE = "HAVE_PROFILE",
}
