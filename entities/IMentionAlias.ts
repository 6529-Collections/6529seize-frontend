export interface MentionAliasMember {
  readonly profile_id: string;
  readonly handle: string;
  readonly pfp: string | null;
}

export interface MentionAlias {
  readonly id: string;
  readonly alias: string;
  readonly members: MentionAliasMember[];
}

export interface MentionAliasInput {
  readonly alias: string;
  readonly member_profile_ids: string[];
}
