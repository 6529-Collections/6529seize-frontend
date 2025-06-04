import { ApiCreateDropRequest } from "../generated/models/ApiCreateDropRequest";
import { ProfileMinWithoutSubs } from "../helpers/ProfileTypes";
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

interface DropMedia {
  readonly url: string;
  readonly mime_type: string;
}

interface DropRater {
  readonly profile: ProfileMinimal;
  readonly rating: number;
}

interface DropRatingCategory {
  readonly category: string;
  readonly rating: number;
}

interface QuotedDrop {
  readonly drop_id: string;
  readonly drop_part_id: number;
}

export interface DropRateChangeRequest {
  readonly rating: number;
  readonly category: string;
}

type DropActivityLogBase =
  | ProfileActivityLogDropComment
  | ProfileActivityLogDropRatingEdit;

interface DropActivityLogDiscussion extends ProfileActivityLogDropComment {
  readonly author: ProfileMinWithoutSubs | null;
}

interface DropActivityLogRepEdit extends ProfileActivityLogDropRatingEdit {
  readonly author: ProfileMinWithoutSubs | null;
}

interface DropActivityLogDropCreated extends ProfileActivityLogDropCreated {
  readonly author: ProfileMinWithoutSubs | null;
}
type DropActivityLog =
  | DropActivityLogDiscussion
  | DropActivityLogRepEdit
  | DropActivityLogDropCreated;

export interface CreateDropRequestPart {
  readonly content: string | null;
  readonly quoted_drop: QuotedDrop | null;
  readonly media: Array<DropMedia>;
}

export interface CreateDropPart extends Omit<CreateDropRequestPart, "media"> {
  readonly media: Array<File>;
}

export interface CreateDropConfig
  extends Omit<ApiCreateDropRequest, "parts" | "wave_id"> {
  readonly parts: Array<CreateDropPart>;
}

type DropPartDiscussionRequest = FullPageRequest<"created_at">;
