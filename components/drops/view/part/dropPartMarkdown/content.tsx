import type {
  ClassAttributes,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";
import { Children, Fragment, cloneElement, isValidElement } from "react";
import type { ExtraProps } from "react-markdown";
import emojiRegex from "emoji-regex";

import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import { ApiDropGroupMention as ApiDropGroupMentionValue } from "@/generated/models/ApiDropGroupMention";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";
import DropListItemContentPart from "@/components/drops/view/item/content/DropListItemContentPart";
import {
  DropContentPartType,
  type DropListItemContentPartProps,
} from "@/components/drops/view/item/content/DropListItemContentPart.types";
import {
  ALL_GROUP_MENTION_TEXT,
  hasMentionedGroup,
  markAllGroupMentionTokens,
} from "@/helpers/waves/drop-group-mentions";
import { isDirectImageUrl } from "./linkUtils";
import { normalizeDropMarkdownContent } from "./normalizeContent";
import {
  DropPartMarkdownImageGroup,
  type DropPartMarkdownImageLayout,
} from "../DropPartMarkdownImage";

interface EmojiCategory {
  emojis: Array<{ id: string; skins: Array<{ src: string }> }>;
}

interface NativeEmojiSkin {
  native: string;
}

type FindNativeEmoji = (emojiId: string) => { skins: NativeEmojiSkin[] } | null;

interface CustomEmojiImageProps {
  readonly alt: string;
  readonly bigEmoji: boolean;
  readonly src: string | undefined;
}

interface MarkdownElementProps {
  readonly children?: ReactNode | undefined;
  readonly href?: unknown;
  readonly src?: unknown;
}

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

type MarkdownImageElement = ReactElement<{
  readonly children?: ReactNode | undefined;
  readonly href?: string | undefined;
  readonly layout?: DropPartMarkdownImageLayout | undefined;
  readonly src?: string | undefined;
}>;

type MarkdownLinkElement = ReactElement<{
  readonly href: string;
}>;

interface MarkdownImageChunkItem {
  readonly image: MarkdownImageElement;
  readonly flattenedIndex: number;
}

const customEmojiRegex = /(:\w+:)/g;
const nativeEmojiRegex = emojiRegex();

const isReactNodeArray = (
  content: ReactNode | undefined
): content is ReactNode[] => Array.isArray(content);

const isCustomEmojiToken = (value: string): boolean => {
  customEmojiRegex.lastIndex = 0;
  const isMatch = customEmojiRegex.test(value);
  customEmojiRegex.lastIndex = 0;
  return isMatch;
};

const getMarkdownElementProps = (
  node: ReactNode
): MarkdownElementProps | null =>
  isValidElement<MarkdownElementProps>(node) ? node.props : null;

const hasElementSrc = (
  elementProps: MarkdownElementProps | null
): elementProps is MarkdownElementProps & { readonly src: string } =>
  typeof elementProps?.src === "string" && elementProps.src.length > 0;

const getTextFromChildren = (children: ReactNode | undefined): string | null =>
  Children.toArray(children).reduce<string | null>((text, child) => {
    if (text === null) {
      return null;
    }

    if (typeof child === "string" || typeof child === "number") {
      return `${text}${child}`;
    }

    return null;
  }, "");

const getSmartHref = (
  elementProps: MarkdownElementProps | null
): string | null =>
  typeof elementProps?.href === "string" ? elementProps.href : null;

const getBareImageHref = (
  elementProps: MarkdownElementProps | null
): string | null => {
  const href = getSmartHref(elementProps);
  if (!href || !isDirectImageUrl(href)) {
    return null;
  }

  const linkText = getTextFromChildren(elementProps?.children);
  return linkText?.trim() === href.trim() ? href : null;
};

const isWhitespaceOnlyTextNode = (node: ReactNode): boolean =>
  typeof node === "string" && node.trim().length === 0;

const isMarkdownImageElement = (
  node: ReactNode
): node is MarkdownImageElement => {
  const elementProps = getMarkdownElementProps(node);
  return hasElementSrc(elementProps) || getBareImageHref(elementProps) !== null;
};

const getMarkdownImageSource = (image: MarkdownImageElement): string =>
  image.props.src ?? image.props.href ?? "";

const getMarkdownImageKey = ({
  flattenedIndex,
  image,
}: MarkdownImageChunkItem): string =>
  `markdown-image:${flattenedIndex}:${getMarkdownImageSource(image)}`;

const getMarkdownImageGroupKey = (
  items: readonly MarkdownImageChunkItem[]
): string =>
  `markdown-image-group:${items.map((item) => item.flattenedIndex).join("|")}`;

const isSmartLinkElement = (
  node: ReactNode,
  isSmartLink: (href: string) => boolean
): node is MarkdownLinkElement => {
  const href = getSmartHref(getMarkdownElementProps(node));
  return href !== null && href.length > 0 && isSmartLink(href);
};

const containsOnlyNativeEmojis = (str: string): boolean => {
  const text = str.trim();
  if (text.length === 0) {
    return true;
  }

  nativeEmojiRegex.lastIndex = 0;
  const hasEmoji = nativeEmojiRegex.test(text);
  nativeEmojiRegex.lastIndex = 0;

  if (!hasEmoji) {
    return false;
  }

  const textWithoutEmojis = text.replace(nativeEmojiRegex, "");
  nativeEmojiRegex.lastIndex = 0;

  return textWithoutEmojis.trim() === "";
};

const CustomEmojiImage = ({ alt, bigEmoji, src }: CustomEmojiImageProps) => (
  <img
    src={src}
    alt={alt}
    className={`${bigEmoji ? "emoji-node-big" : "emoji-node"}`}
  />
);

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
      <CustomEmojiImage
        src={emoji.skins[0]?.src}
        alt={emojiId}
        bigEmoji={bigEmoji}
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
      .filter((part) => part.length > 0)
      .every(
        (part) => isCustomEmojiToken(part) || containsOnlyNativeEmojis(part)
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

    return currentContent
      .split(splitter)
      .filter((part) => part !== "")
      .map((part): ReactNode => {
        const partProps = values[part];
        if (partProps) {
          const randomId = getRandomObjectId();
          return <DropListItemContentPart key={randomId} part={partProps} />;
        }

        const segments = part.split(customEmojiRegex);
        return segments.map(
          (segment): ReactNode =>
            isCustomEmojiToken(segment) ? (
              <Fragment key={getRandomObjectId()}>
                {renderEmoji(segment, areAllPartsEmojis)}
              </Fragment>
            ) : (
              <span
                key={getRandomObjectId()}
                className={areAllPartsEmojis ? "emoji-text-node" : undefined}
              >
                {segment}
              </span>
            )
        );
      });
  };

  const customRenderer = (content: ReactNode | undefined): ReactNode => {
    if (typeof content === "string") {
      return customPartRenderer(content);
    }

    if (isReactNodeArray(content)) {
      return content.map((child): ReactNode => {
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
    let currentImageChunk: MarkdownImageChunkItem[] = [];
    let pendingWhitespaceAfterImage: ReactNode[] = [];

    const flushTextChunk = () => {
      if (currentTextChunk.length > 0) {
        elements.push(renderP({ children: currentTextChunk }));
        currentTextChunk = [];
      }
    };

    const flushImageChunk = () => {
      if (currentImageChunk.length === 0) {
        return;
      }

      if (currentImageChunk.length === 1) {
        const [item] = currentImageChunk;
        if (item) {
          elements.push(item.image);
        }
        currentImageChunk = [];
        return;
      }

      elements.push(
        <DropPartMarkdownImageGroup
          key={getMarkdownImageGroupKey(currentImageChunk)}
        >
          {currentImageChunk.map((item) =>
            cloneElement(item.image, {
              key: getMarkdownImageKey(item),
              layout: "grouped",
            })
          )}
        </DropPartMarkdownImageGroup>
      );
      currentImageChunk = [];
    };

    const restorePendingWhitespaceAfterImage = () => {
      if (pendingWhitespaceAfterImage.length > 0) {
        currentTextChunk.push(...pendingWhitespaceAfterImage);
        pendingWhitespaceAfterImage = [];
      }
    };

    for (const [flattenedIndex, node] of flattened.entries()) {
      if (isMarkdownImageElement(node)) {
        flushTextChunk();
        pendingWhitespaceAfterImage = [];
        currentImageChunk.push({ image: node, flattenedIndex });
        continue;
      }

      if (currentImageChunk.length > 0 && isWhitespaceOnlyTextNode(node)) {
        pendingWhitespaceAfterImage.push(node);
        continue;
      }

      if (
        currentImageChunk.length > 0 &&
        isSmartLinkElement(node, isSmartLink)
      ) {
        flushImageChunk();
        pendingWhitespaceAfterImage = [];
        flushTextChunk();
        elements.push(node);
        continue;
      }

      if (currentImageChunk.length > 0) {
        flushImageChunk();
        restorePendingWhitespaceAfterImage();
      }

      if (isSmartLinkElement(node, isSmartLink)) {
        flushTextChunk();
        elements.push(node);
        continue;
      }

      currentTextChunk.push(node);
    }

    flushImageChunk();
    flushTextChunk();

    return <>{elements}</>;
  };

  return {
    customRenderer,
    renderParagraph,
    processContent: normalizeDropMarkdownContent,
  };
};
