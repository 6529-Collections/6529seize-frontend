import { ReactNode } from "react";
import { DropFull } from "../../../../../entities/IDrop";
import Markdown from "react-markdown";
import DropListItemContentPart, {
  DropListItemContentHashtagProps,
  DropListItemContentMentionProps,
  DropListItemContentPartProps,
} from "./DropListItemContentPart";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

const PART_STARTING_CHAR: Record<DropContentPartType, string> = {
  [DropContentPartType.MENTION]: "@",
  [DropContentPartType.HASHTAG]: "#",
};

const getRegex = (part: DropListItemContentPartProps) => {
  switch (part.type) {
    case DropContentPartType.MENTION:
      return new RegExp(`@\\[${part.value.handle_in_content}\\]`, "g");
    case DropContentPartType.HASHTAG:
      return new RegExp(`#\\[${part.value.name}\\]`, "g");
    default:
      assertUnreachable(part);
      return new RegExp("");
  }
};

function CustomP({
  children,
  drop,
}: {
  readonly children: ReactNode | undefined;
  readonly drop: DropFull;
}) {
  if (typeof children !== "string") {
    return <p>{children}</p>;
  }

  const mentions: DropListItemContentMentionProps[] = drop.mentioned_users.map(
    (user) => ({
      type: DropContentPartType.MENTION,
      value: user,
    })
  );

  const hashtags: DropListItemContentHashtagProps[] = drop.referenced_nfts.map(
    (nft) => ({
      type: DropContentPartType.HASHTAG,
      value: nft,
    })
  );

  const parts: DropListItemContentPartProps[] = [...mentions, ...hashtags];
  const initialNodes: (JSX.Element | string)[] = [children];

  const nodes = parts.reduce((currentNodes, part) => {
    const regex = getRegex(part);
    return currentNodes.flatMap((node) =>
      typeof node === "string"
        ? node
            .split(regex)
            .map((subnode, index) =>
              index % 2 === 0 ? (
                subnode
              ) : (
                <DropListItemContentPart
                  key={`${part.type}-${index}`}
                  part={part}
                />
              )
            )
        : [node]
    );
  }, initialNodes);
  return <p>{nodes}</p>;
}

export default function DropListItemContent({
  drop,
}: {
  readonly drop: DropFull;
}) {
  return (
    <Markdown
      components={{
        p: (params) => CustomP({ children: params.children, drop }),
      }}
    >
      {drop.content}
    </Markdown>
  );
}
