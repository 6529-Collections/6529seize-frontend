import type { MentionedUser, ReferencedNft } from "@/entities/IDrop";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import DropListItemContentNft from "./nft-tag/DropListItemContentNft";
import DropListItemContentMention from "./DropListItemContentMention";
import DropListItemContentWaveMention from "./DropListItemContentWaveMention";
import { DropContentPartType } from "@/components/drops/view/part/DropPartMarkdown";

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

interface DropListItemContentWaveMentionProps {
  readonly type: DropContentPartType.WAVE_MENTION;
  readonly value: ApiMentionedWave;
  readonly match: string;
}

export type DropListItemContentPartProps =
  | DropListItemContentMentionProps
  | DropListItemContentHashtagProps
  | DropListItemContentWaveMentionProps;

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
    case DropContentPartType.WAVE_MENTION:
      return <DropListItemContentWaveMention wave={value} />;
    default:
      assertUnreachable(type);
      return;
  }
}
