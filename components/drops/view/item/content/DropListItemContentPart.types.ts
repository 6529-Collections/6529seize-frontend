import type { MentionedUser, ReferencedNft } from "@/entities/IDrop";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";

export enum DropContentPartType {
  MENTION = "MENTION",
  GROUP_MENTION = "GROUP_MENTION",
  HASHTAG = "HASHTAG",
  WAVE_MENTION = "WAVE_MENTION",
}

interface DropListItemContentMentionProps {
  readonly type: DropContentPartType.MENTION;
  readonly value: MentionedUser;
  readonly match: string;
}

interface DropListItemContentHashtagProps {
  readonly type: DropContentPartType.HASHTAG;
  readonly value: ReferencedNft;
  readonly match: string;
}

interface DropListItemContentGroupMentionProps {
  readonly type: DropContentPartType.GROUP_MENTION;
  readonly value: ApiDropGroupMention;
  readonly match: string;
}

interface DropListItemContentWaveMentionProps {
  readonly type: DropContentPartType.WAVE_MENTION;
  readonly value: ApiMentionedWave;
  readonly match: string;
}

export type DropListItemContentPartProps =
  | DropListItemContentMentionProps
  | DropListItemContentGroupMentionProps
  | DropListItemContentHashtagProps
  | DropListItemContentWaveMentionProps;
