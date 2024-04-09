import { ReactNode } from "react";
import { DropFull } from "../../../../../entities/IDrop";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import DropListItemContentPart, {
  DropListItemContentPartProps,
} from "./DropListItemContentPart";
import { DropContentPartType } from "./DropListItemContent";
import React from "react";

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

const DropListItemContentMarkdown = React.memo(
  ({ drop }: { readonly drop: DropFull }) => {
    const dropContent = drop.content?.slice(0, 1000);
    return (
      <div>
        <Markdown
          remarkPlugins={[remarkGfm]}
          className="tw-w-full"
          components={{
            h5: (params) => (
              <h5 className="tw-text-iron-50">
                {customRenderer({ content: params.children, drop })}
              </h5>
            ),
            h4: (params) => (
              <h4 className="tw-text-iron-50">
                {customRenderer({ content: params.children, drop })}
              </h4>
            ),
            h3: (params) => (
              <h3 className="tw-text-iron-50">
                {customRenderer({ content: params.children, drop })}
              </h3>
            ),
            h2: (params) => (
              <h2 className="tw-text-iron-50">
                {customRenderer({ content: params.children, drop })}
              </h2>
            ),
            h1: (params) => (
              <h1 className="tw-text-iron-50">
                {customRenderer({ content: params.children, drop })}
              </h1>
            ),
            p: (params) => (
              <p className="last:tw-mb-0 tw-text-md tw-leading-6 tw-text-iron-50 tw-font-normal">
                {customRenderer({ content: params.children, drop })}
              </p>
            ),
            li: (params) => (
              <li className="tw-text-iron-50">
                {customRenderer({ content: params.children, drop })}
              </li>
            ),
            code: (params) => (
              <code className="tw-text-iron-50 tw-whitespace-pre-wrap">
                {customRenderer({ content: params.children, drop })}
              </code>
            ),
          }}
        >
          {dropContent}
        </Markdown>
        <div className=" tw-bg-iron-200">More</div>
      </div>
    );
  }
);

DropListItemContentMarkdown.displayName = "DropListItemContentMarkdown";
export default DropListItemContentMarkdown;
