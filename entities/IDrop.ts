import {
  ProfileActivityLogDropCreated,
  ProfileActivityLogDropComment,
  ProfileActivityLogDropRepEdit,
  ProfileMinimal,
} from "./IProfile";

export interface ReferencedNft {
  readonly contract: string;
  readonly token: string;
  readonly name: string;
}

export interface MentionedUser {
  readonly mentioned_profile_id: string;
  readonly handle_in_content: string;
  readonly current_handle: string | null;
}

export interface DropMetadata {
  readonly data_key: string;
  readonly data_value: string;
}

export interface DropMedia {
  readonly url: string;
  readonly mime_type: string;
}

export interface DropRater {
  readonly profile: ProfileMinimal;
  readonly rating: number;
}

export interface DropRatingCategory {
  readonly category: string;
  readonly rating: number;
}

export interface DropContextProfileContext {
  readonly categories: Array<DropRatingCategory>;
  readonly rating: number;
  readonly discussion_comments_count: number;
  readonly quotes_count: number;
}

export interface Drop {
  readonly id: string;
  readonly serial_no: number;
  readonly author: ProfileMinimal;
  readonly created_at: number;
  readonly title: string | null;
  readonly content: string | null;
  readonly quoted_drop_id: string | null;
  readonly root_drop_id: string | null;
  readonly referenced_nfts: Array<ReferencedNft>;
  readonly mentioned_users: Array<MentionedUser>;
  readonly metadata: Array<DropMetadata>;
  readonly media: Array<DropMedia>;
  readonly storm_sequence: number;
  readonly max_storm_sequence: number;
  readonly rating: number;
  readonly top_raters: Array<DropRater>;
  readonly raters_count: number;
  readonly top_rating_categories: Array<DropRatingCategory>;
  readonly rating_categories_count: number;
  readonly discussion_comments_count: number;
  readonly rating_logs_count: number;
  readonly quotes_count: number;
  readonly context_profile_context: DropContextProfileContext | null;
}

export interface DropRateChangeRequest {
  readonly amount: number;
  readonly category: string;
}

export type DropActivityLogBase =
  | ProfileActivityLogDropComment
  | ProfileActivityLogDropRepEdit;

export interface DropActivityLogDiscussion
  extends ProfileActivityLogDropComment {
  readonly author: ProfileMinimal | null;
}

export interface DropActivityLogRepEdit extends ProfileActivityLogDropRepEdit {
  readonly author: ProfileMinimal | null;
}

export interface DropActivityLogDropCreated
  extends ProfileActivityLogDropCreated {
  readonly author: ProfileMinimal | null;
}
export type DropActivityLog =
  | DropActivityLogDiscussion
  | DropActivityLogRepEdit
  | DropActivityLogDropCreated;

export interface CreateDropRequest {
  readonly title: string | null;
  readonly content: string | null;
  readonly root_drop_id: number | null;
  readonly quoted_drop_id: string | null;
  readonly referenced_nfts: ReferencedNft[];
  readonly mentioned_users: Omit<MentionedUser, "current_handle">[];
  readonly metadata: DropMetadata[];
  readonly media: {
    readonly url: string;
    readonly mime_type: string;
  }[];
}
