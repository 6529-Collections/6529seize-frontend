export interface ReferencedNft {
  readonly contract: string;
  readonly tokenId: string;
  readonly name: string;
}

export interface MentionedUser {
  readonly mentioned_profile_id: string;
  readonly handle_in_content: string;
}

export interface DropApiRequest {
  readonly title: string | null;
  readonly content: string | null;
  readonly reply_to_drop_id: string | null;
  readonly quoted_drop_id: string | null;
  readonly referenced_nfts: ReferencedNft[];
  readonly mentioned_users: MentionedUser[];
}
