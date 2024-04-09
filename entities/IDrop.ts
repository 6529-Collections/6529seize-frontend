import {
  ProfileActivityLog,
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
}

export interface DropMetadata {
  readonly data_key: string;
  readonly data_value: string;
}

export interface DropFullTopRepGiver {
  readonly rep_given: number;
  readonly profile: ProfileMinimal;
}

export interface DropFullTopRepCategory {
  readonly rep_given: number;
  readonly category: string;
}

export interface DropFullInputProfileCategory {
  readonly category: string;
  readonly rep_given: number;
  readonly rep_given_by_input_profile: number;
}

export interface DropFull {
  readonly id: number;
  readonly author: ProfileMinimal;
  readonly author_archived: boolean;
  readonly created_at: number;
  readonly title: string | null;
  readonly content: string | null;
  readonly quoted_drop_id: number | null;
  readonly referenced_nfts: ReferencedNft[];
  readonly mentioned_users: MentionedUser[];
  readonly metadata: DropMetadata[];
  readonly media_url: string | null;
  readonly media_mime_type: string | null;
  readonly root_drop_id: number | null;
  readonly storm_sequence: number;
  readonly max_storm_sequence: number;
  readonly rep: number;
  readonly top_rep_givers: DropFullTopRepGiver[]; // 5
  readonly total_number_of_rep_givers: number;
  readonly top_rep_categories: DropFullTopRepCategory[]; // 5
  readonly total_number_of_categories: number;
  readonly input_profile_categories: DropFullInputProfileCategory[] | null;
  readonly rep_given_by_input_profile: number | null; // this drop's rep given by the input profile
  readonly discussion_comments_count: number;
  readonly rep_logs_count: number;
  readonly input_profile_discussion_comments_count: number | null;
  readonly quote_count: number;
  readonly quote_count_by_input_profile: number | null;
}

export interface DropRepChangeRequest {
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
export type DropActivityLog =
  | DropActivityLogDiscussion
  | DropActivityLogRepEdit;
