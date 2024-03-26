import { ReactNode } from "react";
import { DropFull } from "../../../../../entities/IDrop";
import Markdown from "react-markdown";
import DropListItemContentMention from "./DropListItemContentMention";
import DropListItemContentPart from "./DropListItemContentPart";
export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

export interface DropContentPart {
  value: string;
  type: DropContentPartType;
}

const PART_STARTING_CHAR: Record<DropContentPartType, string> = {
  [DropContentPartType.MENTION]: "@",
  [DropContentPartType.HASHTAG]: "#",
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
  const mentionStrings = drop.mentioned_users.map(
    (user) => user.handle_in_content
  );
  const nftStrings = drop.referenced_nfts.map((nft) => nft.name);

  const parts: DropContentPart[] = [
    ...mentionStrings.map((mention) => ({
      value: mention,
      type: DropContentPartType.MENTION,
    })),
    ...nftStrings.map((nft) => ({
      value: nft,
      type: DropContentPartType.HASHTAG,
    })),
  ];
  let nodes: (JSX.Element | string)[] = [children];

  parts.forEach((part) => {
    const regex = new RegExp(
      `${PART_STARTING_CHAR[part.type]}\\[${part.value}\\]`,
      "g"
    );
    nodes = nodes.flatMap((node) =>
      typeof node === "string"
        ? node
            .split(regex)
            .map((subnode, index) =>
              index % 2 === 0 ? (
                subnode
              ) : (
                <DropListItemContentPart
                  key={`${part.value}-${index}`}
                  part={part}
                />
              )
            )
        : [node]
    );
  });
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
