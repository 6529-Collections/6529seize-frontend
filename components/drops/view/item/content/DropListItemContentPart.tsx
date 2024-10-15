import { MentionedUser, ReferencedNft } from "../../../../../entities/IDrop";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import { DropContentPartType } from "./DropListItemContent";
import DropListItemContentNft from "./nft-tag/DropListItemContentNft";
import DropListItemContentMention from "./DropListItemContentMention";

export interface DropListItemContentMentionProps {
  readonly type: DropContentPartType.MENTION;
  readonly value: MentionedUser;
  readonly match: string;
}

export interface DropListItemContentHashtagProps {
  readonly type: DropContentPartType.HASHTAG;
  readonly value: ReferencedNft;
  readonly match: string;
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
      return <DropListItemContentNft nft={value} />;
    default:
      assertUnreachable(type);
  }
}
