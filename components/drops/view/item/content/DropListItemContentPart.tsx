import { DropContentPart, DropContentPartType } from "./DropListItemContent";
import DropListItemContentHashtag from "./DropListItemContentHashtag";
import DropListItemContentMention from "./DropListItemContentMention";

export default function DropListItemContentPart({
  part,
}: {
  readonly part: DropContentPart;
}) {
  const components: Record<DropContentPartType, JSX.Element> = {
    [DropContentPartType.MENTION]: (
      <DropListItemContentMention mention={part.value} />
    ),
    [DropContentPartType.HASHTAG]: (
      <DropListItemContentHashtag hashtag={part.value} />
    ),
  };
  return components[part.type];
}
