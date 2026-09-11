import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import DropListItemContentNft from "./nft-tag/DropListItemContentNft";
import DropListItemContentGroupMention from "./DropListItemContentGroupMention";
import DropListItemContentMention from "./DropListItemContentMention";
import DropListItemContentWaveMention from "./DropListItemContentWaveMention";
import {
  DropContentPartType,
  type DropListItemContentPartProps,
} from "./DropListItemContentPart.types";

export default function DropListItemContentPart({
  part,
}: {
  readonly part: DropListItemContentPartProps;
}) {
  const { type, value } = part;
  switch (type) {
    case DropContentPartType.MENTION:
      return <DropListItemContentMention user={value} />;
    case DropContentPartType.GROUP_MENTION:
      return (
        <DropListItemContentGroupMention group={value} text={part.match} />
      );
    case DropContentPartType.HASHTAG:
      return <DropListItemContentNft nft={value} />;
    case DropContentPartType.WAVE_MENTION:
      return <DropListItemContentWaveMention wave={value} />;
    default:
      return assertUnreachable(type);
  }
}
