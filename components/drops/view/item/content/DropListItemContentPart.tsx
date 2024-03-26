import { MentionedUser, ReferencedNft } from "../../../../../entities/IDrop";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import { DropContentPartType } from "./DropListItemContent";
import DropListItemContentHashtag from "./DropListItemContentHashtag";
import DropListItemContentMention from "./DropListItemContentMention";

export interface DropListItemContentMentionProps {
  readonly type: DropContentPartType.MENTION;
  readonly value: MentionedUser;
}

export interface DropListItemContentHashtagProps {
  readonly type: DropContentPartType.HASHTAG;
  readonly value: ReferencedNft;
}

export type DropListItemContentPartProps =
  | DropListItemContentMentionProps
  | DropListItemContentHashtagProps;

export default function DropListItemContentPart({
  part,
}: {
  readonly part: DropListItemContentPartProps;
}) {
  const { type, value } = part;
  switch (type) {
    case DropContentPartType.MENTION:
      return <DropListItemContentMention user={value} />;
    case DropContentPartType.HASHTAG:
      return <DropListItemContentHashtag nft={value} />;
    default:
      assertUnreachable(type);
  }
}
