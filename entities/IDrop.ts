import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

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

export interface MentionedWave {
  readonly wave_id: string;
  readonly wave_name_in_content: string;
}

export interface DropMetadata {
  readonly data_key: string;
  readonly data_value: string;
}

interface DropMedia {
  readonly url: string;
  readonly mime_type: string;
}

interface QuotedDrop {
  readonly drop_id: string;
  readonly drop_part_id: number;
}

export interface DropRateChangeRequest {
  readonly rating: number;
  readonly category: string;
}

export interface CreateDropRequestPart {
  readonly content: string | null;
  readonly quoted_drop: QuotedDrop | null;
  readonly media: Array<DropMedia>;
}

export interface CreateDropPart extends Omit<CreateDropRequestPart, "media"> {
  readonly media: Array<File>;
  readonly mentioned_groups?: Array<ApiDropGroupMention>;
}

export interface CreateDropConfig extends Omit<
  ApiCreateDropRequest,
  "parts" | "wave_id"
> {
  readonly parts: Array<CreateDropPart>;
}
