import { MentionedUser, ReferencedNft } from "../../../../../entities/IDrop";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import { DropContentPartType } from "./DropListItemContent";
import DropListItemContentHashtag from "./DropListItemContentHashtag";
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
  container,
  onImageLoaded,
}: {
  readonly part: DropListItemContentPartProps;
  readonly container: React.RefObject<HTMLDivElement>;
  readonly onImageLoaded: () => void;
}) {
  const { type, value } = part;
  switch (type) {
    case DropContentPartType.MENTION:
      return <DropListItemContentMention user={value} />;
    case DropContentPartType.HASHTAG:
      return (
        <DropListItemContentHashtag
          nft={value}
          container={container}
          onImageLoaded={onImageLoaded}
        />
      );
    default:
      assertUnreachable(type);
  }
}
