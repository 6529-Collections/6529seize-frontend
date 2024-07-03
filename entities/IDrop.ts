import { CreateDropRequest } from "../generated/models/CreateDropRequest";
import { ProfileMin } from "../generated/models/ProfileMin";
import { FullPageRequest } from "../helpers/Types";
import {
  ProfileActivityLogDropCreated,
  ProfileActivityLogDropComment,
  ProfileActivityLogDropRatingEdit,
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

export interface QuotedDrop {
  readonly drop_id: string;
  readonly drop_part_id: number;
}

export interface DropRateChangeRequest {
  readonly rating: number;
  readonly category: string;
}

export type DropActivityLogBase =
  | ProfileActivityLogDropComment
  | ProfileActivityLogDropRatingEdit;

export interface DropActivityLogDiscussion
  extends ProfileActivityLogDropComment {
  readonly author: ProfileMin | null;
}

export interface DropActivityLogRepEdit
  extends ProfileActivityLogDropRatingEdit {
  readonly author: ProfileMin | null;
}

export interface DropActivityLogDropCreated
  extends ProfileActivityLogDropCreated {
  readonly author: ProfileMin | null;
}
export type DropActivityLog =
  | DropActivityLogDiscussion
  | DropActivityLogRepEdit
  | DropActivityLogDropCreated;

export interface CreateDropRequestPart {
  readonly content: string | null;
  readonly quoted_drop: QuotedDrop | null;
  readonly media: Array<DropMedia>;
}

// export interface CreateDropRequest {
//   readonly title: string | null;
//   readonly parts: Array<CreateDropRequestPart>;
//   readonly referenced_nfts: Array<ReferencedNft>;
//   readonly mentioned_users: Array<Omit<MentionedUser, "current_handle">>;
//   readonly metadata: Array<DropMetadata>;
// }

export interface CreateDropPart extends Omit<CreateDropRequestPart, "media"> {
  readonly media: Array<File>;
}

export interface CreateDropConfig
  extends Omit<CreateDropRequest, "parts" | "wave_id"> {
  readonly parts: Array<CreateDropPart>;
}

export type DropPartDiscussionRequest = FullPageRequest<"created_at">;
