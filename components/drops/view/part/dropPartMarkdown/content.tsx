import {
  Children,
  ClassAttributes,
  Fragment,
  HTMLAttributes,
  ReactNode,
  isValidElement,
} from "react";
import { ExtraProps } from "react-markdown";

import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import type { DropListItemContentPartProps } from "../../item/content/DropListItemContentPart";
import { ApiDropMentionedUser } from "../../../../../generated/models/ApiDropMentionedUser";
import { ApiDropReferencedNFT } from "../../../../../generated/models/ApiDropReferencedNFT";

export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

interface EmojiCategory {
  emojis: Array<{ id: string; skins: Array<{ src: string }> }>;
}

interface NativeEmojiSkin {
  native: string;
}

type FindNativeEmoji = (
  emojiId: string
) => { skins: NativeEmojiSkin[] } | null;

export interface MarkdownContentConfig {
  readonly textSizeClass: string;
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly emojiMap: EmojiCategory[];
  readonly findNativeEmoji: FindNativeEmoji;
  readonly isSmartLink: (href: string) => boolean;
}

export interface MarkdownContentRenderers {
  readonly customRenderer: (content: ReactNode | undefined) => ReactNode;
  readonly renderParagraph: (
    params: ClassAttributes<HTMLParagraphElement> &
      HTMLAttributes<HTMLParagraphElement> &
      ExtraProps
  ) => ReactNode;
  readonly processContent: (content: string | null) => string | null;
}

type DropListItemContentPartComponent = typeof import("../../item/content/DropListItemContentPart").default;

const getDropListItemContentPart = (): DropListItemContentPartComponent => {
  const dropListItemContentPartModule = require("../../item/content/DropListItemContentPart");
  return dropListItemContentPartModule.default as DropListItemContentPartComponent;
};

const emojiRegex = /(:\w+:)/g;

export const createMarkdownContentRenderers = ({
  textSizeClass,
  mentionedUsers,
  referencedNfts,
  emojiMap,
  findNativeEmoji,
  isSmartLink,
}: MarkdownContentConfig): MarkdownContentRenderers => {
  const renderEmoji = (emojiProps: string, bigEmoji: boolean) => {
    const emojiId = emojiProps.replaceAll(":", "");
    const emoji = emojiMap
      .flatMap((cat) => cat.emojis)
      .find((e) => e.id === emojiId);

    if (!emoji) {
      const nativeEmoji = findNativeEmoji(emojiId);
      if (nativeEmoji) {
        return (
          <span className={`${bigEmoji ? "emoji-text-node" : "tw-align-middle"}`}>
            {nativeEmoji.skins[0]?.native}
          </span>
        );
      }
      return <span>{`:${emojiId}:`}</span>;
    }

    return (
      <img
        src={emoji.skins[0]?.src}
        alt={emojiId}
        className={`${bigEmoji ? "emoji-node-big" : "emoji-node"}`}
      />
    );
  };

  const customPartRenderer = (
    content: string
  ): Array<ReactNode> | ReactNode => {
    const splitter = getRandomObjectId();

    const values: Record<string, DropListItemContentPartProps> = {
      ...mentionedUsers.reduce(
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
      ...referencedNfts.reduce(
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

    const isEmoji = (str: string): boolean => {
      const emojiTextRegex = /^(?:\ud83c[\udffb-\udfff]|\ud83d[\udc00-\ude4f\ude80-\udfff]|\ud83e[\udd00-\uddff]|\u00a9|\u00ae|\u200d|\u203c|\u2049|\u2122|\u2139|\u2194-\u21aa|\u231a-\u23fa|\u24c2|\u25aa-\u25fe|\u2600-\u27bf|\u2934-\u2b55|\u3030|\u303d|\u3297|\u3299|\ufe0f)$/;
      return emojiTextRegex.test(str.trim());
    };

    const areAllPartsEmojis = content
      .split(emojiRegex)
      .filter((part) => !!part)
      .every((part) => part.match(emojiRegex) || isEmoji(part));

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
          const randomId = getRandomObjectId();
          const DropListItemContentPart = getDropListItemContentPart();
          return <DropListItemContentPart key={randomId} part={partProps} />;
        }

        const segments = part.split(emojiRegex);
        return segments.map((segment) =>
          segment.match(emojiRegex) ? (
            <Fragment key={getRandomObjectId()}>
              {renderEmoji(segment, areAllPartsEmojis)}
            </Fragment>
          ) : (
            <span
              key={getRandomObjectId()}
              className={
                areAllPartsEmojis ? "emoji-text-node" : "tw-align-middle"
              }
            >
              {segment}
            </span>
          )
        );
      });

    return parts;
  };

  const customRenderer = (content: ReactNode | undefined): ReactNode => {
    if (typeof content === "string") {
      return customPartRenderer(content);
    }

    if (Array.isArray(content)) {
      return content.map((child) => {
        if (typeof child === "string") {
          return customPartRenderer(child);
        }
        return child;
      });
    }

    return content;
  };

  const renderParagraph = (
    params: ClassAttributes<HTMLParagraphElement> &
      HTMLAttributes<HTMLParagraphElement> &
      ExtraProps
  ) => {
    const renderP = (
      paragraphParams: ClassAttributes<HTMLParagraphElement> &
        HTMLAttributes<HTMLParagraphElement> &
        ExtraProps
    ) => (
      <p
        key={getRandomObjectId()}
        className={`tw-mb-0 tw-leading-6 tw-text-iron-200 tw-font-normal tw-whitespace-pre-wrap tw-break-words word-break tw-transition tw-duration-300 tw-ease-out ${textSizeClass}`}
      >
        {customRenderer(paragraphParams.children)}
      </p>
    );

    const { children } = params;
    const flattened = Children.toArray(children);

    const elements: ReactNode[] = [];
    let currentTextChunk: ReactNode[] = [];

    const flushTextChunk = () => {
      if (currentTextChunk.length > 0) {
        elements.push(renderP({ children: currentTextChunk }));
        currentTextChunk = [];
      }
    };

    for (const node of flattened) {
      const element = isValidElement(node);
      const src = element && (node.props as any)?.src;
      const href = element && (node.props as any)?.href;
      if (src || (href && isSmartLink(href))) {
        flushTextChunk();
        elements.push(node);
      } else {
        currentTextChunk.push(node);
      }
    }

    flushTextChunk();

    return <>{elements}</>;
  };

  const processContent = (content: string | null) => {
    if (!content) {
      return content;
    }

    return content.replace(/\n{4,}/g, (match: string) => {
      const numParagraphs = Math.floor(match.length / 2) - 1;
      const emptyParagraphs = Array(numParagraphs).fill("\n\n&nbsp;").join("");
      return "\n\n" + emptyParagraphs + "\n\n";
    });
  };

  return {
    customRenderer,
    renderParagraph,
    processContent,
  };
};
