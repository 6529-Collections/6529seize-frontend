import type { ClassAttributes, HTMLAttributes, ReactNode } from "react";
import { Children, Fragment, isValidElement } from "react";
import type { ExtraProps } from "react-markdown";
import emojiRegex from "emoji-regex";

import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import type { DropListItemContentPartProps } from "@/components/drops/view/item/content/DropListItemContentPart";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import { ApiDropGroupMention as ApiDropGroupMentionValue } from "@/generated/models/ApiDropGroupMention";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";
import DropListItemContentPart from "@/components/drops/view/item/content/DropListItemContentPart";
import {
  ALL_GROUP_MENTION_TEXT,
  hasMentionedGroup,
  markAllGroupMentionTokens,
} from "@/helpers/waves/drop-group-mentions";

export enum DropContentPartType {
  MENTION = "MENTION",
  GROUP_MENTION = "GROUP_MENTION",
  HASHTAG = "HASHTAG",
  WAVE_MENTION = "WAVE_MENTION",
}

interface EmojiCategory {
  emojis: Array<{ id: string; skins: Array<{ src: string }> }>;
}

interface NativeEmojiSkin {
  native: string;
}

type FindNativeEmoji = (emojiId: string) => { skins: NativeEmojiSkin[] } | null;

interface MarkdownContentConfig {
  readonly textSizeClass: string;
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly mentionedGroups: Array<ApiDropGroupMention>;
  readonly mentionedWaves: Array<ApiMentionedWave>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly emojiMap: EmojiCategory[];
  readonly findNativeEmoji: FindNativeEmoji;
  readonly isSmartLink: (href: string) => boolean;
}

interface MarkdownContentRenderers {
  readonly customRenderer: (content: ReactNode | undefined) => ReactNode;
  readonly renderParagraph: (
    params: ClassAttributes<HTMLParagraphElement> &
      HTMLAttributes<HTMLParagraphElement> &
      ExtraProps
  ) => ReactNode;
  readonly processContent: (content: string | null) => string | null;
}

const customEmojiRegex = /(:\w+:)/g;
const nativeEmojiRegex = emojiRegex();

const containsOnlyNativeEmojis = (str: string): boolean => {
  const text = str.trim();
  if (!text) {
    return true;
  }

  nativeEmojiRegex.lastIndex = 0;
  let hasEmoji = false;
  const textWithoutEmojis = text.replace(nativeEmojiRegex, () => {
    hasEmoji = true;
    return "";
  });
  nativeEmojiRegex.lastIndex = 0;

  return hasEmoji && textWithoutEmojis.trim() === "";
};

export const createMarkdownContentRenderers = ({
  textSizeClass,
  mentionedUsers,
  mentionedGroups,
  mentionedWaves,
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
          <span
            className={`${bigEmoji ? "emoji-text-node" : "tw-align-middle"}`}
          >
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
      ...(hasMentionedGroup(mentionedGroups, ApiDropGroupMentionValue.All)
        ? {
            [ALL_GROUP_MENTION_TEXT]: {
              type: DropContentPartType.GROUP_MENTION,
              value: ApiDropGroupMentionValue.All,
              match: ALL_GROUP_MENTION_TEXT,
            },
          }
        : {}),
      ...mentionedWaves.reduce(
        (acc, wave) => ({
          ...acc,
          [`#[${wave.wave_name_in_content}]`]: {
            type: DropContentPartType.WAVE_MENTION,
            value: wave,
            match: `#[${wave.wave_name_in_content}]`,
          },
        }),
        {}
      ),
      ...referencedNfts.reduce(
        (acc, nft) => ({
          ...acc,
          [`$[${nft.name}]`]: {
            type: DropContentPartType.HASHTAG,
            value: nft,
            match: `$[${nft.name}]`,
          },
        }),
        {}
      ),
    };

    const areAllPartsEmojis = content
      .split(customEmojiRegex)
      .filter((part) => !!part)
      .every(
        (part) => part.match(customEmojiRegex) || containsOnlyNativeEmojis(part)
      );

    let currentContent = content;

    for (const token of Object.values(values)) {
      if (token.type === DropContentPartType.GROUP_MENTION) {
        continue;
      }
      currentContent = currentContent.replaceAll(
        token.match,
        `${splitter}${token.match}${splitter}`
      );
    }

    if (hasMentionedGroup(mentionedGroups, ApiDropGroupMentionValue.All)) {
      currentContent = markAllGroupMentionTokens({
        content: currentContent,
        marker: splitter,
      });
    }

    const parts = currentContent
      .split(splitter)
      .filter((part) => part !== "")
      .map((part) => {
        const partProps = values[part];
        if (partProps) {
          const randomId = getRandomObjectId();
          return <DropListItemContentPart key={randomId} part={partProps} />;
        }

        const segments = part.split(customEmojiRegex);
        return segments.map((segment) =>
          segment.match(customEmojiRegex) ? (
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
    ) => {
      const paragraphChildren = Children.toArray(paragraphParams.children);
      const isBlankLineParagraph =
        paragraphChildren.length > 0 &&
        paragraphChildren.every(
          (child) =>
            typeof child === "string" &&
            child.replaceAll("\u00a0", "").trim().length === 0
        );

      if (isBlankLineParagraph) {
        return (
          <p
            key={getRandomObjectId()}
            aria-hidden="true"
            className="word-break tw-my-1 tw-h-2 tw-leading-none"
          >
            {"\u00a0"}
          </p>
        );
      }

      return (
        <p
          key={getRandomObjectId()}
          className={`word-break tw-mb-1.5 tw-mt-0 tw-whitespace-pre-wrap tw-break-words tw-font-normal tw-leading-6 tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out last:tw-mb-0 ${textSizeClass}`}
        >
          {customRenderer(paragraphParams.children)}
        </p>
      );
    };

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

    return content.replace(/\n{3,}/g, (match: string) => {
      const extraBlankLines = match.length - 2;
      const fillerParagraphs = Array(extraBlankLines)
        .fill("&nbsp;")
        .join("\n\n");
      return `\n\n${fillerParagraphs}\n\n`;
    });
  };

  return {
    customRenderer,
    renderParagraph,
    processContent,
  };
};
