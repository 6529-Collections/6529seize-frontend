import { ProfileMinimal } from "./IProfile";

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
  readonly storm_id: number;
  readonly storm_sequence: number;
}