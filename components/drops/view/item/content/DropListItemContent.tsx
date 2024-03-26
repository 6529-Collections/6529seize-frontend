import { ReactNode } from "react";
import { DropFull } from "../../../../../entities/IDrop";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DropListItemContentPart, {
  DropListItemContentHashtagProps,
  DropListItemContentMentionProps,
  DropListItemContentPartProps,
} from "./DropListItemContentPart";
import {
  assertUnreachable,
  getRandomObjectId,
} from "../../../../../helpers/AllowlistToolHelpers";
export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

const customRenderer = ({
  content,
  drop,
}: {
  readonly content: ReactNode | undefined;
  readonly drop: DropFull;
}) => {
  if (typeof content !== "string") {
    return content;
  }

  const splitter = getRandomObjectId();

  const values: Record<string, DropListItemContentPartProps> = {
    ...drop.mentioned_users.reduce(
      (acc, user) => ({
        ...acc,
        [`@[${user.handle_in_content}]`]: {
          type: DropContentPartType.MENTION,
          value: user,
          match: `@[${user.handle_in_content}]`,
        },
      }),
      {}
    ),
    ...drop.referenced_nfts.reduce(
      (acc, nft) => ({
        ...acc,
        [`#[${nft.name}]`]: {
          type: DropContentPartType.HASHTAG,
          value: nft,
          match: `#[${nft.name}]`,
        },
      }),
      {}
    ),
  };

  let currentContent = content;

  for (const token of Object.values(values)) {
    currentContent = currentContent.replaceAll(
      token.match,
      `${splitter}${token.match}${splitter}`
    );
  }

  const parts = currentContent
    .split(splitter)
    .filter((part) => part !== "")
    .map((part) => {
      const partProps = values[part];
      if (partProps) {
        return <DropListItemContentPart key={part} part={partProps} />;
      }
      return part;
    });

  return parts;
};

export default function DropListItemContent({
  drop,
}: {
  readonly drop: DropFull;
}) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h5: (params) => (
          <h5>{customRenderer({ content: params.children, drop })}</h5>
        ),
        h4: (params) => (
          <h4>{customRenderer({ content: params.children, drop })}</h4>
        ),
        h3: (params) => (
          <h3>{customRenderer({ content: params.children, drop })}</h3>
        ),
        h2: (params) => (
          <h2>{customRenderer({ content: params.children, drop })}</h2>
        ),
        h1: (params) => (
          <h1>{customRenderer({ content: params.children, drop })}</h1>
        ),
        p: (params) => (
          <p className="tw-text-base tw-text-iron-50 tw-font-normal">
            {customRenderer({ content: params.children, drop })}
          </p>
        ),
        li: (params) => (
          <li>{customRenderer({ content: params.children, drop })}</li>
        ),
      }}
    >
      {drop.content}
    </Markdown>
  );
}
